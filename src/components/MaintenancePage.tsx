
import React from 'react';
import { useMaintenanceMode } from '@/contexts/MaintenanceContext';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wrench } from 'lucide-react';

export const MaintenancePage = () => {
  const { isAdmin, toggleMaintenanceMode } = useMaintenanceMode();
  const { language } = useLanguage();

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4" 
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-md w-full mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="bg-yellow-100 p-3 rounded-full">
            <Wrench className="h-12 w-12 text-yellow-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold mb-4">תחזוקת מערכת</h1>
        <p className="text-gray-600 mb-6">
          המערכת נמצאת כרגע תחת תחזוקה. אנו עובדים על שיפורים ונחזור לפעילות בקרוב.
          נא לנסות שוב מאוחר יותר.
        </p>
        
        {isAdmin && (
          <div className="mt-8">
            <Button 
              variant="outline" 
              onClick={toggleMaintenanceMode}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              צא ממצב תחזוקה
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
