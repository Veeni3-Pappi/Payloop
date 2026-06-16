// ═══════════════════════════════════════════════════════════
// PayLoop — Format Utilities
// ═══════════════════════════════════════════════════════════

/**
 * Truncate a wallet address for display: 0x1234...abcd
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Format wei to MATIC with specified decimals
 */
export function formatMatic(wei: bigint | string | number, decimals = 4): string {
  const value = typeof wei === "bigint" ? wei : BigInt(wei || 0);
  const matic = Number(value) / 1e18;
  return matic.toFixed(decimals);
}

/**
 * Format a timestamp (seconds) to readable date
 */
export function formatTimestamp(timestamp: number | bigint): string {
  const ts = typeof timestamp === "bigint" ? Number(timestamp) : timestamp;
  if (ts === 0) return "—";
  return new Date(ts * 1000).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Loan status enum to human-readable label
 */
export function loanStatusLabel(status: number): string {
  const labels: Record<number, string> = {
    0: "Pending",
    1: "Approved",
    2: "Rejected",
    3: "Disbursed",
    4: "Repaid",
  };
  return labels[status] || "Unknown";
}

/**
 * Loan status to Tailwind colour class
 */
export function loanStatusColor(status: number): string {
  const colors: Record<number, string> = {
    0: "text-amber-400",
    1: "text-emerald-400",
    2: "text-red-400",
    3: "text-blue-400",
    4: "text-purple-400",
  };
  return colors[status] || "text-gray-400";
}

/**
 * Credit score to colour class
 */
export function scoreColor(score: number): string {
  if (score >= 701) return "text-emerald-400";
  if (score >= 401) return "text-amber-400";
  return "text-red-400";
}

/**
 * Credit score to gradient class for ring
 */
export function scoreGradient(score: number): string {
  if (score >= 701) return "from-emerald-400 to-teal-300";
  if (score >= 401) return "from-amber-400 to-yellow-300";
  return "from-red-400 to-rose-300";
}

/**
 * Credit score to label
 */
export function scoreLabel(score: number): string {
  if (score >= 701) return "Excellent";
  if (score >= 401) return "Fair";
  return "Needs Improvement";
}
