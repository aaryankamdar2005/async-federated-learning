// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, Server, Users, Activity } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  // Helper function to check if a link is active
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
        
        {/* LEFT: Logo & Brand */}
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
          <ShieldCheck className="h-7 w-7 text-rose-500" />
          <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
            Async<span className="text-rose-400">Shield</span>
          </span>
        </Link>

        {/* CENTER: Navigation Links */}
        <div className="flex items-center gap-2 md:gap-6">
          <Link 
            href="/server"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive('/server') 
                ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]" 
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Server className="h-4 w-4" />
            <span className="hidden md:inline">Server Portal</span>
          </Link>

          <Link 
            href="/client"
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isActive('/client') 
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                : "text-gray-400 hover:text-indigo-300 hover:bg-indigo-500/10"
            }`}
          >
            <Users className="h-4 w-4" />
            <span className="hidden md:inline">Client Hub</span>
          </Link>
        </div>

        {/* RIGHT: Network Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs md:text-sm px-3 py-1.5 rounded-full border bg-green-500/10 border-green-500/20 text-green-400">
            <Activity className="h-4 w-4 animate-pulse" />
            <span className="hidden sm:inline">Network Active</span>
          </div>
        </div>

      </div>
    </nav>
  );
}