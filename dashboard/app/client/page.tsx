"use client";
import { useEffect, useState } from "react";
import { Search, UploadCloud, Coins, Loader2, CheckCircle, XCircle, LogOut, GitCommit } from "lucide-react";
import AuthWrapper, { User } from "@/components/AuthWrapper";
import Link from "next/link";

export default function ClientDashboard() {
  return (
    <AuthWrapper>
      {(user, logout, refreshUser) => <ClientDashboardContent user={user} logout={logout} refreshUser={refreshUser} />}
    </AuthWrapper>
  );
}

function ClientDashboardContent({ user, logout, refreshUser }: { user: User, logout: () => void, refreshUser: () => void }) {
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetch("http://localhost:8000/repos").then(res => res.json()).then(data => setRepos(data));
  }, []);

  const handleUpload = async () => {
    if (!selectedRepo || !file) return alert("Select a repo and a .pth file!");
    
    setIsProcessing(true);
    const formData = new FormData();
    formData.append("client_id", user.username);
    formData.append("client_version", "1");
    formData.append("file", file);

    try {
      const res = await fetch(`http://localhost:8000/repos/${selectedRepo}/submit_update`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();

      if (data.status === "success") {
        alert(`✅ MERGED! Bounty: ${data.bounty} Tokens. Version is now v${data.version}`);
        refreshUser();
      } else {
        alert(`❌ REJECTED: ${data.message}`);
      }
    } catch (err) {
      alert("Network Error: Is the backend running?");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-[#E2E8F0] p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-[rgba(255,255,255,0.12)] pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
                <UploadCloud className="text-[#ffffff] w-5 h-5" />
              </div>
              Contributor Portal
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

        {/* REPO SELECTOR */}
        <div className="mb-3">
          <h2 className="text-sm font-medium text-[#64748B] mb-4 uppercase tracking-wider">Select Repository</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {repos.map(repo => (
            <div 
              key={repo.id} onClick={() => setSelectedRepo(repo.id)}
              className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
                selectedRepo === repo.id 
                  ? 'glass-card border-[rgba(255,255,255,0.4)] shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                  : 'bg-[rgba(10,15,46,0.3)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]'
              }`}
            >
              <div>
                <h3 className="font-bold text-[#E2E8F0] mb-1">{repo.name}</h3>
                <p className="text-xs text-[#64748B] mb-4 h-8 overflow-hidden">{repo.description}</p>
              </div>
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-[#64748B] mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                <div className="flex flex-col gap-1">
                  <span>v{repo.version}</span>
                  <span className="text-[#ffffff]">ID: {repo.id}</span>
                </div>
                <Link href={`/repo/${repo.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-[#ffffff] hover:text-[#5b7fff] badge-info px-3 py-2 rounded-lg transition-all text-xs normal-case tracking-normal font-semibold">
                  <GitCommit size={14} /> History
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* UPLOAD ZONE */}
        {selectedRepo && (
          <div className="max-w-xl mx-auto glass-card p-10 rounded-2xl text-center glow-pulse">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center mx-auto mb-6">
              <UploadCloud size={32} className="text-[#ffffff]"/>
            </div>
            <h2 className="text-xl font-bold mb-2 text-[#E2E8F0]">Submit .pth Commit</h2>
            <p className="text-sm text-[#64748B] mb-8">Upload binary weights for validation against the Golden Set.</p>
            
            <input 
              type="file" accept=".pth"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-[#64748B] mb-8 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:bg-[rgba(255,255,255,0.15)] file:text-[#5b7fff] hover:file:bg-[rgba(255,255,255,0.25)] file:cursor-pointer file:transition-colors file:font-medium"
            />

            <button 
              onClick={handleUpload} disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 text-sm ${
                isProcessing 
                  ? 'bg-[rgba(10,15,46,0.6)] text-[#64748B] border border-[rgba(255,255,255,0.08)]' 
                  : 'primary-button'
              }`}
            >
              {isProcessing ? (
                  <><Loader2 className="animate-spin" size={20}/> VERIFYING ZERO-TRUST...</>
              ) : "PUSH TO GLOBAL BRAIN"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
