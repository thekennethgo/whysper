'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from '@/lib/supabase'
import { JoinRoomModal } from '@/components/JoinRoomModal';
import { useRouter } from 'next/navigation';

export default function JoinRoom() {
  const router = useRouter();

  const [ rooms, setRooms ] = useState([]);
  const [ isLoading, setIsLoading ] = useState(false);
  const [ error, setError ] = useState('');

  const [ selectedRoom, setSelectedRoom ] = useState(null);
  const [ isModalOpen, setIsModalOpen ] = useState(false);

  useEffect(() => {
    fetchRooms();
    const channel = supabase
      .channel('rooms')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRooms(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setRooms(prev => prev.filter(room => room.id !== payload.old.id));
          } else if (payload.eventType === 'UPDATE') {
            setRooms(prev => prev.map(room => 
              room.id === payload.new.id ? payload.new : room
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('public_room_info')
        .select('*')
        .eq('is_locked', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      setError('Failed to load rooms');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-[700px] h-[700px] bg-blue-400/20 dark:bg-blue-400/15 rounded-full blur-[120px]" />
      </div>

      <div className="border-b px-8 py-4 w-full flex justify-between items-center">
        <h1 className="text-xl font-bold">Join a room</h1>
        <button onClick={() => router.push('/')} className="text-white hover:text-gray-700">
          Return to Home
        </button>
      </div>

      <div className="w-full max-w-xl px-4 py-8 flex-1 flex flex-col justify-center items-center relative z-10">
        {error && (
          <div>
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white-500 mb-4">No rooms available</p>
            <Link href="/create-room">
              <Button>Create a room</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 w-full">
            {rooms.map((room) => (
              <Card 
                key={room.id} 
                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                onClick={() => {
                  setSelectedRoom(room);
                  setIsModalOpen(true);
                }}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{room.room_name}</CardTitle>
                  <p className="text-sm text-gray-500">
                    {room.creator_name}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
      <JoinRoomModal
        room={selectedRoom}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRoom(null);
        }}
      />
    </div>
  );
}