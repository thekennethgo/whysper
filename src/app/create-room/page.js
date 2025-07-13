'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/lib/supabase';

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
    
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert([
          {
            room_name: formData.roomName.trim(),
            creator_name: formData.creatorName.trim(),
            description: formData.description.trim(),
            password: formData.password,
            is_active: true
          }
        ])
        .select();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Room name already exists. Please choose a different name.');
        }
        throw error;
      }

      alert(`Room "${formData.roomName}" created successfully!`);
      router.push('/')
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Link href="/">
        <Button>Return to Home</Button>
      </Link>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Room</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div>
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
      </div>
    </div>
  );
}