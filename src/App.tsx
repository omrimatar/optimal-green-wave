
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Maintenance from "./pages/Maintenance";

const queryClient = new QueryClient();

const App = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const storedMaintenanceMode = localStorage.getItem('maintenanceMode');
    if (storedMaintenanceMode) {
      setMaintenanceMode(storedMaintenanceMode === 'true');
    }
  }, []);

  const handleMaintenanceToggle = (value: boolean) => {
    setMaintenanceMode(value);
    localStorage.setItem('maintenanceMode', value.toString());
  };

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route 
                path="/" 
                element={
                  maintenanceMode 
                    ? <Navigate to="/maintenance" replace /> 
                    : <Index onMaintenanceToggle={handleMaintenanceToggle} />
                } 
              />
              <Route 
                path="/maintenance" 
                element={
                  <Maintenance 
                    onDisableMaintenance={() => handleMaintenanceToggle(false)} 
                    isAdmin={true} 
                  />
                } 
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
