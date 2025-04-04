
import React from 'react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { useMaintenanceMode } from '@/contexts/MaintenanceContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { isAdmin } = useMaintenanceMode();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  React.useEffect(() => {
    if (!isAdmin) {
      toast.error(t('admin_access_required'));
      navigate('/');
    }
  }, [isAdmin, navigate, t]);

  const handleGoBack = () => {
    navigate('/');
  };

  if (!isAdmin) {
    return null; // Don't render anything if not admin
  }

  return (
    <div className="container mx-auto py-8 px-4" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('analytics_dashboard')}</h1>
        <Button variant="outline" onClick={handleGoBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('back_to_home')}
        </Button>
      </div>
      <AnalyticsDashboard />
    </div>
  );
};

export default AdminDashboard;
