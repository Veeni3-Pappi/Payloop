import Sidebar from "@/components/Sidebar";
import ConnectWallet from "@/components/ConnectWallet";
import MobileBottomNav from "@/components/MobileBottomNav";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function CirclesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-[var(--glass-border)] flex items-center justify-between px-4 sm:px-8 bg-[var(--bg-secondary)]">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">Circle Management</h2>
          <ConnectWallet />
        </header>
        <main className="main-content-area flex-1 p-4 sm:p-8 bg-mesh overflow-y-auto">{children}</main>
      </div>
      <MobileBottomNav />
      <PWAInstallPrompt />
    </div>
  );
}
