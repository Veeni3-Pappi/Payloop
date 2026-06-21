"use client";

// ═══════════════════════════════════════════════════════════
// PushNotifications — global FCM mount
// Keeps the foreground message listener alive whenever the user is
// authenticated, and shows a floating "Enable notifications" prompt
// until permission has been granted.
// ═══════════════════════════════════════════════════════════

import { useAuthToken } from "@/hooks/useAuthToken";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export default function PushNotifications() {
  const token = useAuthToken();
  const { supported, permission, isRegistering, enablePush } =
    usePushNotifications(token);

  // Hide the prompt unless the user is signed in, FCM is configured/supported,
  // and permission hasn't been decided yet.
  const showPrompt =
    Boolean(token) && supported && permission === "default";

  if (!showPrompt) return null;

  return (
    <button
      onClick={enablePush}
      disabled={isRegistering}
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-violet-500/30 bg-[#1a1f35] px-4 py-2 text-sm font-medium text-slate-100 shadow-lg transition hover:border-violet-500/60 disabled:opacity-60"
    >
      <span aria-hidden>🔔</span>
      {isRegistering ? "Enabling…" : "Enable notifications"}
    </button>
  );
}
