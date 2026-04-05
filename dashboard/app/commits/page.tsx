"use client";
import React, { useState, useEffect } from "react";
import CommitHistoryPanel from "@/components/CommitHistoryPanel";
import { ArrowLeft, GitCommit } from "lucide-react";
import Link from "next/link";

interface Repo {
  id: string;
  name: string;
  description: string;
  owner: string;
  version: number;
  timestamp: string;
}

export default function CommitHistoryPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/repos");
        const data = await response.json();
        setRepos(data);
        if (data.length > 0) {
          setSelectedRepo(data[0].id);
        }
      } catch (error) {
        console.error("Error fetching repos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-[#E2E8F0]">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.12)] bg-transparent/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-[rgba(255,255,255,0.08)] rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-[#64748B]" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-[#E2E8F0] flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-[#ffffff]" />
                Commit History
              </h1>
              <p className="text-sm text-[#64748B]">
                Track all model updates and contributions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Repository Selector */}
        {!loading && repos.length > 0 && (
          <div className="mb-8">
            <label className="text-xs text-[#64748B] mb-3 block font-medium uppercase tracking-wider">
              Select Repository
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {repos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo.id)}
                  className={`text-left p-4 rounded-xl border transition-all duration-300 ${
                    selectedRepo === repo.id
                      ? "glass-card border-[rgba(255,255,255,0.4)] shadow-[0_0_25px_rgba(255,255,255,0.08)]"
                      : "bg-[rgba(10,15,46,0.3)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]"
                  }`}
                >
                  <div className="font-medium text-[#E2E8F0]">
                    {repo.name}
                  </div>
                  <div className="text-xs text-[#64748B] mt-1">
                    v{repo.version} • by {repo.owner}
                  </div>
                  {repo.description && (
                    <div className="text-xs text-[#64748B]/70 mt-2 line-clamp-1">
                      {repo.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Commit History Panel */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-[#ffffff]"></div>
            <p className="text-[#64748B] mt-4 text-sm">
              Loading repositories...
            </p>
          </div>
        ) : selectedRepo ? (
          <CommitHistoryPanel repoId={selectedRepo} limit={50} />
        ) : (
          <div className="text-center py-12">
            <p className="text-[#64748B]">
              No repositories available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
