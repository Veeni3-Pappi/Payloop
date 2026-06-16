"use client";
// ═══════════════════════════════════════════════════════════
// Hook — CircleVault contract interactions
// ═══════════════════════════════════════════════════════════

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { CIRCLE_VAULT_ABI, CIRCLE_VAULT_ADDRESS } from "@/lib/contracts";

export function useVaultBalance() {
  return useReadContract({
    address: CIRCLE_VAULT_ADDRESS,
    abi: CIRCLE_VAULT_ABI,
    functionName: "getBalance",
  });
}

export function useTotalVault() {
  return useReadContract({
    address: CIRCLE_VAULT_ADDRESS,
    abi: CIRCLE_VAULT_ABI,
    functionName: "totalVault",
  });
}

export function useMemberCount() {
  return useReadContract({
    address: CIRCLE_VAULT_ADDRESS,
    abi: CIRCLE_VAULT_ABI,
    functionName: "getMemberCount",
  });
}

export function useAllMembers() {
  return useReadContract({
    address: CIRCLE_VAULT_ADDRESS,
    abi: CIRCLE_VAULT_ABI,
    functionName: "getAllMembers",
  });
}

export function useContribution(memberAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CIRCLE_VAULT_ADDRESS,
    abi: CIRCLE_VAULT_ABI,
    functionName: "getContribution",
    args: memberAddress ? [memberAddress] : undefined,
    query: { enabled: !!memberAddress },
  });
}

export function useIsMember(memberAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: CIRCLE_VAULT_ADDRESS,
    abi: CIRCLE_VAULT_ABI,
    functionName: "isMember",
    args: memberAddress ? [memberAddress] : undefined,
    query: { enabled: !!memberAddress },
  });
}

export function useContribute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const contribute = (amountInMatic: string) => {
    writeContract({
      address: CIRCLE_VAULT_ADDRESS,
      abi: CIRCLE_VAULT_ABI,
      functionName: "contribute",
      value: parseEther(amountInMatic),
    });
  };

  return { contribute, hash, isPending, isConfirming, isSuccess, error };
}

export function useAddMember() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addMember = (memberAddress: `0x${string}`) => {
    writeContract({
      address: CIRCLE_VAULT_ADDRESS,
      abi: CIRCLE_VAULT_ABI,
      functionName: "addMember",
      args: [memberAddress],
    });
  };

  return { addMember, hash, isPending, isConfirming, isSuccess, error };
}

export function useRemoveMember() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const removeMember = (memberAddress: `0x${string}`) => {
    writeContract({
      address: CIRCLE_VAULT_ADDRESS,
      abi: CIRCLE_VAULT_ABI,
      functionName: "removeMember",
      args: [memberAddress],
    });
  };

  return { removeMember, hash, isPending, isConfirming, isSuccess, error };
}
