'use client';
import React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ChatRoom } from '@/components/ChatRoom';
import PasswordPrompt from '@/components/PasswordPrompt';
import {
  getPrivateKey,
  importPrivateKey,
  importPublicKey,
  generateAESKey,
  encryptAESKeyWithRSA,
  decryptAESKeyWithRSA,
} from '@/lib/encryption';
import { Button } from "@/components/ui/button";

export default function RoomPage({ params }) {
  const router = useRouter();
  const { id: roomId } = React.use(params);
  const [room, setRoom] = useState(null);
  const [isCreator, setIsCreator] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const [aesKey, setAesKey] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  let username = '';
  if (typeof window !== 'undefined') {
    username = sessionStorage.getItem('chat_username') || localStorage.getItem('chat_username') || '';
  }

  const deactivateRoom = useCallback(async () => {
    try {
      await supabase
        .from('rooms')
        .update({ is_active: false })
        .eq('id', roomId);
    } catch (error) {
      console.error("Failed to deactivate room:", error);
    }
  }, [roomId]);

  useEffect(() => {
    async function checkRole() {
      if (!username || !roomId) {
        setLoading(false);
        return;
      }
      const { data: roomData } = await supabase
        .from('rooms')
        .select('creator_name, guest_name, is_active')
        .eq('id', roomId)
        .single();

      if (!roomData) {
        setPasswordError("This room does not exist.");
        setLoading(false);
        return;
      }

      if (!roomData.is_active) {
        setPasswordError("This chat has ended.");
        setAccessDenied(true);
        setLoading(false);
        return;
      }
      
      const isUserTheCreator = username === roomData.creator_name;
      const isUserTheGuest = username === roomData.guest_name;

      if (!isUserTheCreator && !isUserTheGuest) {
        setAccessDenied(true);
        setPasswordError("You are not authorized to enter this room.");
        setLoading(false);
        return;
      }
      setIsCreator(isUserTheCreator);

      if (isUserTheGuest) {
        setPassword('guest_verified');
      }
      setLoading(false);
    }
    checkRole();
  }, [roomId, username]);

  useEffect(() => {
    if (!password || isCreator === null) return;

    let subscription = null;

    async function fetchAndSubscribe() {
      setLoading(true);
      const { data: initialRoom } = await supabase
        .from('rooms')
        .select('id, room_name, creator_key, session_key')
        .eq('id', roomId)
        .single();
      setRoom(initialRoom);
      // --- GUEST LOGIC ---
      if (!isCreator) {
        if (initialRoom.creator_key && !initialRoom.session_key) {
          const aes = await generateAESKey();

          const creatorPubKey = await importPublicKey(initialRoom.creator_key);
          const encryptedAES = await encryptAESKeyWithRSA(aes, creatorPubKey);
          
          await supabase
            .from('rooms')
            .update({ session_key: encryptedAES })
            .eq('id', roomId);
          setAesKey(aes);
        }
        setReady(true);
      }

      // --- CREATOR LOGIC ---
      if (isCreator) {
        const privateKeyB64 = await getPrivateKey(roomId, password);
        if (!privateKeyB64) {
          setPasswordError('Could not retrieve your private key. Wrong password?');
          setPassword('');
          setLoading(false);
          return;
        }

        const privKey = await importPrivateKey(privateKeyB64);

        if (initialRoom.session_key && privKey) {
          const aes = await decryptAESKeyWithRSA(initialRoom.session_key, privKey);
          setAesKey(aes);
          setReady(true);
          setLoading(false);
          if (subscription) subscription.unsubscribe();
          return;
        } else {
          subscription = supabase
            .channel(`room-${roomId}-wait`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
              (payload) => {
                const updated = payload.new;
                setRoom(updated);
                if (updated.session_key && privKey) {
                  decryptAESKeyWithRSA(updated.session_key, privKey)
                    .then((aes) => {
                      setAesKey(aes);
                      setReady(true);
                      subscription?.unsubscribe();
                  })
                }
              }
            )
            .subscribe();
        }
      }

      setLoading(false);
    }

    fetchAndSubscribe();
    return () => {
      subscription?.unsubscribe();
    };
  }, [roomId, password, isCreator]);

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="w-[700px] h-[700px] bg-blue-400/20 dark:bg-blue-900/15 rounded-full blur-[120px]" />
        </div>
        <div className='flex flex-col justify-center items-center'>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-5">{passwordError}</p>

          <Button onClick={() => router.push('/')}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-[700px] h-[700px] bg-blue-400/20 dark:bg-blue-900/15 rounded-full blur-[120px]" />
      </div>

      {!password && isCreator && (
        <PasswordPrompt
          onSubmit={(pw) => {
            if (!pw.trim()) {
              setPasswordError('Password required');
              return;
            }
            setPassword(pw);
            setPasswordError('');
          }}
          error={passwordError}
        />
      )}

      {password && loading && (
        <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Setting up secure room...</h2>
        </div>
      )}

      {password && !loading && !ready && (
        <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Waiting for other participant...</h2>
        </div>
      )}

      {ready && aesKey && room && (
        <div className="w-full h-screen md:h-[calc(100vh-2rem)] max-w-4xl bg-white/80 dark:bg-gray-800/70 backdrop-blur-md md:rounded-2xl shadow-xl flex flex-col overflow-hidden">
          <ChatRoom
            room={room}
            username={username}
            aesKey={aesKey}
            onChatEnd={deactivateRoom}
          />
      </div>
      )}
    </div>
  );
}