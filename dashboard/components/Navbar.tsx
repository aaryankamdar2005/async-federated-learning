"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#27272a] bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-2">
            <Link href="/" className="font-bold text-xl tracking-tight text-white group">
              Async<span className="text-gray-400">Shield</span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-2 bg-[#0a0a0a] border border-[#27272a] rounded-2xl p-1">
            <Link
              href="/server"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === '/server'
                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                : 'text-gray-400 hover:text-white hover:bg-[#18181b]'
              }`}
            >
              Server Node
            </Link>
            <Link
              href="/client"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === '/client'
                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                : 'text-gray-400 hover:text-white hover:bg-[#18181b]'
              }`}
            >
              Client Node
            </Link>
            <Link
              href="/compute"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname === '/compute'
                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                : 'text-gray-400 hover:text-white hover:bg-[#18181b]'
              }`}
            >
              Compute Node
            </Link>
            <Link
              href="/monitoring"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                pathname.startsWith('/monitoring') || pathname.startsWith('/repo') || pathname.startsWith('/commits')
                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                : 'text-gray-400 hover:text-white hover:bg-[#18181b]'
              }`}
            >
              Network Explorer
            </Link>
          </div>

          <div className="flex items-center">
            <div className="flex items-center gap-2 text-xs md:text-sm px-3 py-1.5 rounded-xl border bg-black border-[#27272a] text-gray-300">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse" />
              Network Live
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

