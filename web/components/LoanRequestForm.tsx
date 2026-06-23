"use client";
// ═══════════════════════════════════════════════════════════
// LoanRequestForm — Submit a loan request to LendingPool
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useRequestLoan } from "@/hooks/useLendingPool";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

interface LoanRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoanRequestForm({
  isOpen,
  onClose,
  onSuccess,
}: LoanRequestFormProps) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [repaymentDays, setRepaymentDays] = useState("30");
  const { requestLoan, isPending, isConfirming, isSuccess, error, hash } =
    useRequestLoan();

  useEffect(() => {
    if (isSuccess) {
      toast.success("Loan request submitted!", {
        description: "Members can now vote on your request.",
      });
      setAmount("");
      setReason("");
      setRepaymentDays("30");
      onSuccess?.();
      onClose();
    }
  }, [isSuccess, onClose, onSuccess]);

  useEffect(() => {
    if (error) {
      toast.error("Loan request failed", {
        description: error.message.slice(0, 100),
      });
    }
  }, [error]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    requestLoan(amount, reason, parseInt(repaymentDays));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card p-8 w-full max-w-lg animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Request a Loan</h2>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Loan Amount (MATIC)
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.1"
              className="input-field"
              disabled={isPending || isConfirming}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you need this loan?"
              rows={3}
              className="input-field resize-none"
              disabled={isPending || isConfirming}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              Repayment Period
            </label>
            <div className="grid grid-cols-3 gap-2">
              {["7", "14", "30"].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setRepaymentDays(days)}
                  className={`py-3 rounded-lg text-sm font-medium border transition-all ${
                    repaymentDays === days
                      ? "bg-[var(--accent-purple)] bg-opacity-20 border-[var(--accent-purple)] text-[var(--accent-purple)]"
                      : "bg-[var(--bg-secondary)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--accent-purple)]"
                  }`}
                >
                  {days} days
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || isConfirming || !amount || !reason}
            className="btn-glow w-full flex items-center justify-center gap-2"
          >
            {isPending ? (
              "Confirm in MetaMask…"
            ) : isConfirming ? (
              "Confirming on-chain…"
            ) : (
              "Submit Loan Request"
            )}
          </button>

          {hash && (
            <a
              href={`https://amoy.polygonscan.com/tx/${hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 text-xs text-[var(--accent-teal)] hover:underline"
            >
              View on PolygonScan <ExternalLink size={12} />
            </a>
          )}
        </form>
      </div>
    </div>
  );
}
