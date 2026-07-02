"use client";

import { useAllMembers } from "@/hooks/useCircleVault";
import { truncateAddress } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

export default function MemberList() {
  const { data: members, isLoading } = useAllMembers();

  if (isLoading) {
    return <div className="glass-card p-6"><div className="animate-pulse-slow text-[var(--text-muted)]">Loading members…</div></div>;
  }

  const memberList = members || [];

  return (
    <div className="glass-card p-6">
      <h3 className="text-lg font-semibold mb-4">Circle Members</h3>
      {memberList.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No members yet.</p>
      ) : (
        <div className="space-y-2">
          {memberList.map((addr, i) => (
            <div key={addr} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--glass-border)]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-300 flex items-center justify-center text-xs font-bold text-white">
                {i + 1}
              </div>
              <div className="flex-1">
                <span className="text-sm font-mono text-[var(--text-primary)]">{truncateAddress(addr, 6)}</span>
              </div>
              <a href={`https://amoy.polygonscan.com/address/${addr}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[var(--accent-teal)] hover:underline flex items-center gap-1">View <ExternalLink size={12} /></a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
