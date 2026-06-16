"use client";
// ═══════════════════════════════════════════════════════════
// ContributeModal — Deposit MATIC into CircleVault
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useContribute } from "@/hooks/useCircleVault";
import { toast } from "sonner";

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ContributeModal({
  isOpen,
  onClose,
  onSuccess,
}: ContributeModalProps) {
  const [amount, setAmount] = useState("");
  const { contribute, isPending, isConfirming, isSuccess, error, hash } =
    useContribute();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Contribution successful!", {
        description: `Transaction: ${hash?.slice(0, 10)}...`,
      });
      setAmount("");
      onSuccess?.();
      onClose();
    }
  }, [isSuccess, hash, onClose, onSuccess]);

  useEffect(() => {
    if (error) {
      toast.error("Contribution failed", {
        description: error.message.slice(0, 100),
      });
    }
  }, [error]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    contribute(amount);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card p-8 w-full max-w-md animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Contribute to Vault</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Amount (MATIC)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.0001"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.01"
                className="input-field pr-16"
                disabled={isPending || isConfirming}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] font-medium">
                MATIC
              </span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {["0.01", "0.05", "0.1", "0.5"].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className="flex-1 py-2 rounded-lg text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent-purple)] hover:text-[var(--accent-purple)] transition-all"
              >
                {val}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isPending || isConfirming || !amount}
            className="btn-glow w-full flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Spinner /> Confirm in MetaMask…
              </>
            ) : isConfirming ? (
              <>
                <Spinner /> Confirming on-chain…
              </>
            ) : (
              "Contribute"
            )}
          </button>

          {hash && (
            <a
              href={`https://amoy.polygonscan.com/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-xs text-[var(--accent-teal)] hover:underline"
            >
              View on PolygonScan →
            </a>
          )}
        </form>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
