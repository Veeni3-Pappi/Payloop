"use client";

import { useCreditScore, useCreditScoreData } from "@/hooks/useCreditScore";
import { scoreColor, scoreGradient, scoreLabel } from "@/lib/utils";

interface Props { walletAddress: `0x${string}` | undefined; }

export default function CreditScoreCard({ walletAddress }: Props) {
  const { data: score, isLoading } = useCreditScore(walletAddress);
  const { data: scoreData } = useCreditScoreData(walletAddress);

  const s = score !== undefined ? Number(score) : 500;
  const pct = (s / 1000) * 100;
  const circ = 2 * Math.PI * 80;
  const offset = circ - (pct / 100) * circ;
  const stopColor = s >= 701 ? "#10b981" : s >= 401 ? "#f59e0b" : "#ef4444";
  const stopColor2 = s >= 701 ? "#14b8a6" : s >= 401 ? "#fbbf24" : "#f87171";

  if (isLoading) {
    return <div className="glass-card p-8 flex items-center justify-center h-80">
      <div className="animate-pulse-slow text-[var(--text-muted)]">Loading score…</div>
    </div>;
  }

  return (
    <div className="glass-card p-8">
      <h3 className="text-lg font-semibold mb-6">CreditLoop Score</h3>
      <div className="flex flex-col items-center">
        <div className="score-ring mb-6">
          <svg width="200" height="200" viewBox="0 0 200 200">
            <circle className="ring-bg" cx="100" cy="100" r="80" fill="none" strokeWidth="12" />
            <circle className="ring-fill" cx="100" cy="100" r="80" fill="none" strokeWidth="12"
              strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" stroke="url(#sg)" />
            <defs>
              <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={stopColor} />
                <stop offset="100%" stopColor={stopColor2} />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${scoreColor(s)}`}>{s}</span>
            <span className="text-xs text-[var(--text-muted)] mt-1">/ 1000</span>
          </div>
        </div>
        <div className={`px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r ${scoreGradient(s)} bg-clip-text text-transparent mb-6`}>
          {scoreLabel(s)}
        </div>
        {scoreData && (
          <div className="w-full space-y-3">
            <div className="flex justify-between"><span className="text-sm text-[var(--text-secondary)]">On-time</span><span className="text-sm font-semibold text-emerald-400">{Number(scoreData.onTimeCount)} × (+10)</span></div>
            <div className="flex justify-between"><span className="text-sm text-[var(--text-secondary)]">Missed</span><span className="text-sm font-semibold text-red-400">{Number(scoreData.missedCount)} × (-20)</span></div>
            <div className="flex justify-between"><span className="text-sm text-[var(--text-secondary)]">Repaid</span><span className="text-sm font-semibold text-teal-400">{Number(scoreData.repaidCount)} × (+15)</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
