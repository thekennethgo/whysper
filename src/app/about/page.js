'use client';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Key } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-8">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <div className="w-[700px] h-[700px] bg-blue-400/20 dark:bg-blue-900/15 rounded-full blur-[120px]" />
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4 mt-10">
            About Whysper
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Whysper is an experiment in creating truly private conversations on the web.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          
          <Card className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4">
              <Lock className="w-8 h-8 text-blue-500" />
              <div>
                <CardTitle>True End-to-End Encryption</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p>
                Every message sent on Whysper is protected by a combination of RSA and AES encryption. This means your messages are encrypted on your device and can only be decrypted by the person you are talking to. Servers and network only ever see random ciphertext.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4">
               <Key className="w-8 h-8 text-yellow-500" />
               <div>
                <CardTitle>How The Secure Handshake Works</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                After a guest joins the room, both users participate in a secure key exchange process to establish a shared encryption key. This key is used to encrypt and decrypt all messages in the chat. Only the two users know this key, and its never exposed to the server or any third party.
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-white/60 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4">
              <div>
                <CardTitle>Open Source</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4"> For a service to be truly secure, it must be completely transparent. </p>
              <p> That is why every line of code is available in this GitHub repo. </p>
              <div className="mt-4">
                <Link href="https://github.com/thekennethgo/whysper" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline">
                    View Source on GitHub
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Link href="/">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}