import { ReactNode } from "react";
import TopNav from "./TopNav";
interface DashboardLayoutProps {
  children: ReactNode;
}
const DashboardLayout = ({
  children
}: DashboardLayoutProps) => {
  return <div className="min-h-screen w-full bg-background">
      <TopNav />
      <main className="max-w-[1800px] mx-auto px-6 py-8">
        {children}
      </main>
      
      {/* Minimal Footer */}
      <footer className="border-t border-border/50 mt-auto">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-end">
          
        </div>
      </footer>
    </div>;
};
export default DashboardLayout;