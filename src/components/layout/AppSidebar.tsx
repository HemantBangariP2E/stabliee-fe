import { useLocation, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, History, ShoppingCart, Users, Settings, LogOut, PlusCircle } from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Add USDC", url: "/receive", icon: PlusCircle },
  { title: "Transactions", url: "/transactions", icon: ArrowLeftRight },
  { title: "Activity", url: "/activity", icon: History },
  { title: "Buy/Sell", url: "/buy-sell", icon: ShoppingCart },
  { title: "Contacts", url: "/beneficiary", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
];

const AppSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border flex flex-col">
      <Link 
        to="/dashboard" 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="block p-6 cursor-pointer hover:bg-muted/50 rounded-lg transition-all duration-200 hover:scale-105"
      >
        <Logo size="md" />
      </Link>

      <nav className="flex-1 px-4 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <li key={item.title}>
                <Link
                  to={item.url}
                  className={cn(
                    "sidebar-item",
                    isActive && "sidebar-item-active"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;