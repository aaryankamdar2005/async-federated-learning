// components/CommitHistoryPanel.tsx
"use client";
import React, { useState, useEffect } from "react";
import { GitCommit, AlertTriangle, CheckCircle2, Clock, User, TrendingUp } from "lucide-react";

export interface CommitHistoryProps {
  id: string;
  author: string;
  message: string;
  status: string;
  timestamp: string;
  version_bump: string;
  bounty: number;
  improvement: number;
}

export interface CommitHistoryPanelProps {
  repoId: string;
  title?: string;
  limit?: number;
}

export default function CommitHistoryPanel({
  repoId,
  title = "Commit History",
  limit = 10,
}: CommitHistoryPanelProps) {
  const [commits, setCommits] = useState<CommitHistoryProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommitHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `http://localhost:8000/repos/${repoId}/commit-history?limit=${limit}`
        );
        const data = await response.json();

        if (data.commits) {
          setCommits(data.commits);
        }
        setError(null);
      } catch (err) {
        setError("Failed to load commit history");
        console.error("Error fetching commits:", err);
      } finally {
        setLoading(false);
      }
    };

    if (repoId) {
      fetchCommitHistory();
    }
  }, [repoId, limit]);

  const isRejected = (status: string) => status.includes("Rejected");
  const isMerged = (status: string) => status.includes("Merged");

  const formatTime = (timestamp: string) => {
    if (!timestamp) return "Recently";
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return "Recently";
    }
  };

  const getStatusColor = (status: string) => {
    if (isRejected(status))
      return "bg-red-900/30 border-red-700/50 hover:bg-red-900/50";
    if (isMerged(status))
      return "bg-green-900/30 border-green-700/50 hover:bg-green-900/50";
    return "bg-white/5 border-white/10 hover:bg-white/10";
  };

  const getStatusBadgeColor = (status: string) => {
    if (isRejected(status))
      return "bg-red-900/50 text-red-300 border border-red-800";
    if (isMerged(status))
      return "bg-green-900/50 text-green-300 border border-green-800";
    return "bg-blue-900/50 text-blue-300 border border-blue-800";
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-light text-foreground mb-2 geist-font tracking-tight">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm inter-font">
          View recent model updates and contributions
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-400"></div>
          </div>
          <p className="text-muted-foreground mt-4 inter-font">Loading commit history...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-950/30 border border-red-700/50 rounded-lg p-4 text-red-300 inter-font text-sm">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && commits.length === 0 && !error && (
        <div className="text-center py-12">
          <GitCommit className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground inter-font">No commits yet</p>
        </div>
      )}

      {/* Timeline */}
      {!loading && commits.length > 0 && (
        <div className="space-y-4">
          {commits.map((commit, index) => (
            <div
              key={`${commit.id}-${index}-${commit.author}`}
              className={`rounded-xl border transition-all shadow-lg p-5 transform hover:scale-[1.02] ${getStatusColor(
                commit.status
              )}`}
            >
              {/* Timeline Connector */}
              {index < commits.length - 1 && (
                <div className="absolute left-[2.2rem] top-full w-0.5 h-4 bg-gradient-to-b from-white/20 to-transparent" />
              )}

              <div className="flex gap-4">
                {/* Avatar/Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center border border-white/10 shadow-lg">
                    {isRejected(commit.status) ? (
                      <AlertTriangle className="h-5 w-5 text-red-300" />
                    ) : (
                      <GitCommit className="h-5 w-5 text-white" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      {/* Author */}
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="font-mono text-sm text-gray-300 font-medium">
                          {commit.author || "Anonymous"}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(
                          commit.status
                        )}`}
                      >
                        {commit.status}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTime(commit.timestamp)}
                    </div>
                  </div>

                  {/* Message */}
                  <p className="text-sm text-gray-300 mb-3 inter-font leading-relaxed">
                    {commit.message}
                  </p>

                  {/* Footer with Metrics */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4 text-xs">
                      {/* Version Change */}
                      {commit.version_bump && commit.version_bump !== "None" && (
                        <div className="flex items-center gap-1 text-blue-300/70">
                          <span>📦</span>
                          <span className="font-mono">{commit.version_bump}</span>
                        </div>
                      )}

                      {/* Improvement */}
                      {commit.improvement !== 0 && (
                        <div
                          className={`flex items-center gap-1 ${
                            commit.improvement > 0
                              ? "text-green-400/70"
                              : "text-red-400/70"
                          }`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          <span className="font-mono">
                            {commit.improvement > 0 ? "+" : ""}
                            {commit.improvement.toFixed(2)}%
                          </span>
                        </div>
                      )}

                      {/* Verification Check */}
                      {isMerged(commit.status) && (
                        <div className="flex items-center gap-1 text-green-400/70">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>

                    {/* Bounty Badge */}
                    {commit.bounty > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
                        <span className="text-yellow-400 font-bold text-sm">💰</span>
                        <span className="text-yellow-300/80 font-mono text-xs font-medium">
                          +{commit.bounty} pts
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && commits.length > 0 && (
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-light text-foreground geist-font">
                {commits.length}
              </div>
              <div className="text-xs text-muted-foreground inter-font mt-1">Total Commits</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-green-400 geist-font">
                {commits.filter((c) => isMerged(c.status)).length}
              </div>
              <div className="text-xs text-muted-foreground inter-font mt-1">Merged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-light text-yellow-400 geist-font">
                {commits.reduce((sum, c) => sum + c.bounty, 0)}
              </div>
              <div className="text-xs text-muted-foreground inter-font mt-1">Total Bounty</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
