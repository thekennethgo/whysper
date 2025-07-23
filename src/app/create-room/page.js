'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { generateRSAKeyPair, exportPublicKey, exportPrivateKey, storePrivateKey } from '@/lib/encryption';

export default function CreateRoom() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    roomName: '',
    creatorName: '',
    description: '',
    password: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.roomName.trim()) {
      setError('Please enter a room name');
      return;
    }

    if (!formData.creatorName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (formData.password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }

    setIsLoading(true);

    const rsaKeyPair = await generateRSAKeyPair();
    const publicKey = await exportPublicKey(rsaKeyPair.publicKey);
    const privateKey = await exportPrivateKey(rsaKeyPair.privateKey);

    const res = await fetch('/api/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: formData.roomName,
        creatorName: formData.creatorName,
        description: formData.description,
        password: formData.password,
        creatorKey: publicKey
      }),
    });
    
    const data = await res.json();

    setIsLoading(false);

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      return;
    }
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('chat_username', formData.creatorName);
      localStorage.setItem('chat_username', formData.creatorName);
    }

    await storePrivateKey(data.room.id, privateKey, formData.password);
    router.push(`/room/${data.room.id}`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="w-[700px] h-[700px] bg-blue-400/20 dark:bg-blue-900/15 rounded-full blur-[120px]" />
      </div>

      <header className="border-b border-gray-200 dark:border-gray-700 px-4 sm:px-8 py-3 w-full flex justify-between items-center shrink-0 z-10">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Create a Private Room</h1>
        <Button onClick={() => router.push('/')} variant="ghost">
          Return to Home
        </Button>
      </header>

      <main className="flex-grow w-full flex items-center justify-center p-4">
        <Card className="w-full max-w-xl bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-xl">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="roomName">Room Name *</Label>
                <Input
                  id="roomName"
                  name="roomName"
                  value={formData.roomName}
                  onChange={handleChange}
                  placeholder="Enter room name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomName">Display Name *</Label>
                <Input
                  id="creatorName"
                  name="creatorName"
                  value={formData.creatorName}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What's this room about?"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password (min 4 characters)"
                  required
                />
              </div>

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating Room...' : 'Create Room'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}