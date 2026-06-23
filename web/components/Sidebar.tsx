"use client";
// ═══════════════════════════════════════════════════════════
// Sidebar — Dashboard navigation with active state + account
// ═══════════════════════════════════════════════════════════

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import {
  LayoutDashboard,
  Orbit,
  HandCoins,
  Gauge,
  Users,
  Eye,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { truncateAddress } from "@/lib/utils";

const navItems: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Circles", href: "/circles", icon: Orbit },
  { label: "Loans", href: "/loans", icon: HandCoins },
  { label: "Credit Score", href: "/score", icon: Gauge },
  { label: "Members", href: "/members", icon: Users },
  { label: "Transparency", href: "/transparency", icon: Eye },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { logout } = useAuth();

  return (
    <aside className="sidebar-desktop w-64 min-h-screen bg-[var(--bg-secondary)] border-r border-[var(--glass-border)] flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-[var(--glass-border)]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-purple)] to-[var(--accent-teal)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-lg font-bold gradient-text">PayLoop</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${active ? "active" : ""}`}
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer — account + logout */}
      <div className="p-4 border-t border-[var(--glass-border)] space-y-3">
        {isConnected && address && (
          <>
            <div className="glass-card flex items-center gap-2.5 px-3 py-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-mono text-[var(--text-primary)] truncate">
                  {truncateAddress(address)}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">Polygon Amoy</div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] border border-[var(--glass-border)] hover:text-red-400 hover:border-red-400/40 hover:bg-red-500/5 transition-all"
            >
              <LogOut size={16} strokeWidth={2} />
              Log out
            </button>
          </>
        )}
        <div className="text-[10px] text-[var(--text-muted)] text-center pt-1">
          <span className="gradient-text font-semibold">PayLoop</span> v1.0 · Testnet
        </div>
      </div>
    </aside>
  );
}
