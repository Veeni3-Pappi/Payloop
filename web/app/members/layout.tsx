import Sidebar from "@/components/Sidebar";
import ConnectWallet from "@/components/ConnectWallet";

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-[var(--glass-border)] flex items-center justify-between px-8 bg-[var(--bg-secondary)]">
          <h2 className="text-sm font-medium text-[var(--text-secondary)]">Member Management</h2>
          <ConnectWallet />
        </header>
        <main className="flex-1 p-8 bg-mesh overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
