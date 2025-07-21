'use client';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

import { supabase } from '@/lib/supabase';
import { generateKeyPair, storePrivateKey } from '@/lib/encryption';

export function JoinRoomModal({ room, isOpen, onClose, onJoin }) {
  const router = useRouter();
  const [ username, setUsername ] = useState('');
  const [ password, setPassword ] = useState('');
  const [ isLoading, setIsLoading ] = useState(false);
  const [ error, setError ] = useState('');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (!password.trim()) {
      setError('Please enter the password');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id, inputPassword: password }),
      });
      const result = await response.json();
  
      if (!result.success) {
        setError(result.error || 'Incorrect password');
        setIsLoading(false);
        setPassword('');
        return;
      }

      const { publicKey, privateKey } = await generateKeyPair();
  
      await supabase
      .from('rooms')
      .update({
        is_locked: true,
        guest_key: publicKey
      })
      .eq('id', room.id);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('chat_username', username);
        localStorage.setItem('chat_username', username);
      }

      storePrivateKey(room.id, privateKey, password);
      router.push(`/room/${room.id}`)
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
      setPassword('');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle>{room?.room_name}</DialogTitle>
          <DialogDescription>
            Created by {room?.creator_name} • {room && formatDate(room.created_at)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <p>
            {room && room.description}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter display name"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Joining...' : 'Join Room'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}