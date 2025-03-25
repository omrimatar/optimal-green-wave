
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface MaintenanceProps {
  onDisableMaintenance?: () => void;
  isAdmin?: boolean;
}

const Maintenance = ({ onDisableMaintenance, isAdmin = false }: MaintenanceProps) => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const handleDisableMaintenance = () => {
    if (onDisableMaintenance) {
      onDisableMaintenance();
    } else {
      localStorage.setItem('maintenanceMode', 'false');
      navigate('/');
    }
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center" 
      dir={language === 'he' ? 'rtl' : 'ltr'}
    >
      <Card className="p-8 max-w-md mx-auto text-center shadow-lg bg-white/90 backdrop-blur">
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
              <Settings className="w-10 h-10 text-purple-600 animate-spin-slow" />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {language === 'he' ? 'המערכת בתחזוקה' : 'System Maintenance'}
            </h1>
            
            <p className="text-gray-600">
              {language === 'he' 
                ? 'מערכת מחשבון גל ירוק נמצאת כרגע בתחזוקה. אנא נסו שוב מאוחר יותר.'
                : 'The Green Wave Calculator is currently under maintenance. Please try again later.'}
            </p>
            
            <div className="h-1 w-20 bg-gradient-to-r from-purple-400 to-blue-500 rounded-full my-2" />
            
            <p className="text-sm text-gray-500">
              {language === 'he'
                ? 'אנו עובדים על שיפור המערכת ונחזור בהקדם.'
                : 'We are working to improve the system and will be back soon.'}
            </p>
          </div>
          
          {isAdmin && (
            <Button 
              onClick={handleDisableMaintenance}
              variant="outline" 
              className="mt-8 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              {language === 'he' ? 'בטל מצב תחזוקה' : 'Disable Maintenance Mode'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default Maintenance;
