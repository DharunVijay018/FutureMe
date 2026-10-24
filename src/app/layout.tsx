"use client";
import { Montserrat } from 'next/font/google';
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { useState, useEffect } from "react";
import Image from "next/image";

// Import Montserrat with multiple weights, including italic for that slanted look
const montserrat = Montserrat({ 
  subsets: ['latin'], 
  variable: '--font-montserrat',
  weight: ['400', '500', '600', '700', '900'] 
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" className={montserrat.variable}>
      <body>
        {showSplash ? (
          <div className="flex items-center justify-center h-screen bg-[#050505]">
            <Image src="/logo.png" alt="FutureMe Vault" width={400} height={200} priority />
          </div>
        ) : (
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow pt-16 px-4 md:px-8">
              {children}
            </main>
          </div>
        )}
      </body>
    </html>
  );
}