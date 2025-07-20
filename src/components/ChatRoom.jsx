// src/components/ChatRoom.jsx
'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AblyClient from '@/lib/ably';
import { Button } from "@/components/ui/button";

export function ChatRoom({ room, username}) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [canSend, setCanSend] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const channelRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const ably = AblyClient.getInstance(username);
    const channel = ably.channels.get(`room-${room.id}`);
    channelRef.current = channel;

    channel.subscribe('message', (msg) => {
      setMessages((prev) => [...prev, msg.data]);
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
        channelRef.current = null;
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
    const message = {
      user: username,
      text: input,
      timestamp: Date.now(),
    };
    await channelRef.current.publish('message', message);
    setInput('');
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
        {messages.map((msg, idx) => {
          const isMe = msg.user === username;
          return (
            <div
              key={idx}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-4 py-2 rounded-lg max-w-xs break-words ${
                  isMe
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                <div className="text-xs font-semibold mb-1">{msg.user}</div>
                <div>{msg.text}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {!canSend && (
        <div className="text-center text-gray-500 my-4">
          Waiting for your partner...
        </div>
      )}
      
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