import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full bg-[#0a0a0f]/90 border-b border-[#000080] backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.jpg" alt="Logo" width={120} height={40} className="object-contain" />
        </Link>
        <div className="flex space-x-6">
          <Link href="/dashboard" className="text-sm uppercase tracking-widest hover:text-accent">Dashboard</Link>
          <Link href="/create" className="text-sm uppercase tracking-widest hover:text-accent">Seal Capsule</Link>
          <Link href="/vault" className="text-sm uppercase tracking-widest hover:text-accent">Vault</Link>
        </div>
      </div>
    </nav>
  );
}