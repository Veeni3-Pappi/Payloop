"use client";

import { useVaultBalance } from "@/hooks/useCircleVault";
import { formatMatic } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Demo data for the chart (in production, this would come from event logs)
const demoData = [
  { date: "Jan", balance: 0 },
  { date: "Feb", balance: 0.02 },
  { date: "Mar", balance: 0.08 },
  { date: "Apr", balance: 0.15 },
  { date: "May", balance: 0.28 },
  { date: "Jun", balance: 0.45 },
];

export default function VaultChart() {
  const { data: balance } = useVaultBalance();
  const currentBalance = balance ? formatMatic(balance) : "0.0000";

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">Vault Growth</h3>
        <span className="text-xs text-[var(--text-muted)]">Last 6 months</span>
      </div>
      <div className="text-2xl font-bold gradient-text mb-4">{currentBalance} MATIC</div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={demoData}>
            <defs>
              <linearGradient id="vaultGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: "#1a1f35", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "8px", color: "#f1f5f9" }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Area type="monotone" dataKey="balance" stroke="#8b5cf6" fill="url(#vaultGradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
