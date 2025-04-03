
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { MaintenanceProvider } from "@/contexts/MaintenanceContext";
import { MaintenancePage } from "@/components/MaintenancePage";
import { MobileDetectionDialog } from "@/components/MobileDetectionDialog";
import { LanguageToggle } from "@/components/LanguageToggle";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LogsPage from "./pages/LogsPage";
import { useMaintenanceMode } from "@/contexts/MaintenanceContext";

const queryClient = new QueryClient();

// Component to conditionally render content based on maintenance mode
const MaintenanceWrapper = ({ children }: { children: React.ReactNode }) => {
  const { isMaintenanceMode, isAdmin } = useMaintenanceMode();
  
  if (isMaintenanceMode && !isAdmin) {
    return <MaintenancePage />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <MaintenanceProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <MobileDetectionDialog />
          <LanguageToggle />
          <BrowserRouter>
            <MaintenanceWrapper>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/logs" element={<LogsPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </MaintenanceWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </MaintenanceProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
