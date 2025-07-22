'use client';
import { useState } from 'react';

export default function PasswordPrompt({ onSubmit, error }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(input);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 shadow-lg rounded-lg p-8 flex flex-col items-center"
    >
      <h2 className="text-2xl font-bold mb-4">Enter Room Password</h2>
      <input
        type="password"
        className="border rounded px-4 py-2 mb-2 w-64 text-lg"
        placeholder="Room password"
        value={input}
        onChange={e => setInput(e.target.value)}
        autoFocus
      />
      {error && (
        <div className="text-red-600 mb-2">{error}</div>
      )}
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
      >
        Enter
      </button>
    </form>
  );
}