'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function About() {
  return (
    <div className="min-h-screen max-w-screen flex flex-col justify-center items-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          About Whysper
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          hey
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-2xl mx-auto">
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    </div>
  );
}