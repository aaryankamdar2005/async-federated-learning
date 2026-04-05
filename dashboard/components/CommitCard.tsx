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
      className={`p-4 rounded-xl border transition-all duration-300 ${
        isRejected
          ? "bg-[rgba(239,68,68,0.06)] border-[rgba(239,68,68,0.15)] hover:border-[rgba(239,68,68,0.3)]"
          : "glass-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            {isRejected ? (
              <div className="w-8 h-8 rounded-lg bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
                <AlertTriangle className="text-[#EF4444] h-4 w-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.1)] flex items-center justify-center">
                <GitCommit className="text-[#ffffff] h-4 w-4" />
              </div>
            )}
            
            <span className="font-mono text-[#E2E8F0] text-sm">{commit.client}</span>
            
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${
                isRejected ? "badge-danger" : "badge-success"
              }`}
            >
              {commit.status}
            </span>
          </div>
          
          <p className="text-[#64748B] text-sm mt-3 ml-11 flex items-center gap-2">
            {isRejected ? commit.reason : `Successfully merged: ${commit.version_bump}`}
            {!isRejected && <CheckCircle2 className="h-4 w-4 text-[#22C55E]/70" />}
          </p>
        </div>

        {commit.bounty > 0 && (
          <div className="text-right flex flex-col items-end">
            <div className="token-badge font-bold text-sm px-3 py-1 rounded-lg">
              +{commit.bounty} 🪙
            </div>
            <span className="text-[10px] text-[#64748B] mt-1 uppercase tracking-wider">Bounty Earned</span>
          </div>
        )}
      </div>
    </div>
  );
}
