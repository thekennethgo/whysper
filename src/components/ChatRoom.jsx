'use client';
import { useState, useEffect, useRef } from 'react';
import ably from '@/lib/ably';

export function ChatRoom({ room, username }) {

  return (
    <div>
      <p>{room.room_name}</p>
      <p>{room.creator_name}</p>
      <p>{room.description}</p>
    </div>
  );
}