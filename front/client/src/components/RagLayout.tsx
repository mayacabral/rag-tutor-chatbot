import { useAuth } from "@/_core/hooks/useAuth";
import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { RightPanel } from "./RightPanel";

interface RagLayoutProps {
  children: ReactNode;
}

export function RagLayout({ children }: RagLayoutProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  if (isAdmin) {
    // Admin layout: 3 columns (sidebar, chat, right panel)
    return (
      <div className="flex h-screen bg-slate-950">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-hidden">
            {children}
          </main>
        </div>

        {/* Right Panel */}
        <RightPanel />
      </div>
    );
  }

  // User layout: single column (chat only)
  return (
    <div className="flex h-screen flex-col bg-slate-950">
      <Header />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
