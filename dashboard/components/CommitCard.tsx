// components/CommitCard.tsx
import { GitCommit, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface CommitProps {
  client: string;
  status: string;
  reason?: string;
  version_bump?: string;
  bounty: number;
}

export default function CommitCard({ commit }: { commit: CommitProps }) {
  const isRejected = commit.status.includes("Rejected");

  return (
    <div
      className={`p-4 rounded-xl border transition-all shadow-lg ${
        isRejected
          ? "bg-red-950/20 border-red-900/50 hover:bg-red-950/40"
          : "bg-white/5 border-white/10 hover:bg-white/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {/* Dynamic Icon */}
            {isRejected ? (
              <AlertTriangle className="text-red-500 h-5 w-5" />
            ) : (
              <GitCommit className="text-indigo-400 h-5 w-5" />
            )}
            
            <span className="font-mono text-gray-300 text-sm">{commit.client}</span>
            
            {/* Status Badge */}
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                isRejected 
                  ? "bg-red-900/50 text-red-300 border border-red-800" 
                  : "bg-green-900/50 text-green-300 border border-green-800"
              }`}
            >
              {commit.status}
            </span>
          </div>
          
          {/* Commit Message / Reason */}
          <p className="text-gray-400 text-sm mt-3 ml-8 flex items-center gap-2">
            {isRejected ? commit.reason : `Successfully merged: ${commit.version_bump}`}
            {!isRejected && <CheckCircle2 className="h-4 w-4 text-green-500/70" />}
          </p>
        </div>

        {/* Bounty Reward */}
        {commit.bounty > 0 && (
          <div className="text-right flex flex-col items-end">
            <div className="text-yellow-400 font-bold text-sm bg-yellow-900/20 px-3 py-1 rounded-md border border-yellow-700/30">
              +{commit.bounty} 🪙
            </div>
            <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Bounty Earned</span>
          </div>
        )}
      </div>
    </div>
  );
}