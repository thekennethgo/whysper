'use client';

import Ably from 'ably';

class AblyClient {
  static instance = null;

  static getInstance(username) {
    if (typeof window === "undefined") {
      return null;
    }

    if (!AblyClient.instance) {
      AblyClient.instance = new Ably.Realtime({
        key: process.env.NEXT_PUBLIC_ABLY_API_KEY,
        clientId: username
      });
    }
    return AblyClient.instance;
  }

  static close() {
    if (AblyClient.instance) {
      AblyClient.instance.close();
      AblyClient.instance = null;
    }
  }
}

export default AblyClient;