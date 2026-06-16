"use client";
// ═══════════════════════════════════════════════════════════
// Hook — LendingPool contract interactions
// ═══════════════════════════════════════════════════════════

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { LENDING_POOL_ABI, LENDING_POOL_ADDRESS } from "@/lib/contracts";

export function useLoanCount() {
  return useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: "getLoanCount",
  });
}

export function useLoan(loanId: number) {
  return useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: "getLoan",
    args: [BigInt(loanId)],
  });
}

export function useTotalMembers() {
  return useReadContract({
    address: LENDING_POOL_ADDRESS,
    abi: LENDING_POOL_ABI,
    functionName: "totalMembers",
  });
}

export function useRequestLoan() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const requestLoan = (amountInMatic: string, reason: string, repaymentDays: number) => {
    writeContract({
      address: LENDING_POOL_ADDRESS,
      abi: LENDING_POOL_ABI,
      functionName: "requestLoan",
      args: [parseEther(amountInMatic), reason, BigInt(repaymentDays)],
    });
  };

  return { requestLoan, hash, isPending, isConfirming, isSuccess, error };
}

export function useVoteLoan() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const vote = (loanId: number, approved: boolean) => {
    writeContract({
      address: LENDING_POOL_ADDRESS,
      abi: LENDING_POOL_ABI,
      functionName: "vote",
      args: [BigInt(loanId), approved],
    });
  };

  return { vote, hash, isPending, isConfirming, isSuccess, error };
}

export function useRepayLoan() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const repayLoan = (loanId: number, amountInMatic: string) => {
    writeContract({
      address: LENDING_POOL_ADDRESS,
      abi: LENDING_POOL_ABI,
      functionName: "repayLoan",
      args: [BigInt(loanId)],
      value: parseEther(amountInMatic),
    });
  };

  return { repayLoan, hash, isPending, isConfirming, isSuccess, error };
}
