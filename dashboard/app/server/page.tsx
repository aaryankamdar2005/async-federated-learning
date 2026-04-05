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
    <div className="min-h-screen bg-transparent text-[#E2E8F0] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[rgba(255,255,255,0.12)] pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
                <Database className="text-[#ffffff] w-5 h-5"/>
              </div>
              Model Owner Dashboard
            </h1>
            <p className="text-xs text-[#64748B] mt-2">Logged in as <span className="text-[#E2E8F0] font-semibold">{user.username}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <div className="token-badge px-5 py-2 rounded-xl font-bold flex gap-2 items-center text-sm">
              <Coins size={16}/> {user.tokens} TOKENS
            </div>
            <button onClick={logout} className="p-2.5 rounded-xl text-[#64748B] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.08)] transition-all" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CREATE REPO FORM */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <PlusCircle size={20} className="text-[#ffffff]"/> Create New Repository
            </h2>
            <form onSubmit={handleCreateRepo} className="space-y-4">
              <div>
                <label className="text-xs text-[#64748B] mb-1.5 block font-medium uppercase tracking-wider">Model Name</label>
                <input 
                  type="text" 
                  value={repoName}
                  className="w-full form-input rounded-xl p-3 text-sm" 
                  placeholder="e.g. MNIST-V1-Global"
                  onChange={(e) => setRepoName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748B] mb-1.5 block font-medium uppercase tracking-wider">Description</label>
                <textarea 
                  value={desc}
                  className="w-full form-input rounded-xl p-3 text-sm min-h-[80px] resize-none" 
                  placeholder="Detects handwritten digits..."
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-[#64748B] mb-1.5 block font-medium uppercase tracking-wider">Attach Golden Dataset (.zip)</label>
                <input type="file" className="w-full text-sm text-[#64748B] mt-1 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-[rgba(255,255,255,0.1)] file:text-[#5b7fff] hover:file:bg-[rgba(255,255,255,0.2)] file:transition-colors file:cursor-pointer"/>
              </div>
              <button type="submit" className="w-full primary-button py-3 rounded-xl font-bold text-sm transition-all">
                Initialize Repository
              </button>
            </form>
          </div>

          {/* REPOSITORIES */}
          <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-semibold mb-5 flex items-center gap-2">
              <Activity size={20} className="text-[#ffffff]"/> My Repositories
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-[rgba(6,9,26,0.6)] rounded-xl border border-[rgba(255,255,255,0.08)] flex justify-between items-center">
                <span className="text-[#64748B] text-sm">Total Active Repos</span>
                <span className="text-[#ffffff] font-bold text-lg">{myRepos.length}</span>
              </div>
              
              <div className="mt-4 space-y-3">
                {myRepos.length === 0 ? (
                  <div className="text-center text-[#64748B] text-sm py-8 bg-[rgba(6,9,26,0.4)] rounded-xl border border-dashed border-[rgba(255,255,255,0.1)]">
                    No repositories created yet.
                  </div>
                ) : (
                  myRepos.map(repo => (
                    <div key={repo.id} className="p-4 bg-[rgba(6,9,26,0.6)] rounded-xl border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.25)] transition-all flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-[#E2E8F0]">{repo.name}</h3>
                          <p className="text-xs text-[#64748B] mt-0.5">v{repo.version} • ID: {repo.id}</p>
                        </div>
                        <Link href={`/repo/${repo.id}`} className="flex items-center gap-1.5 text-xs text-[#ffffff] hover:text-[#5b7fff] badge-info px-3 py-1.5 rounded-lg transition-all">
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
    </div>
  );
}
