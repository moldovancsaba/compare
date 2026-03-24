import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Search,
  Paintbrush,
  Rocket,
  Users,
  ChevronLeft,
  ChevronRight,
  Zap,
  Package,
  PenTool,
  Target,
  Beaker,
} from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Zap, path: "/" },
  { id: "strategy", label: "Strategy", icon: Brain, path: "/strategy" },
  { id: "intelligence", label: "Market Intelligence", icon: Search, path: "/intelligence" },
  { id: "portfolio", label: "Portfolio & Offerings", icon: Package, path: "/portfolio" },
  { id: "brand", label: "Brand Management", icon: Paintbrush, path: "/brand" },
  { id: "content", label: "Digital Presence", icon: PenTool, path: "/content" },
  { id: "leads", label: "Lead Generation", icon: Target, path: "/leads" },
  { id: "crm", label: "CRM", icon: Users, path: "/crm" },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-50"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sidebar-foreground font-display font-bold text-sm tracking-tight"
          >
            Fortitude AI
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Pre-Fortitude AI separator */}
        {!collapsed && <div className="pt-3 pb-1 px-3"><span className="text-[10px] font-semibold text-sidebar-muted uppercase tracking-wider">Labs</span></div>}
        {collapsed && <div className="pt-3" />}
        <button
          onClick={() => navigate("/pre-fortitude")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === "/pre-fortitude"
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
          }`}
        >
          <Beaker className={`w-[18px] h-[18px] flex-shrink-0 ${location.pathname === "/pre-fortitude" ? "text-sidebar-primary" : ""}`} />
          {!collapsed && <span>Pre-Fortitude AI</span>}
        </button>
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 pb-4">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-[18px] h-[18px] flex-shrink-0" />
          ) : (
            <>
              <ChevronLeft className="w-[18px] h-[18px] flex-shrink-0" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
};

export default AppSidebar;
