
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

  // Load maintenance mode status from localStorage and server on initial load
  useEffect(() => {
    // Check localStorage first for faster loading
    const storedMaintenanceMode = localStorage.getItem('maintenanceMode');
    if (storedMaintenanceMode) {
      setIsMaintenanceMode(JSON.parse(storedMaintenanceMode));
    }

    // Then check server for the most up-to-date status
    fetchMaintenanceStatus();

    // Set up interval to periodically check maintenance status from server
    const intervalId = setInterval(fetchMaintenanceStatus, 30000); // every 30 seconds
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Function to fetch maintenance status from server
  const fetchMaintenanceStatus = async () => {
    try {
      // For now, we'll simulate this by using localStorage as a "global" storage
      // In a real app, this would be an API call to check the server status
      const storedGlobalStatus = localStorage.getItem('globalMaintenanceMode');
      if (storedGlobalStatus) {
        const parsedStatus = JSON.parse(storedGlobalStatus);
        // Only update if different to avoid unnecessary re-renders
        if (parsedStatus !== isMaintenanceMode) {
          setIsMaintenanceMode(parsedStatus);
          localStorage.setItem('maintenanceMode', JSON.stringify(parsedStatus));
        }
      }
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    }
  };

  const toggleMaintenanceMode = () => {
    const newMode = !isMaintenanceMode;
    
    // Update local state
    setIsMaintenanceMode(newMode);
    
    // Update both local and "global" storage
    localStorage.setItem('maintenanceMode', JSON.stringify(newMode));
    localStorage.setItem('globalMaintenanceMode', JSON.stringify(newMode));
    
    // In a real app, this would also make an API call to update server status
    // For example: await api.updateMaintenanceMode(newMode);
    
    // Broadcast the change to other open tabs/windows using BroadcastChannel API
    try {
      const bc = new BroadcastChannel('maintenance_channel');
      bc.postMessage({ maintenanceMode: newMode });
      bc.close();
    } catch (error) {
      console.error('BroadcastChannel not supported or failed:', error);
    }
  };

  // Listen for maintenance mode changes from other tabs/windows
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    
    try {
      bc = new BroadcastChannel('maintenance_channel');
      bc.onmessage = (event) => {
        if (event.data && typeof event.data.maintenanceMode === 'boolean') {
          setIsMaintenanceMode(event.data.maintenanceMode);
          localStorage.setItem('maintenanceMode', JSON.stringify(event.data.maintenanceMode));
        }
      };
    } catch (error) {
      console.error('BroadcastChannel not supported:', error);
    }
    
    return () => {
      if (bc) bc.close();
    };
  }, []);

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
