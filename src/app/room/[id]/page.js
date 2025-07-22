'use client';
import React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatRoom } from '@/components/ChatRoom';
import PasswordPrompt from '@/components/PasswordPrompt';
import {
  getPrivateKey,
  importPrivateKey,
  importPublicKey,
  generateAESKey,
  importAESKey,
  exportAESKey,
  encryptAESKeyWithRSA,
  decryptAESKeyWithRSA,
} from '@/lib/encryption';

export default function RoomPage({ params }) {
  const { id: roomId } = React.use(params);
  const [room, setRoom] = useState(null);
  const [isCreator, setIsCreator] = useState(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);

  const [aesKey, setAesKey] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  let username = '';
  if (typeof window !== 'undefined') {
    username = sessionStorage.getItem('chat_username') || localStorage.getItem('chat_username') || '';
  }

  useEffect(() => {
    async function checkRole() {
      if (!username || !roomId) {
        setLoading(false);
        return;
      }
      const { data: roomData } = await supabase
        .from('rooms')
        .select('creator_name')
        .eq('id', roomId)
        .single();

      if (!roomData) {
        setPasswordError("This room does not exist.");
        setLoading(false);
        return;
      }
      
      const creatorCheck = username === roomData.creator_name;
      setIsCreator(creatorCheck);

      if (!creatorCheck) {
        setPassword('guest_verified');
        setLoading(false);

      } else {
        setLoading(false);
      }
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
        .select('*')
        .eq('id', roomId)
        .single();
      setRoom(initialRoom);
      // --- GUEST LOGIC ---
      if (!isCreator) {
        const storedAesKeyB64 = sessionStorage.getItem(`aesKey_${roomId}`);
        if (storedAesKeyB64) {
          console.log("reload");
          const key = importAESKey(storedAesKeyB64);
          setAesKey(key);
        } else if (initialRoom.creator_key && !initialRoom.session_key) {
          console.log("updated");
          // First time joining: generate, store, and upload the key.
          const aes = await generateAESKey();
          const exportedKeyB64 = exportAESKey(aes);
          sessionStorage.setItem(`aesKey_${roomId}`, exportedKeyB64);
          
          const creatorPubKey = await importPublicKey(initialRoom.creator_key);
          const encryptedAES = await encryptAESKeyWithRSA(aes, creatorPubKey);
          
          await supabase
            .from('rooms')
            .update({ session_key: encryptedAES })
            .eq('id', roomId);
          setAesKey(aes);
          console.log("updated");
        }
        setReady(true);
      }

      // --- CREATOR LOGIC ---
      if (isCreator) {
        console.log("brooo");
        const privateKeyB64 = await getPrivateKey(roomId, password);
        if (!privateKeyB64) {
          setPasswordError('Could not retrieve your private key. Wrong password?');
          setPassword('');
          setLoading(false);
          return;
        }

        const privKey = await importPrivateKey(privateKeyB64);
        setPrivateKey(privKey);

        if (initialRoom.session_key && privKey) {
          console.log("Encrypted AES=" + initialRoom.session_key);
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
                  console.log("SESSION_KEY" + updated.session_key);
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
        <div className="w-full max-w-4xl min-h-[100px] bg-white/80 dark:bg-gray-800/70 backdrop-blur-md rounded-lg shadow-xl flex">
          <ChatRoom
            room={room}
            username={username}
            aesKey={aesKey}
          />
      </div>
      )}
    </div>
  );
}