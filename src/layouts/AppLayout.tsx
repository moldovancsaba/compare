import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import StrategyHeader from "@/components/StrategyHeader";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <div className="ml-[240px] transition-all duration-200">
        <StrategyHeader />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
