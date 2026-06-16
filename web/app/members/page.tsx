"use client";

import { useAccount } from "wagmi";
import { useAllMembers, useAddMember, useRemoveMember } from "@/hooks/useCircleVault";
import { truncateAddress } from "@/lib/utils";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function MembersPage() {
  const { address } = useAccount();
  const { data: members, refetch } = useAllMembers();
  const { addMember, isPending: isAdding, isSuccess: addSuccess, error: addError } = useAddMember();
  const { removeMember, isPending: isRemoving, isSuccess: removeSuccess } = useRemoveMember();
  const [newAddress, setNewAddress] = useState("");

  useEffect(() => {
    if (addSuccess) { toast.success("Member added!"); setNewAddress(""); refetch(); }
  }, [addSuccess, refetch]);

  useEffect(() => {
    if (removeSuccess) { toast.success("Member removed"); refetch(); }
  }, [removeSuccess, refetch]);

  useEffect(() => {
    if (addError) toast.error(addError.message.slice(0, 100));
  }, [addError]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.startsWith("0x") || newAddress.length !== 42) {
      toast.error("Enter a valid Ethereum address");
      return;
    }
    addMember(newAddress as `0x${string}`);
  };

  const memberList = members || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage circle membership</p>
      </div>

      {/* Add Member Form */}
      <form onSubmit={handleAdd} className="glass-card p-6">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Add New Member</h3>
        <div className="flex gap-3">
          <input type="text" value={newAddress} onChange={(e) => setNewAddress(e.target.value)}
            placeholder="0x..." className="input-field flex-1 font-mono text-sm" disabled={isAdding} />
          <button type="submit" disabled={isAdding} className="btn-glow text-sm whitespace-nowrap">
            {isAdding ? "Adding…" : "Add Member"}
          </button>
        </div>
      </form>

      {/* Members List */}
      <div className="space-y-3">
        {memberList.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2">No members yet</h3>
            <p className="text-sm text-[var(--text-muted)]">Add members by their wallet address above.</p>
          </div>
        ) : (
          memberList.map((addr, i) => (
            <div key={addr} className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-teal-400 flex items-center justify-center text-sm font-bold text-white">
                {i + 1}
              </div>
              <div className="flex-1">
                <div className="font-mono text-sm">{truncateAddress(addr, 8)}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  {addr.toLowerCase() === address?.toLowerCase() ? "You" : "Member"}
                </div>
              </div>
              <a href={`https://amoy.polygonscan.com/address/${addr}`} target="_blank" rel="noopener noreferrer"
                className="text-xs text-[var(--accent-teal)] hover:underline">PolygonScan →</a>
              {addr.toLowerCase() !== address?.toLowerCase() && (
                <button onClick={() => removeMember(addr as `0x${string}`)} disabled={isRemoving}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
