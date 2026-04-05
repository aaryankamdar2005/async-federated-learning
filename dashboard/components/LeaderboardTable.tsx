// components/LeaderboardTable.tsx
import { Trophy, Medal, Award } from "lucide-react";

export interface Contributor {
  client: string;
  bounty: number;
}

export default function LeaderboardTable({ data }: { data: Contributor[] }) {
  const sortedData = [...data].sort((a, b) => b.bounty - a.bounty);

  return (
    <div className="glass-card p-6 rounded-2xl h-fit">
      <h2 className="text-xl font-semibold border-b border-[rgba(255,255,255,0.12)] pb-4 mb-4 flex items-center gap-2 text-[#E2E8F0]">
        <Trophy className="text-[#F59E0B] h-6 w-6" /> 
        Top Contributors
      </h2>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {sortedData.length === 0 && (
          <p className="text-[#64748B] italic text-sm text-center py-8 bg-[rgba(6,9,26,0.6)] rounded-xl border border-dashed border-[rgba(255,255,255,0.1)]">
            No bounties awarded yet. Be the first!
          </p>
        )}

        {sortedData.map((user, idx) => (
          <div
            key={idx}
            className={`flex justify-between items-center p-4 rounded-xl border transition-all duration-300 ${
              idx === 0 ? "bg-[rgba(245,158,11,0.06)] border-[rgba(245,158,11,0.2)] hover:border-[rgba(245,158,11,0.35)]" :
              idx === 1 ? "bg-[rgba(148,163,184,0.06)] border-[rgba(148,163,184,0.15)] hover:border-[rgba(148,163,184,0.3)]" :
              idx === 2 ? "bg-[rgba(251,146,60,0.06)] border-[rgba(251,146,60,0.15)] hover:border-[rgba(251,146,60,0.3)]" :
              "bg-[rgba(6,9,26,0.4)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.2)]"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-7 flex justify-center">
                {idx === 0 ? <Trophy className="text-[#F59E0B] h-5 w-5" /> :
                 idx === 1 ? <Medal className="text-[#94a3b8] h-5 w-5" /> :
                 idx === 2 ? <Award className="text-[#fb923c] h-5 w-5" /> :
                 <span className="text-[#64748B] font-mono text-sm">#{idx + 1}</span>}
              </div>
              
              <span className={`font-mono text-sm ${idx < 3 ? 'text-[#E2E8F0] font-bold' : 'text-[#94a3b8]'}`}>
                {user.client}
              </span>
            </div>
            
            <span className={`font-bold ${idx === 0 ? 'text-[#F59E0B] text-lg' : 'text-[#F59E0B]/80'}`}>
              {user.bounty} 🪙
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
