// lib/rateLimit.ts
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function rateLimit(ip, action, limit, windowSec) {
  const key = `rate:${action}:${ip}`;

  const res = await fetch(`${REDIS_URL}/incr/${key}`, {
    headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
  });
  const data = await res.json();
  const count = data.result;

  if (count === 1) {
    await fetch(`${REDIS_URL}/expire/${key}/${windowSec}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` }
    });
  }

  return count <= limit;
}
