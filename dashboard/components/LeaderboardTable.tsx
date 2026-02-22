// components/LeaderboardTable.tsx
import { Trophy, Medal, Award } from "lucide-react";

export interface Contributor {
  client: string;
  bounty: number;
}

export default function LeaderboardTable({ data }: { data: Contributor[] }) {
  // Sort data highest to lowest
  const sortedData = [...data].sort((a, b) => b.bounty - a.bounty);

  return (
    <div className="bg-white/5 p-6 rounded-xl border border-white/10 shadow-lg h-fit">
      <h2 className="text-xl font-semibold border-b border-white/10 pb-4 mb-4 flex items-center gap-2 text-white">
        <Trophy className="text-yellow-400 h-6 w-6" /> 
        Top Contributors
      </h2>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {sortedData.length === 0 && (
          <p className="text-gray-500 italic text-sm text-center py-8 bg-black/50 rounded-lg border border-dashed border-white/10">
            No bounties awarded yet. Be the first!
          </p>
        )}

        {sortedData.map((user, idx) => (
          <div
            key={idx}
            className={`flex justify-between items-center p-4 rounded-lg border transition-colors ${
              idx === 0 ? "bg-yellow-950/20 border-yellow-500/30" :
              idx === 1 ? "bg-gray-800/50 border-gray-500/30" :
              idx === 2 ? "bg-orange-950/20 border-orange-500/30" :
              "bg-black/50 border-white/5 hover:border-white/20"
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Rank Icon or Number */}
              <div className="w-6 flex justify-center">
                {idx === 0 ? <Trophy className="text-yellow-400 h-5 w-5" /> :
                 idx === 1 ? <Medal className="text-gray-400 h-5 w-5" /> :
                 idx === 2 ? <Award className="text-orange-400 h-5 w-5" /> :
                 <span className="text-gray-600 font-mono text-sm">#{idx + 1}</span>}
              </div>
              
              <span className={`font-mono text-sm ${idx < 3 ? 'text-white font-bold' : 'text-gray-400'}`}>
                {user.client}
              </span>
            </div>
            
            <span className={`font-bold ${idx === 0 ? 'text-yellow-400 text-lg' : 'text-yellow-500/80'}`}>
              {user.bounty} 🪙
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}