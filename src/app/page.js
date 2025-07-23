'use client';
import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[700px] h-[700px] bg-blue-400/20 dark:bg-blue-400/15 rounded-full blur-[120px]" />
      </div>
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Whysper
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Private End-to-End Encrypted Chat App
        </p>
      </div>

      <div className="w-full lg:w-4/5 mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/create-room">
          <Card className="hover:scale-105 hover:shadow-2xl transition-all cursor-pointer bg-white/80 dark:bg-gray-800/70 backdrop-blur border-0">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <CardTitle>Create Room</CardTitle>
              <CardDescription>
                Start a new private chat room with a custom password
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/join-room">
          <Card className="hover:scale-105 hover:shadow-2xl transition-all cursor-pointer bg-white/80 dark:bg-gray-800/70 backdrop-blur border-0">
            <CardHeader>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <CardTitle>Join Room</CardTitle>
              <CardDescription>
                Find a room with and join with the password
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/about">
          <Card className="hover:scale-105 hover:shadow-2xl transition-all cursor-pointer bg-white/80 dark:bg-gray-800/70 backdrop-blur border-0">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mb-2 shadow-lg">
                <span className="text-2xl text-white">?</span>
              </div>
              <CardTitle>About Whysper</CardTitle>
              <CardDescription>
                Learn how Whysper keeps your conversations private
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </main>
  );
}