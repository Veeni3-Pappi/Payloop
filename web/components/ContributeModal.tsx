"use client";
// ═══════════════════════════════════════════════════════════
// ContributeModal — Deposit MATIC or pay via M-Pesa into circle
// ═══════════════════════════════════════════════════════════

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useContribute } from "@/hooks/useCircleVault";
import { useAuth } from "@/hooks/useAuth";
import { initiateStkPush, getCircles } from "@/lib/api";
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
  const [paymentMethod, setPaymentMethod] = useState<"crypto" | "mpesa">("crypto");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [amountKes, setAmountKes] = useState("");
  const [isLoadingMpesa, setIsLoadingMpesa] = useState(false);

  const { address } = useAccount();
  const { token, isAuthenticated, login } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "crypto") {
      if (!amount || parseFloat(amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }
      contribute(amount);
    } else {
      // M-Pesa flow
      if (!phone) {
        toast.error("Please enter your M-Pesa phone number");
        return;
      }
      if (!amountKes || parseFloat(amountKes) < 1) {
        toast.error("Please enter a valid amount (min 1 KES)");
        return;
      }

      // Ensure authenticated
      let currentToken = token;
      if (!isAuthenticated || !currentToken) {
        toast.info("Please verify your wallet first...");
        await login();
        return;
      }

      setIsLoadingMpesa(true);
      try {
        // Fetch circles to find the one associated with the user
        const circles = await getCircles(currentToken);
        if (circles.length === 0) {
          throw new Error("No savings circles found in your account.");
        }
        const activeCircle = circles[0]; // Use the first active circle

        const response = await initiateStkPush(
          {
            phone_number: phone,
            amount: parseFloat(amountKes),
            circle_id: activeCircle.id,
            wallet_address: address || "",
          },
          currentToken
        );

        toast.success("STK Push initiated successfully!", {
          description: response.message || "Check your phone for the M-Pesa PIN prompt.",
        });
        
        setAmountKes("");
        setPhone("");
        onClose();
      } catch (err: any) {
        console.error("M-Pesa payment initiation failed:", err);
        toast.error("M-Pesa payment failed", {
          description: err.message || "Failed to initiate STK push.",
        });
      } finally {
        setIsLoadingMpesa(false);
      }
    }
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

        {/* Payment Method Selector */}
        <div className="flex rounded-lg bg-[var(--bg-secondary)] p-1 border border-[var(--glass-border)] mb-6">
          <button
            type="button"
            onClick={() => setPaymentMethod("crypto")}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
              paymentMethod === "crypto"
                ? "bg-[var(--accent-purple)] text-white shadow-md"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Crypto (MATIC)
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("mpesa")}
            className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all ${
              paymentMethod === "mpesa"
                ? "bg-[var(--accent-purple)] text-white shadow-md"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            M-Pesa (Mobile Money)
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {paymentMethod === "crypto" ? (
            <>
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
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="254712345678"
                  className="input-field"
                  disabled={isLoadingMpesa}
                />
                <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                  Must be format 2547XXXXXXXX or 2541XXXXXXXX
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Amount (KES)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={amountKes}
                    onChange={(e) => setAmountKes(e.target.value)}
                    placeholder="100"
                    className="input-field pr-16"
                    disabled={isLoadingMpesa}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)] font-medium">
                    KES
                  </span>
                </div>
                {amountKes && parseFloat(amountKes) > 0 && (
                  <span className="text-xs text-[var(--accent-teal)] mt-2 block">
                    Estimated on-chain value: {(parseFloat(amountKes) * 0.000005).toFixed(6)} MATIC
                  </span>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isPending || isConfirming || isLoadingMpesa || (paymentMethod === "crypto" ? !amount : (!phone || !amountKes))}
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
            ) : isLoadingMpesa ? (
              <>
                <Spinner /> Processing M-Pesa…
              </>
            ) : (
              "Contribute"
            )}
          </button>

          {paymentMethod === "crypto" && hash && (
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
