// src/components/ChatRoom.jsx
'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AblyClient from '@/lib/ably';
import { Button } from "@/components/ui/button";
import { encryptMessage, decryptMessage, getPrivateKey } from '@/lib/encryption';
import MessageBubble from './MessageBubble';

export function ChatRoom({room, username}) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const channelRef = useRef(null);
  const ablyRef = useRef(null);
  const messagesEndRef = useRef(null);
  const privateKeyRef = useRef(null);
  const otherPublicKeyRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  useEffect(() => {
    const privateKey = getPrivateKey(room.id, room.password);
    privateKeyRef.current = privateKey;

    const otherPublicKey = room.guest_key;
    otherPublicKeyRef.current = otherPublicKey;

    const ably = AblyClient.getInstance(username);
    ablyRef.current = ably;
    const channel = ably.channels.get(`room-${room.id}`);
    channelRef.current = channel;

    channel.subscribe('message', async (msg) => {
      let decryptedText = msg.data.text;

      // try {
      //   decryptedText = await decryptMessage(msg.data.text, privateKeyRef.current);
      // } catch (e) {
      //   decryptedText = 'Failed to decrypt';
      // }

      setMessages((prev) => [...prev, {
        ...msg.data,
        text: decryptedText
      }]);
    });

    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    return () => {
      channel.unsubscribe();
    };
  }, [room.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const cleanup = () => {
    try {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
      if (ablyRef.current) {
        ablyRef.current.close();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  const endChat = () => {
    cleanup();
    AblyClient.close();
    router.push('/');
  }

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      if (!otherPublicKeyRef.current) {
        throw new Error('No public key available for encryption');
      }
      if (!channelRef.current) {
        throw new Error('No channel available for sending');
      }
      const encryptedText = await encryptMessage(input.trim(), otherPublicKeyRef.current);
      
      await channelRef.current.publish('message', {
        username: username,
        text: encryptedText,
        length: input.trim().length,
        timestamp: Date.now()
      });

      setInput('');
    } catch (error) {
      console.error('Error sending encrypted message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{room.room_name}</h1>
        <Button onClick={endChat} variant="destructive">
          End Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 rounded">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            isOwn={msg.username === username}
            onDecrypt={encryptedText => decryptMessage(encryptedText, privateKeyRef.current)}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 mt-2 p-2 bg-white rounded"
      >
        <input
          className="flex-1 border rounded px-3 py-2 focus:outline-none"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}