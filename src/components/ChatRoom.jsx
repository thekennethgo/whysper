// src/components/ChatRoom.jsx
'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AblyClient from '@/lib/ably';
import { Button } from "@/components/ui/button";
import {
  encryptMessageWithAES,
  decryptMessageWithAES
} from '@/lib/encryption';
import MessageBubble from './MessageBubble';

export function ChatRoom({room, username, aesKey, onChatEnd}) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const [chatEndedMessage, setChatEndedMessage] = useState(null);
  const chatHasStarted = useRef(false);

  const channelRef = useRef(null);
  const ablyRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const ably = AblyClient.getInstance(username);
    ablyRef.current = ably;
    const channel = ably.channels.get(`room-${room.id}`);
    channelRef.current = channel;

    const presence = channel.presence;

    const endTheChat = () => {
      if (onChatEnd) onChatEnd(); 
      setChatEndedMessage("The other user has left. The chat has ended.");
      if (ablyRef.current) {
        ablyRef.current.close();
        AblyClient.close();
      }
    };

    const handlePresenceUpdate = async () => {
        const members = await presence.get();
        const userCount = members.length;

        if (userCount === 2) {
          chatHasStarted.current = true;
        }
        if (chatHasStarted.current && userCount < 2) {
          endTheChat();
        }
    };

    presence.subscribe(['enter', 'leave', 'absent'], handlePresenceUpdate);
    presence.enter();
    handlePresenceUpdate();

    const messageHandler = async (msg) => {
      let ciphertext = msg.data.ciphertext;
      setMessages((prev) => [...prev, {
        ...msg.data,
        text: ciphertext
      }]);
    };

    channel.subscribe('message', messageHandler);
  
    return () => {
      channel.unsubscribe(messageHandler);
      presence.unsubscribe(['enter', 'leave', 'absent'], handlePresenceUpdate);
      try {
        presence.leave();
      } catch (e) {
        console.log("Could not leave presence on unmount, connection may already be closed.");
      }
    };
  }, [room.id, aesKey, username, onChatEnd]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !aesKey) return;
    try {
      const { ciphertext, iv } = await encryptMessageWithAES(input.trim(), aesKey);
      await channelRef.current.publish('message', {
        username,
        ciphertext,
        iv,
        length: input.trim().length
      });
      setInput('');
    } catch (error) {
      alert('Failed to send message: ' + error.message);
    }
  };

  const endChat = async () => {
    if (onChatEnd) onChatEnd(); 

    if (channelRef.current) {
      try {
        await channelRef.current.presence.leave();
      } catch (error) {
        console.warn("Could not leave presence cleanly, connection might have been closed already.", error);
      }
    }
    if (ablyRef.current) {
      ablyRef.current.close()
      AblyClient.close();
    }
    setChatEndedMessage("You have ended the chat");
  };

  if (chatEndedMessage) {
    return (
      <div className="flex flex-col w-full h-full items-center justify-center text-center p-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{chatEndedMessage}</h2>
        <Button onClick={() => router.push('/')}>Return to Home</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">{room.room_name}</h1>
        <Button onClick={endChat} variant="destructive">
          End Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2 rounded">
        {messages.map((msg, idx) => (
          <MessageBubble
            key={idx}
            message={msg}
            isOwn={msg.username === username}
            onDecrypt={() => decryptMessageWithAES(
              msg.ciphertext,
              msg.iv,
              aesKey
            )}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 mt-2 p-2 rounded"
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
          className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
}