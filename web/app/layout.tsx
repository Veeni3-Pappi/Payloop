import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10b981",
};

export const metadata: Metadata = {
  title: "PayLoop — Decentralized Chama Savings",
  description: "The chama treasurer that can never steal. Decentralized group savings and micro-lending on Polygon.",
  keywords: ["chama", "savings", "blockchain", "polygon", "PayLoop", "DeFi", "Kenya"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PayLoop",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Geist:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* PWA Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1c1c1e",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#f4f5f4",
              },
            }}
          />
        </Providers>
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                var isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
                if (isLocal) {
                  // Dev: the caching PWA worker serves stale HMR assets and
                  // causes reload loops. Remove it and clear its caches.
                  // (The FCM worker, firebase-messaging-sw.js, is left intact.)
                  navigator.serviceWorker.getRegistrations().then(function (regs) {
                    regs.forEach(function (r) {
                      var url = (r.active && r.active.scriptURL) || '';
                      if (url.indexOf('/sw.js') !== -1) r.unregister();
                    });
                  });
                  if (window.caches) {
                    caches.keys().then(function (keys) {
                      keys.forEach(function (k) {
                        if (k.indexOf('payloop') !== -1) caches.delete(k);
                      });
                    });
                  }
                } else {
                  window.addEventListener('load', function () {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function (reg) { console.log('[PayLoop] SW registered:', reg.scope); })
                      .catch(function (err) { console.warn('[PayLoop] SW registration failed:', err); });
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
