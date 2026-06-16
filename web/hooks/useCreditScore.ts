"use client";
// ═══════════════════════════════════════════════════════════
// Hook — CreditScore contract interactions
// ═══════════════════════════════════════════════════════════

import { useReadContract } from "wagmi";
import { CREDIT_SCORE_ABI, CREDIT_SCORE_ADDRESS } from "@/lib/contracts";

export function useCreditScore(walletAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CREDIT_SCORE_ADDRESS,
    abi: CREDIT_SCORE_ABI,
    functionName: "getScore",
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: !!walletAddress },
  });
}

export function useCreditScoreData(walletAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CREDIT_SCORE_ADDRESS,
    abi: CREDIT_SCORE_ABI,
    functionName: "getScoreData",
    args: walletAddress ? [walletAddress] : undefined,
    query: { enabled: !!walletAddress },
  });
}
