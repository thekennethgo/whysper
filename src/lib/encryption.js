// Simple encryption utilities for our chat app
// This handles generating keys and encrypting/decrypting messages

// Helper function to safely convert base64 to Uint8Array
const base64ToArrayBuffer = (base64) => {
  try {
    // Handle base64 with potential invalid characters
    const binaryString = atob(base64.replace(/[-_]/g, (match) => {
      return match === '-' ? '+' : '/';
    }).replace(/\s/g, ''));
    
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Error converting base64 to array buffer:', error);
    throw new Error('Invalid base64 string');
  }
};

// Helper function to safely convert Uint8Array to base64
const arrayBufferToBase64 = (buffer) => {
  try {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Error converting array buffer to base64:', error);
    throw new Error('Error encoding to base64');
  }
};

// Generate a new key pair for a user
export const generateKeyPair = async () => {
  try {
    console.log('Generating new key pair...');
    
    // Create a new RSA key pair using the browser's crypto API
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,  // Key size - 2048 bits is standard
        publicExponent: new Uint8Array([1, 0, 1]),  // Standard exponent
        hash: "SHA-256",  // Hash function to use
      },
      true,  // Extractable - we need to export the keys
      ["encrypt", "decrypt"]  // What we can do with these keys
    );

    console.log('Key pair generated successfully!');

    // Export the public key so we can share it
    const publicKeyBuffer = await window.crypto.subtle.exportKey(
      "spki",  // Standard format for public keys
      keyPair.publicKey
    );
    
    // Convert to base64 string so we can store it easily
    const publicKeyString = arrayBufferToBase64(publicKeyBuffer);

    // Export the private key (we'll keep this secret)
    const privateKeyBuffer = await window.crypto.subtle.exportKey(
      "pkcs8",  // Standard format for private keys
      keyPair.privateKey
    );
    
    // Convert to base64 string
    const privateKeyString = arrayBufferToBase64(privateKeyBuffer);

    return {
      publicKey: publicKeyString,   // Share this with others
      privateKey: privateKeyString, // Keep this secret!
      keyPair: keyPair              // Keep the original key pair for later use
    };
  } catch (error) {
    console.error('Oops! Error generating keys:', error);
    throw error;
  }
};

// Encrypt a message using someone's public key
export const encryptMessage = async (message, publicKeyString) => {
  try {
    console.log('Encrypting message...');
    
    // Convert the base64 public key back to a format the browser can use
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyString);
    
    // Import the public key
    const publicKey = await window.crypto.subtle.importKey(
      "spki",  // It's a public key
      publicKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,  // Not extractable
      ["encrypt"]  // We can only encrypt with public keys
    );

    // Convert our message to bytes
    const messageBytes = new TextEncoder().encode(message);
    
    // Encrypt the message
    const encryptedBytes = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      publicKey,
      messageBytes
    );

    // Convert the encrypted bytes to a string we can send
    const encryptedString = arrayBufferToBase64(encryptedBytes);
    
    console.log('Message encrypted successfully!');
    return encryptedString;
  } catch (error) {
    console.error('Oops! Error encrypting message:', error);
    throw error;
  }
};

// Decrypt a message using our private key
export const decryptMessage = async (encryptedMessage, privateKeyString) => {
  try {
    console.log('Decrypting message...');
    
    // Convert the base64 private key back to a format the browser can use
    const privateKeyBuffer = base64ToArrayBuffer(privateKeyString);
    
    // Import the private key
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",  // It's a private key
      privateKeyBuffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,  // Not extractable
      ["decrypt"]  // We can only decrypt with private keys
    );

    // Convert the encrypted string back to bytes
    const encryptedBytes = base64ToArrayBuffer(encryptedMessage);
    
    // Decrypt the message
    const decryptedBytes = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      privateKey,
      encryptedBytes
    );

    // Convert the decrypted bytes back to text
    const decryptedMessage = new TextDecoder().decode(decryptedBytes);
    
    console.log('Message decrypted successfully!');
    return decryptedMessage;
  } catch (error) {
    console.error('Oops! Error decrypting message:', error);
    throw error;
  }
};

// Save our private key in the browser's storage
// We encrypt it with the room password so it's not just sitting there
export const storePrivateKey = (roomId, privateKey, roomPassword) => {
  try {
    console.log('Storing private key for room:', roomId);
    
    // Simple way to "encrypt" the private key with the room password
    // In a real app, you'd use a proper encryption library
    const encryptedKey = btoa(privateKey + roomPassword);
    
    // Save it in the browser's local storage
    localStorage.setItem(`private_key_${roomId}`, encryptedKey);
    
    console.log('Private key stored successfully!');
  } catch (error) {
    console.error('Oops! Error storing private key:', error);
    throw error;
  }
};

// Get our private key from browser storage
export const getPrivateKey = (roomId, roomPassword) => {
  try {
    console.log('Getting private key for room:', roomId);
    
    // Get the encrypted key from storage
    const encryptedKey = localStorage.getItem(`private_key_${roomId}`);
    
    if (!encryptedKey) {
      console.log('No private key found for this room');
      return null;
    }
    
    // "Decrypt" it by removing the room password
    const privateKey = atob(encryptedKey).replace(roomPassword, '');
    
    console.log('Private key retrieved successfully!');
    return privateKey;
  } catch (error) {
    console.error('Oops! Error getting private key:', error);
    return null;
  }
};

// Helper function to check if we have a private key for a room
export const hasPrivateKey = (roomId) => {
  const key = localStorage.getItem(`private_key_${roomId}`);
  return key !== null;
};

// Helper function to remove a private key (when leaving a room)
export const removePrivateKey = (roomId) => {
  try {
    console.log('Removing private key for room:', roomId);
    localStorage.removeItem(`private_key_${roomId}`);
    console.log('Private key removed successfully!');
  } catch (error) {
    console.error('Oops! Error removing private key:', error);
  }
};