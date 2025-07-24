import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const body = await req.json();

  const allowed = await rateLimit(ip, 'create-room', 10, 3600);

  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  const { roomName, creatorName, description, password, creatorKey } = body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      room_name: roomName.trim(),
      creator_name: creatorName.trim(),
      description: description.trim(),
      password: hashedPassword,
      is_locked: false,
      guest_name: null,
      creator_key: creatorKey,
      session_key: null
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ room: data[0] });
}
