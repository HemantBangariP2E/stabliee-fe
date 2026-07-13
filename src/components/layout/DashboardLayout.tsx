import { ReactNode } from "react";
import TopNav from "./TopNav";
import { RequireAuth } from "@/components/RequireAuth";
import { ActiveChainBadge } from "@/components/ActiveChainBadge";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <RequireAuth>
      <div className="min-h-screen w-full bg-background">
        <TopNav />
        <main className="max-w-[1800px] mx-auto px-6 py-8">
          <div className="mb-4 flex justify-end">
            <ActiveChainBadge />
          </div>
          {children}
        </main>

        <footer className="border-t border-border/50 mt-auto">
          <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-end" />
        </footer>
      </div>
    </RequireAuth>
  );
};

export default DashboardLayout;