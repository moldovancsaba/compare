import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/layouts/AppLayout";
import Dashboard from "@/pages/Dashboard";
import StrategyPage from "@/pages/StrategyPage";
import IntelligencePage from "@/pages/IntelligencePage";
import PortfolioPage from "@/pages/PortfolioPage";
import BrandPage from "@/pages/BrandPage";
import ContentCreationPage from "@/pages/ContentCreationPage";
import LeadGenerationPage from "@/pages/LeadGenerationPage";
import CrmPage from "@/pages/CrmPage";
import PreFortitudePage from "@/pages/PreFortitudePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/strategy" element={<StrategyPage />} />
            <Route path="/intelligence" element={<IntelligencePage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/brand" element={<BrandPage />} />
            <Route path="/content" element={<ContentCreationPage />} />
            <Route path="/leads" element={<LeadGenerationPage />} />
            <Route path="/crm" element={<CrmPage />} />
            <Route path="/pre-fortitude" element={<PreFortitudePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
