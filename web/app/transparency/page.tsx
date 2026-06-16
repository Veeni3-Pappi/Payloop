"use client";

import { useVaultBalance, useMemberCount } from "@/hooks/useCircleVault";
import { useLoanCount } from "@/hooks/useLendingPool";
import { formatMatic, truncateAddress } from "@/lib/utils";
import { CIRCLE_VAULT_ADDRESS } from "@/lib/contracts";

export default function TransparencyPage() {
  const { data: balance } = useVaultBalance();
  const { data: memberCount } = useMemberCount();
  const { data: loanCount } = useLoanCount();

  const stats = [
    { label: "Total Vault", value: balance ? `${formatMatic(balance)} MATIC` : "—", icon: "💰" },
    { label: "Members", value: memberCount !== undefined ? Number(memberCount).toString() : "—", icon: "👥" },
    { label: "Loans Processed", value: loanCount !== undefined ? Number(loanCount).toString() : "—", icon: "📋" },
    { label: "Network", value: "Polygon Amoy", icon: "🟣" },
  ];

  return (
    <div className="min-h-screen bg-mesh">
      {/* Public Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-teal)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-bold gradient-text">PayLoop</span>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
          🔓 Public Page
        </span>
      </nav>

      <main className="max-w-4xl mx-auto px-8 py-16">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-4xl font-extrabold mb-4">
            Circle <span className="gradient-text">Transparency</span>
          </h1>
          <p className="text-[var(--text-secondary)] max-w-md mx-auto">
            All data is read directly from the Polygon blockchain. No one can alter these numbers.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((s, i) => (
            <div key={s.label} className="glass-card p-5 text-center animate-fade-in-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Contract Verification */}
        <div className="glass-card p-8 text-center">
          <h3 className="text-lg font-semibold mb-4">Verify On-Chain</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            Every contribution, loan, and vote is permanently recorded on the Polygon blockchain.
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="font-mono text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-4 py-2 rounded-lg">
              CircleVault: {truncateAddress(CIRCLE_VAULT_ADDRESS, 8)}
            </div>
            {CIRCLE_VAULT_ADDRESS && CIRCLE_VAULT_ADDRESS !== "0x" && (
              <a href={`https://amoy.polygonscan.com/address/${CIRCLE_VAULT_ADDRESS}`}
                target="_blank" rel="noopener noreferrer" className="btn-outline text-sm">
                View on PolygonScan →
              </a>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-xs text-[var(--text-muted)]">
          PayLoop — The chama treasurer that can never steal.
        </div>
      </main>
    </div>
  );
}
