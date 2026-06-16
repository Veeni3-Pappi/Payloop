"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useLoanCount, useLoan, useVoteLoan, useRequestLoan, useRepayLoan } from "@/hooks/useLendingPool";
import { formatMatic, loanStatusLabel, loanStatusColor, truncateAddress, formatTimestamp } from "@/lib/utils";
import LoanRequestForm from "@/components/LoanRequestForm";
import { toast } from "sonner";

export default function LoansPage() {
  const { address } = useAccount();
  const { data: loanCount } = useLoanCount();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const count = loanCount !== undefined ? Number(loanCount) : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Loans</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Request loans and vote on proposals</p>
        </div>
        <button onClick={() => setShowRequestForm(true)} className="btn-glow text-sm">
          + Request Loan
        </button>
      </div>

      {count === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold mb-2">No loan requests yet</h3>
          <p className="text-sm text-[var(--text-muted)]">Be the first to request a loan from the circle pool.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from({ length: count }, (_, i) => (
            <LoanCard key={i} loanId={i} currentWallet={address} />
          ))}
        </div>
      )}

      <LoanRequestForm isOpen={showRequestForm} onClose={() => setShowRequestForm(false)} />
    </div>
  );
}

function LoanCard({ loanId, currentWallet }: { loanId: number; currentWallet?: `0x${string}` }) {
  const { data: loan } = useLoan(loanId);
  const { vote, isPending: isVoting } = useVoteLoan();
  const { repayLoan, isPending: isRepaying } = useRepayLoan();

  if (!loan) return <div className="glass-card p-4 animate-shimmer h-24" />;

  const status = Number(loan.status);
  const isBorrower = currentWallet?.toLowerCase() === loan.borrower.toLowerCase();

  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${loanStatusColor(status)} border-current bg-current/10`}>
              {loanStatusLabel(status)}
            </span>
            <span className="text-xs text-[var(--text-muted)]">Loan #{loanId}</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mt-2">{loan.reason}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{formatMatic(loan.amount)} MATIC</div>
          <div className="text-xs text-[var(--text-muted)]">{Number(loan.repaymentDays)} day repayment</div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--glass-border)] pt-3">
        <span>Borrower: {truncateAddress(loan.borrower)}</span>
        <span>Votes: {Number(loan.votesFor)} for / {Number(loan.votesAgainst)} against</span>
        <span>{formatTimestamp(loan.createdAt)}</span>
      </div>

      {/* Actions */}
      {status === 0 && !isBorrower && (
        <div className="flex gap-3 mt-4">
          <button onClick={() => vote(loanId, true)} disabled={isVoting}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
            ✓ Approve
          </button>
          <button onClick={() => vote(loanId, false)} disabled={isVoting}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
            ✕ Reject
          </button>
        </div>
      )}

      {status === 3 && isBorrower && (
        <button onClick={() => repayLoan(loanId, formatMatic(loan.amount, 18))} disabled={isRepaying}
          className="btn-glow w-full mt-4 text-sm">
          {isRepaying ? "Repaying…" : "Repay Loan"}
        </button>
      )}
    </div>
  );
}
