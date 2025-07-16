import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { supabase } from '@/lib/supabase';

export async function POST(req) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const body = await req.json();

  const allowed = await rateLimit(ip, 'create-room', 10, 3600);

  if (!allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }
  const { roomName, creatorName, description, password } = body;

  const { data, error } = await supabase
    .from('rooms')
    .insert({
      room_name: roomName.trim(),
      creator_name: creatorName.trim(),
      description: description.trim(),
      password,
      is_active: true,
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ room: data[0] });
}
