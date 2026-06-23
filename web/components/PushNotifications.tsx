"use client";

// ═══════════════════════════════════════════════════════════
// PushNotifications — global FCM mount
// Keeps the foreground message listener alive whenever the user is
// authenticated, and shows a floating "Enable notifications" prompt
// until permission has been granted.
// ═══════════════════════════════════════════════════════════

import { useAuthToken } from "@/hooks/useAuthToken";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Bell } from "lucide-react";

export default function PushNotifications() {
  const token = useAuthToken();
  const { supported, permission, registered, isRegistering, enablePush } =
    usePushNotifications(token);

  // Show the prompt when the user is signed in, FCM is supported, the user
  // hasn't blocked notifications, and no device token has been registered yet.
  // (Stays visible when permission is already "granted" but registration
  // failed, so the user can retry.)
  const showPrompt =
    Boolean(token) &&
    supported &&
    !registered &&
    permission !== "denied" &&
    permission !== "unsupported";

  if (!showPrompt) return null;

  return (
    <button
      onClick={enablePush}
      disabled={isRegistering}
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-violet-500/30 bg-[#1a1f35] px-4 py-2 text-sm font-medium text-slate-100 shadow-lg transition hover:border-violet-500/60 disabled:opacity-60"
    >
      <Bell size={16} strokeWidth={2} />
      {isRegistering ? "Enabling…" : "Enable notifications"}
    </button>
  );
}
