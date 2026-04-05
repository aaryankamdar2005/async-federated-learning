"use client";
import React, { useEffect, useState } from "react";
import { LogIn, UserPlus, ShieldCheck } from "lucide-react";

export interface User {
  username: string;
  tokens: number;
}

interface AuthWrapperProps {
  children: (user: User, logout: () => void, refreshUser: () => void) => React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = () => {
    const savedUser = localStorage.getItem('asyncshield_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      fetch(`http://localhost:8000/auth/user/${parsedUser.username}`)
        .then(res => res.json())
        .then(data => {
          setUser(data);
          localStorage.setItem('asyncshield_user', JSON.stringify(data));
        })
        .catch(() => setUser(parsedUser))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.status === "success") {
        if (authMode === 'register') {
          setAuthMode('login');
          setAuthError('Registration successful! Please log in.');
        } else {
          const userData = { username: data.username, tokens: data.tokens };
          setUser(userData);
          localStorage.setItem('asyncshield_user', JSON.stringify(userData));
        }
      } else {
        setAuthError(data.message);
      }
    } catch (err) {
      setAuthError("Network Error: Is the backend running?");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('asyncshield_user');
    setUsername('');
    setPassword('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent text-[#E2E8F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center glow-pulse">
            <ShieldCheck className="w-6 h-6 text-[#ffffff]" />
          </div>
          <div className="text-[#64748B] text-sm animate-pulse">Authenticating...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-transparent text-[#E2E8F0] flex items-center justify-center p-4">
        {/* Background glow effect */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[rgba(255,255,255,0.04)] blur-[120px]" />
        </div>

        <div className="relative max-w-md w-full glass-card p-8 rounded-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center mx-auto mb-4 glow-pulse">
              <ShieldCheck className="w-7 h-7 text-[#ffffff]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#E2E8F0] mb-1">
              Async<span className="text-[#ffffff]">Shield</span>
            </h1>
            <p className="text-[#64748B] text-sm">
              {authMode === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs text-[#64748B] mb-1.5 font-medium uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full form-input rounded-xl px-4 py-3 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-[#64748B] mb-1.5 font-medium uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full form-input rounded-xl px-4 py-3 text-sm"
                required
              />
            </div>

            {authError && (
              <div className={`text-xs p-3 rounded-xl ${authError.includes('successful') ? 'badge-success' : 'badge-danger'}`}>
                {authError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full primary-button py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-6 text-sm"
            >
              {authMode === 'login' ? <><LogIn size={18}/> Sign In</> : <><UserPlus size={18}/> Create Account</>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
              className="text-xs text-[#64748B] hover:text-[#ffffff] transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Register here." : "Already have an account? Login here."}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children(user, handleLogout, refreshUser)}</>;
}
