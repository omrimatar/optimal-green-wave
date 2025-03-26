
import React, { createContext, useContext, useState, useEffect } from 'react';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  isAdmin: boolean;
  toggleMaintenanceMode: () => void;
  setIsAdmin: (status: boolean) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const MaintenanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

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

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, isAdmin, toggleMaintenanceMode, setIsAdmin }}>
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
