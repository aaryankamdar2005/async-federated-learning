// app/server/page.tsx
"use client";
import { useState, useEffect } from "react";
import { Database, PlusCircle, Activity, LogOut, Coins, GitCommit } from "lucide-react";
import AuthWrapper, { User } from "@/components/AuthWrapper";
import Link from "next/link";

export default function ServerDashboard() {
  return (
    <AuthWrapper>
      {(user, logout, refreshUser) => <ServerDashboardContent user={user} logout={logout} refreshUser={refreshUser} />}
    </AuthWrapper>
  );
}

function ServerDashboardContent({ user, logout, refreshUser }: { user: User, logout: () => void, refreshUser: () => void }) {
  const [repoName, setRepoName] = useState("");
  const [desc, setDesc] = useState("");
  const [myRepos, setMyRepos] = useState<any[]>([]);

  const fetchRepos = async () => {
    const res = await fetch("http://localhost:8000/repos");
    const data = await res.json();
    setMyRepos(data.filter((r: any) => r.owner === user.username));
  };

  useEffect(() => {
    fetchRepos();
  }, [user.username]);

  const handleCreateRepo = async (e: any) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", repoName);
    formData.append("description", desc);
    formData.append("owner", user.username);

    await fetch("http://localhost:8000/create_repo", {
      method: "POST",
      body: formData
    });
    alert("Repository Created Successfully!");
    fetchRepos();
    setRepoName("");
    setDesc("");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-10 font-sans">
      <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="text-rose-400"/> Model Owner Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-mono">LOGGED IN AS: <span className="text-white">{user.username}</span></p>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <div className="bg-yellow-500/10 border border-yellow-500/20 px-6 py-2 rounded-full text-yellow-500 font-bold flex gap-2 items-center">
            <Coins size={18}/> Balance: <span>{user.tokens} TOKENS</span>
          </div>
          <button onClick={logout} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* CREATE REPO FORM */}
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <PlusCircle size={20}/> Create New Repository
          </h2>
          <form onSubmit={handleCreateRepo} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Model Name</label>
              <input 
                type="text" 
                value={repoName}
                className="w-full bg-black border border-white/20 rounded p-2 mt-1 text-white" 
                placeholder="e.g. MNIST-V1-Global"
                onChange={(e) => setRepoName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Description</label>
              <textarea 
                value={desc}
                className="w-full bg-black border border-white/20 rounded p-2 mt-1 text-white" 
                placeholder="Detects handwritten digits..."
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
            {/* Mock Golden Dataset Upload for UI */}
            <div>
              <label className="text-sm text-gray-400">Attach Golden Dataset (.zip)</label>
              <input type="file" className="w-full text-sm text-gray-400 mt-1 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-white/10 file:text-white hover:file:bg-white/20"/>
            </div>
            <button type="submit" className="w-full bg-rose-600 hover:bg-rose-500 py-2 rounded font-bold transition-colors">
              Initialize Repository
            </button>
          </form>
        </div>

        {/* ANALYTICS SECTION */}
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Activity size={20}/> My Repositories
          </h2>
          <div className="space-y-4">
             <div className="p-4 bg-black rounded border border-white/10 flex justify-between">
                <span>Total Active Repos</span>
                <span className="text-rose-400 font-bold">{myRepos.length}</span>
             </div>
             
             <div className="mt-6 space-y-3">
               {myRepos.length === 0 ? (
                 <div className="text-center text-gray-500 text-sm py-4">No repositories created yet.</div>
               ) : (
                 myRepos.map(repo => (
                   <div key={repo.id} className="p-4 bg-black rounded border border-white/10 flex flex-col gap-3">
                     <div className="flex justify-between items-start">
                       <div>
                         <h3 className="font-bold text-white">{repo.name}</h3>
                         <p className="text-xs text-gray-500">v{repo.version} • ID: {repo.id}</p>
                       </div>
                       <Link href={`/repo/${repo.id}`} className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors">
                         <GitCommit size={14} /> History
                       </Link>
                     </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}