"use client";
import React, { useState, useEffect } from "react";
import CommitHistoryPanel from "@/components/CommitHistoryPanel";
import { ArrowLeft } from "lucide-react";
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-light geist-font text-foreground">
                Commit History
              </h1>
              <p className="text-sm text-muted-foreground inter-font">
                Track all model updates and contributions
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Repository Selector */}
        {!loading && repos.length > 0 && (
          <div className="mb-8">
            <label className="text-sm text-muted-foreground inter-font mb-3 block">
              Select Repository
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {repos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() => setSelectedRepo(repo.id)}
                  className={`text-left p-4 rounded-lg border transition-all ${
                    selectedRepo === repo.id
                      ? "bg-indigo-900/30 border-indigo-500/50 ring-2 ring-indigo-400"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="font-medium text-foreground geist-font">
                    {repo.name}
                  </div>
                  <div className="text-xs text-muted-foreground inter-font mt-1">
                    v{repo.version} • by {repo.owner}
                  </div>
                  {repo.description && (
                    <div className="text-xs text-muted-foreground/70 inter-font mt-2 line-clamp-1">
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
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-400"></div>
            <p className="text-muted-foreground mt-4 inter-font">
              Loading repositories...
            </p>
          </div>
        ) : selectedRepo ? (
          <CommitHistoryPanel repoId={selectedRepo} limit={50} />
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground inter-font">
              No repositories available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
