
// --- RSA Key Generation, Export, Import ---
export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
  return keyPair;
}

export async function exportPublicKey(key) {
  const spki = await window.crypto.subtle.exportKey("spki", key);
  return btoa(String.fromCharCode(...new Uint8Array(spki)));
}

export async function importPublicKey(spkiB64) {
  const spki = Uint8Array.from(atob(spkiB64), c => c.charCodeAt(0));
  return window.crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

export async function exportPrivateKey(key) {
  const pkcs8 = await window.crypto.subtle.exportKey("pkcs8", key);
  return btoa(String.fromCharCode(...new Uint8Array(pkcs8)));
}

export async function importPrivateKey(pkcs8B64) {
  const pkcs8 = Uint8Array.from(atob(pkcs8B64), c => c.charCodeAt(0));
  return window.crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["decrypt"]
  );
}

// --- AES Key Generation, Export, Import ---
export async function generateAESKey() {
  return window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportAESKey(key) {
  const raw = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(raw)));
}

export async function importAESKey(rawB64) {
  const raw = Uint8Array.from(atob(rawB64), c => c.charCodeAt(0));
  return window.crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// --- Encrypt/Decrypt AES Key with RSA ---
export async function encryptAESKeyWithRSA(aesKey, recipientPublicKey) {
  const rawAES = await window.crypto.subtle.exportKey("raw", aesKey);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawAES
  );
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

export async function decryptAESKeyWithRSA(encryptedAESB64, myPrivateKey) {
  try {
    const encrypted = Uint8Array.from(atob(encryptedAESB64), c => c.charCodeAt(0));
    const rawAES = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      myPrivateKey,
      encrypted
    );

    return window.crypto.subtle.importKey(
      "raw",
      rawAES,
      { name: "AES-GCM" },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (err) {
    console.error("Failed to decrypt AES key with RSA:", err);
    throw err;
  }
}
// --- Encrypt/Decrypt Message with AES-GCM ---
export async function encryptMessageWithAES(plaintext, aesKey) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const encoder = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoder.encode(plaintext)
  );
  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decryptMessageWithAES(ciphertextB64, ivB64, aesKey) {
  const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}

// Helper: Derive a key from password using PBKDF2
async function deriveKeyFromPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100_000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// Store private key in localStorage, encrypted with password
export async function storePrivateKey(roomId, privateKeyB64, password) {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassword(password, salt);

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(privateKeyB64)
  );

  // Store as JSON string: { salt, iv, ciphertext }
  const data = {
    salt: btoa(String.fromCharCode(...salt)),
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext)))
  };
  localStorage.setItem(`privateKey_${roomId}`, JSON.stringify(data));
}

// Retrieve and decrypt private key from localStorage
export async function getPrivateKey(roomId, password) {
  const dataStr = localStorage.getItem(`privateKey_${roomId}`);
  if (!dataStr) return null;
  const data = JSON.parse(dataStr);
  const salt = Uint8Array.from(atob(data.salt), c => c.charCodeAt(0));
  const iv = Uint8Array.from(atob(data.iv), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(data.ciphertext), c => c.charCodeAt(0));
  const key = await deriveKeyFromPassword(password, salt);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted); // This is the base64-encoded private key
  } catch (e) {
    return null; // Wrong password or tampered data
  }
}
