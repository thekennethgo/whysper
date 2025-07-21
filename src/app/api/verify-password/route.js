import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  const { roomId, inputPassword } = await req.json();

  const { data: room, error } = await supabase
    .from('rooms')
    .select('password')
    .eq('id', roomId)
    .single();

  if (error || !room) {
    return new Response(JSON.stringify({ success: false, error: 'Room not found' }), { status: 404 });
  }

  const isValid = await bcrypt.compare(inputPassword, room.password);

  if (isValid) {
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } else {
    return new Response(JSON.stringify({ success: false, error: 'Incorrect password' }), { status: 401 });
  }
}