'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChatRoom } from '@/components/ChatRoom';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.id;

  const username = sessionStorage.getItem('chat_username');
  const [room, setRoom] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data, error } = await supabase
          .from('room_info')
          .select('*')
          .eq('id', roomId)
          .eq('is_active', true)
          .single();

        if (error) throw error;
        setRoom(data);
      } catch (error) {
        console.error('Error fetching room:', error);
        setError('Room not found or inactive');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Loading room...</p>
          <p className="text-sm text-gray-500 mt-2">Connecting to chat</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Room not found'}</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <div className="bg-white border-b px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Chat Room</h1>
        <button onClick={() => router.push('/')} className="text-gray-500 hover:text-gray-700">
          Return to Home
        </button>
      </div>

      <ChatRoom room={room} username={username} />
    </div>
  );
}