
import React from 'react';
import { useMaintenanceMode } from '@/contexts/MaintenanceContext';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wrench, AlertTriangle, ArrowLeft } from 'lucide-react';

export const MaintenancePage = () => {
  const { isAdmin, toggleMaintenanceMode } = useMaintenanceMode();
  const { language } = useLanguage();

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4" 
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-md w-full mx-auto bg-white rounded-xl shadow-2xl p-8 text-center relative overflow-hidden">
        {/* Top decorative header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500"></div>
        
        {/* Main content */}
        <div className="py-4">
          <div className="mb-6 flex justify-center">
            <div className="bg-amber-100 p-4 rounded-full">
              <Wrench className="h-12 w-12 text-amber-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold mb-2 text-gray-800">המערכת בתחזוקה</h1>
          <div className="flex justify-center mb-4">
            <div className="h-1 w-20 bg-amber-400 rounded"></div>
          </div>
          
          <div className="flex justify-center mb-6">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 inline-flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <span className="text-amber-700 font-medium">עדכון מתוכנן</span>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4 text-lg">
            המערכת נמצאת כרגע בתחזוקה מתוזמנת לביצוע שיפורים ועדכונים.
          </p>
          <p className="text-gray-500 mb-8">
            אנו עובדים על שיפור המערכת עבורך. ננסה לחזור בהקדם האפשרי, תודה על הסבלנות.
          </p>
          
          {/* Animated pulses */}
          <div className="flex justify-center gap-2 mb-6">
            <div className="h-2 w-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
            <div className="h-2 w-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
            <div className="h-2 w-2 bg-amber-400 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></div>
          </div>
        </div>
        
        {/* Admin controls */}
        {isAdmin && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <Button 
              variant="outline" 
              onClick={toggleMaintenanceMode}
              className="bg-red-500 hover:bg-red-600 text-white border-0 shadow-sm flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              צא ממצב תחזוקה
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
