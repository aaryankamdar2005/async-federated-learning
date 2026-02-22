"use client";
import React, { useEffect, useState } from "react";
import { LogIn, UserPlus } from "lucide-react";

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
      <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center font-mono">
        <div className="animate-pulse">LOADING AUTHENTICATION...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020202] text-white flex items-center justify-center font-mono p-4">
        <div className="max-w-md w-full bg-white/[0.02] border border-white/10 p-8 rounded-3xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tighter text-indigo-400 mb-2">ASYNC-SHIELD</h1>
            <p className="text-gray-500 text-sm">AUTHENTICATION REQUIRED</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">USERNAME</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">PASSWORD</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            {authError && (
              <div className={`text-xs p-3 rounded-lg ${authError.includes('successful') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {authError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-6"
            >
              {authMode === 'login' ? <><LogIn size={18}/> LOGIN</> : <><UserPlus size={18}/> REGISTER</>}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
              className="text-xs text-gray-500 hover:text-indigo-400 transition-colors"
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
