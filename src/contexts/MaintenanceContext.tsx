
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  isAdmin: boolean;
  toggleMaintenanceMode: () => void;
  setIsAdmin: (status: boolean) => void;
  showAnalytics: boolean;
  setShowAnalytics: (show: boolean) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Load maintenance mode status from localStorage on initial load
  useEffect(() => {
    const storedMaintenanceMode = localStorage.getItem('maintenanceMode');
    if (storedMaintenanceMode) {
      setIsMaintenanceMode(JSON.parse(storedMaintenanceMode));
    }
  }, []);

  const toggleMaintenanceMode = () => {
    const newMode = !isMaintenanceMode;
    setIsMaintenanceMode(newMode);
    localStorage.setItem('maintenanceMode', JSON.stringify(newMode));
  };

  useEffect(() => {
    if (showAnalytics) {
      // We don't use navigate directly here because it would create a dependency
      // on react-router-dom in this context provider that renders outside the router.
      // Instead we'll handle the navigation in the component that uses this context.
      const timer = setTimeout(() => setShowAnalytics(false), 100);
      return () => clearTimeout(timer);
    }
  }, [showAnalytics]);

  return (
    <MaintenanceContext.Provider value={{ 
      isMaintenanceMode, 
      isAdmin, 
      toggleMaintenanceMode, 
      setIsAdmin,
      showAnalytics,
      setShowAnalytics
    }}>
      {children}
    </MaintenanceContext.Provider>
  );
};

export const useMaintenanceMode = (): MaintenanceContextType => {
  const context = useContext(MaintenanceContext);
  if (context === undefined) {
    throw new Error('useMaintenanceMode must be used within a MaintenanceProvider');
  }
  return context;
};
