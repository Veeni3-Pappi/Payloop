"use client";

import ConnectWallet from "@/components/ConnectWallet";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Link2, Boxes, Gauge, ArrowRight } from "lucide-react";
import { PolygonLogo } from "@/components/icons/BrandIcons";

export default function LandingPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) router.push("/dashboard");
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-mesh flex flex-col">
      {/* Nav */}
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
        <ConnectWallet />
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="max-w-3xl text-center animate-fade-in-up">
          {/* Floating orbs */}
          <div className="relative mb-8">
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute -top-10 -right-20 w-60 h-60 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--border-subtle)] text-xs font-medium text-[var(--accent-purple)] mb-6 animate-fade-in-up-delay-1">
            <Link2 size={14} /> Built on Polygon Amoy Testnet
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 animate-fade-in-up-delay-1">
            The chama treasurer
            <br />
            <span className="gradient-text">that can never steal.</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-10 animate-fade-in-up-delay-2">
            PayLoop digitises African savings circles using blockchain. Smart contracts replace the treasurer — your funds are transparent, immutable, and always yours.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up-delay-3">
            <ConnectWallet />
            <a href="/transparency" className="btn-outline text-sm flex items-center gap-2">
              View Public Transparency <ArrowRight size={15} />
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-20 animate-fade-in-up-delay-3">
            {[
              { label: "Smart Contracts", value: "4", icon: Boxes, accent: "var(--accent-purple)" },
              { label: "On-chain Score", value: "0–1000", icon: Gauge, accent: "var(--accent-blue)" },
              { label: "Network", value: "Polygon", brand: true },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="glass-card p-5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: stat.brand ? "rgba(130,71,229,0.15)" : `color-mix(in srgb, ${stat.accent} 16%, transparent)` }}
                  >
                    {stat.brand ? <PolygonLogo size={22} /> : Icon && <Icon size={22} style={{ color: stat.accent }} strokeWidth={2} />}
                  </div>
                  <div className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--glass-border)] py-6 text-center text-xs text-[var(--text-muted)]">
        PayLoop © 2026 — Eldohub Web3 Hackathon
      </footer>
    </div>
  );
}
