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
      return "bg-[rgba(239,68,68,0.06)] border-[rgba(239,68,68,0.15)] hover:border-[rgba(239,68,68,0.3)]";
    if (isMerged(status))
      return "bg-[rgba(34,197,94,0.06)] border-[rgba(34,197,94,0.15)] hover:border-[rgba(34,197,94,0.3)]";
    return "glass-card";
  };

  const getStatusBadgeColor = (status: string) => {
    if (isRejected(status)) return "badge-danger";
    if (isMerged(status)) return "badge-success";
    return "badge-info";
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#E2E8F0] mb-2 tracking-tight">
          {title}
        </h2>
        <p className="text-[#64748B] text-sm">
          View recent model updates and contributions
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-[#ffffff]"></div>
          </div>
          <p className="text-[#64748B] mt-4 text-sm">Loading commit history...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="badge-danger rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!loading && commits.length === 0 && !error && (
        <div className="text-center py-12">
          <GitCommit className="h-12 w-12 text-[#64748B] mx-auto mb-4 opacity-50" />
          <p className="text-[#64748B]">No commits yet</p>
        </div>
      )}

      {/* Timeline */}
      {!loading && commits.length > 0 && (
        <div className="space-y-4">
          {commits.map((commit, index) => (
            <div
              key={`${commit.id}-${index}-${commit.author}`}
              className={`rounded-xl border transition-all duration-300 p-5 transform hover:scale-[1.01] ${getStatusColor(
                commit.status
              )}`}
            >
              <div className="flex gap-4">
                {/* Avatar/Icon */}
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isRejected(commit.status)
                      ? "bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.2)]"
                      : "bg-gradient-to-br from-[#ffffff] to-[#5b7fff] border-[rgba(255,255,255,0.3)]"
                  }`}>
                    {isRejected(commit.status) ? (
                      <AlertTriangle className="h-5 w-5 text-[#f87171]" />
                    ) : (
                      <GitCommit className="h-5 w-5 text-white" />
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#64748B] flex-shrink-0" />
                        <span className="font-mono text-sm text-[#E2E8F0] font-medium">
                          {commit.author || "Anonymous"}
                        </span>
                      </div>

                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(
                          commit.status
                        )}`}
                      >
                        {commit.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-[#64748B] flex-shrink-0">
                      <Clock className="h-3 w-3" />
                      {formatTime(commit.timestamp)}
                    </div>
                  </div>

                  <p className="text-sm text-[#94a3b8] mb-3 leading-relaxed">
                    {commit.message}
                  </p>

                  {/* Footer with Metrics */}
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4 text-xs">
                      {commit.version_bump && commit.version_bump !== "None" && (
                        <div className="flex items-center gap-1 text-[#5b7fff]/70">
                          <span>📦</span>
                          <span className="font-mono">{commit.version_bump}</span>
                        </div>
                      )}

                      {commit.improvement !== 0 && (
                        <div
                          className={`flex items-center gap-1 ${
                            commit.improvement > 0
                              ? "text-[#4ade80]/70"
                              : "text-[#f87171]/70"
                          }`}
                        >
                          <TrendingUp className="h-3 w-3" />
                          <span className="font-mono">
                            {commit.improvement > 0 ? "+" : ""}
                            {commit.improvement.toFixed(2)}%
                          </span>
                        </div>
                      )}

                      {isMerged(commit.status) && (
                        <div className="flex items-center gap-1 text-[#4ade80]/70">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>

                    {commit.bounty > 0 && (
                      <div className="flex items-center gap-2 token-badge px-3 py-1 rounded-lg">
                        <span className="font-bold text-sm">💰</span>
                        <span className="font-mono text-xs font-medium">
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
        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.12)]">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center glass-card rounded-xl p-4">
              <div className="text-2xl font-bold text-[#E2E8F0]">
                {commits.length}
              </div>
              <div className="text-xs text-[#64748B] mt-1">Total Commits</div>
            </div>
            <div className="text-center glass-card rounded-xl p-4">
              <div className="text-2xl font-bold text-[#4ade80]">
                {commits.filter((c) => isMerged(c.status)).length}
              </div>
              <div className="text-xs text-[#64748B] mt-1">Merged</div>
            </div>
            <div className="text-center glass-card rounded-xl p-4">
              <div className="text-2xl font-bold text-[#F59E0B]">
                {commits.reduce((sum, c) => sum + c.bounty, 0)}
              </div>
              <div className="text-xs text-[#64748B] mt-1">Total Bounty</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
