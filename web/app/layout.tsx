import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "PayLoop — Decentralized Chama Savings",
  description: "The chama treasurer that can never steal. Decentralized group savings and micro-lending on Polygon.",
  keywords: ["chama", "savings", "blockchain", "polygon", "PayLoop", "DeFi", "Kenya"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1a1f35",
                border: "1px solid rgba(139,92,246,0.2)",
                color: "#f1f5f9",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
