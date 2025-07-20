import { useEffect, useState, useRef } from 'react';

export default function MessageBubble({ message, isOwn, onDecrypt }) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [error, setError] = useState(null);
  const hasDecrypted = useRef(false);

  let encrypted = message.text.slice(0, message.length);

  useEffect(() => {
    if (isOwn && !hasDecrypted.current) {
      hasDecrypted.current = true;
      (async () => {
        try {
          const decrypted = await onDecrypt(message.text);
          setDisplayText(decrypted);
          setIsRevealed(true);
        } catch (e) {
          setError('Failed to decrypt');
        }
      })();
    }
  }, []);

  const handleDecrypt = async () => {
    if (isRevealed || isDecrypting) return;
    setIsDecrypting(true);
    setError(null);

    try {
      const decrypted = await onDecrypt(message.text);
      setDisplayText(encrypted);

      let i = 0;
      function revealNext() {
        // Replace the i-th character with the correct one
        encrypted =
          encrypted.slice(0, i) +
          (decrypted[i] || '') +
          encrypted.slice(i + 1);

        setDisplayText(encrypted);

        if (i < encrypted.length) {
          setTimeout(revealNext, 100);
          i++;
        } else {
          setIsRevealed(true);
          setIsDecrypting(false);
        }
      }
      setTimeout(revealNext, 50);
    } catch (e) {
      setError('Failed to decrypt');
      setIsDecrypting(false);
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`px-4 py-2 rounded-lg max-w-xs break-words cursor-pointer transition-all duration-300 ${
          isOwn
            ? 'bg-blue-500 text-white rounded-br-none'
            : 'bg-gray-800 text-white rounded-bl-none'
        }`}
        onClick={handleDecrypt}
        tabIndex={0}
        role="button"
        aria-label="Decrypt message"
      >
        <div className="text-xs font-semibold mb-1">{message.username}</div>
        <div>
          {error && <span className="text-red-500">{error}</span>}
          {!isRevealed && !isDecrypting && !error && (
            <span className="text-gray-500">{encrypted}</span>
          )}
          {isDecrypting && (
            <span className="text-green-600">{displayText}</span>
          )}
          {isRevealed && !error && (
            <span className="transition-opacity duration-500">{displayText}</span>
          )}
        </div>
      </div>
    </div>
  );
}