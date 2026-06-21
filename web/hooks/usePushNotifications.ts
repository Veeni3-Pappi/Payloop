"use client";

// ═══════════════════════════════════════════════════════════
// usePushNotifications — FCM web push registration + foreground handling
// ═══════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import { onMessage } from "firebase/messaging";
import { toast } from "sonner";
import {
  firebaseConfig,
  VAPID_KEY,
  isFirebaseConfigured,
  getMessagingIfSupported,
} from "@/lib/firebase";
import { updateProfile } from "@/lib/api";

type PermissionState = "default" | "granted" | "denied" | "unsupported";

const FCM_TOKEN_KEY = "payloop_fcm_token";

/**
 * Register the FCM service worker, passing the (public) Firebase config as
 * query params so the static SW file can initialise without a build step.
 */
async function registerFcmServiceWorker(): Promise<ServiceWorkerRegistration> {
  const params = new URLSearchParams({
    apiKey: firebaseConfig.apiKey ?? "",
    authDomain: firebaseConfig.authDomain ?? "",
    projectId: firebaseConfig.projectId ?? "",
    storageBucket: firebaseConfig.storageBucket ?? "",
    messagingSenderId: firebaseConfig.messagingSenderId ?? "",
    appId: firebaseConfig.appId ?? "",
  });
  const registration = await navigator.serviceWorker.register(
    `/firebase-messaging-sw.js?${params.toString()}`,
    { scope: "/" }
  );
  // Make sure the worker is active before we ask for a push subscription.
  await navigator.serviceWorker.ready;
  return registration;
}

export function usePushNotifications(authToken: string | null) {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [registered, setRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const listenerBound = useRef(false);

  const supported = isFirebaseConfigured();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !supported) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PermissionState);
    setRegistered(Boolean(localStorage.getItem(FCM_TOKEN_KEY)));
  }, [supported]);

  const enablePush = useCallback(async () => {
    if (!authToken) {
      toast.error("Connect your wallet first to enable notifications.");
      return;
    }
    if (!supported) {
      toast.error("Push notifications are not configured.");
      return;
    }

    setIsRegistering(true);
    try {
      const messaging = await getMessagingIfSupported();
      if (!messaging) {
        setPermission("unsupported");
        toast.error("This browser does not support push notifications.");
        return;
      }

      const perm = await Notification.requestPermission();
      setPermission(perm as PermissionState);
      if (perm !== "granted") {
        toast.error("Notification permission denied.");
        return;
      }

      const registration = await registerFcmServiceWorker();

      // Clear any stale push subscription (e.g. left by the old PWA worker
      // or a previous VAPID key) — a mismatched key makes getToken abort.
      try {
        const existing = await registration.pushManager.getSubscription();
        if (existing) await existing.unsubscribe();
      } catch {
        /* non-fatal */
      }

      const { getToken } = await import("firebase/messaging");
      const fcmToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration,
      });

      if (!fcmToken) {
        toast.error("Could not obtain a device token.");
        return;
      }

      if (localStorage.getItem(FCM_TOKEN_KEY) !== fcmToken) {
        await updateProfile({ fcm_token: fcmToken }, authToken);
        localStorage.setItem(FCM_TOKEN_KEY, fcmToken);
      }
      setRegistered(true);
      toast.success("Push notifications enabled ✅");
    } catch (err: unknown) {
      console.error("[PayLoop] enablePush failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      const isPushServiceError =
        err instanceof Error &&
        (err.name === "AbortError" || /push service/i.test(msg));
      toast.error("Failed to enable notifications", {
        description: isPushServiceError
          ? "Your browser blocked the push service. In Brave, enable brave://settings/privacy → 'Use Google services for push messaging', or try Chrome."
          : msg,
      });
    } finally {
      setIsRegistering(false);
    }
  }, [authToken, supported]);

  // Foreground messages: FCM does not show a system notification while the
  // tab is focused, so surface it as a toast ourselves.
  useEffect(() => {
    if (!supported || permission !== "granted" || listenerBound.current) return;

    let unsub: (() => void) | undefined;
    (async () => {
      const messaging = await getMessagingIfSupported();
      if (!messaging) return;
      listenerBound.current = true;
      unsub = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? "PayLoop";
        const body = payload.notification?.body ?? "";
        toast(title, { description: body });
      });
    })();

    return () => {
      unsub?.();
      listenerBound.current = false;
    };
  }, [supported, permission]);

  return {
    supported,
    permission,
    registered,
    isRegistering,
    enablePush,
  };
}
