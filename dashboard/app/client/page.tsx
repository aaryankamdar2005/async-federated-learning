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
    <div className="min-h-screen bg-[#020202] text-white p-10 font-mono">
      <header className="flex justify-between items-center mb-12 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-indigo-400">ASYNC-SHIELD // CONTRIBUTOR_PORTAL</h1>
          <p className="text-xs text-gray-500 mt-1">LOGGED IN AS: <span className="text-white">{user.username}</span></p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 px-6 py-2 rounded-full text-yellow-500 font-bold flex gap-2 items-center">
            <Coins size={18}/> Balance: <span>{user.tokens} TOKENS</span>
          </div>
          <button onClick={logout} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* REPO SELECTOR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {repos.map(repo => (
          <div 
            key={repo.id} onClick={() => setSelectedRepo(repo.id)}
            className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${selectedRepo === repo.id ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
          >
            <div>
              <h3 className="font-bold text-white mb-1">{repo.name}</h3>
              <p className="text-xs text-gray-500 mb-4 h-8 overflow-hidden">{repo.description}</p>
            </div>
            <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-gray-400 mt-4 pt-4 border-t border-white/10">
              <div className="flex flex-col gap-1">
                <span>v{repo.version}</span>
                <span className="text-indigo-400">ID: {repo.id}</span>
              </div>
              <Link href={`/repo/${repo.id}`} onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-2 rounded-lg transition-colors">
                <GitCommit size={14} /> History
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* UPLOAD ZONE */}
      {selectedRepo && (
        <div className="max-w-xl mx-auto bg-white/[0.02] border border-white/10 p-10 rounded-3xl text-center">
          <UploadCloud size={48} className="mx-auto text-gray-500 mb-6"/>
          <h2 className="text-xl font-bold mb-2">Submit .pth Commit</h2>
          <p className="text-sm text-gray-500 mb-8">Upload binary weights for validation against the Golden Set.</p>
          
          <input 
            type="file" accept=".pth"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-xs text-gray-500 mb-8 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
          />

          <button 
            onClick={handleUpload} disabled={isProcessing}
            className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 ${isProcessing ? 'bg-gray-800 text-gray-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
          >
            {isProcessing ? (
                <><Loader2 className="animate-spin" size={20}/> VERIFYING ZERO-TRUST...</>
            ) : "PUSH TO GLOBAL BRAIN"}
          </button>
        </div>
      )}
    </div>
  );
}