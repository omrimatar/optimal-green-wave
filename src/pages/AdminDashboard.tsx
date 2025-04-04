
import React, { useEffect } from 'react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import VisitsTable from '@/components/VisitsTable';
import { useMaintenanceMode } from '@/contexts/MaintenanceContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { isAdmin } = useMaintenanceMode();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  
  useEffect(() => {
    if (!isAdmin) {
      // Silently redirect without error message
      navigate('/');
    }
  }, [isAdmin, navigate]);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleGenerateTestData = async () => {
    // Generate a test page view for analytics data
    try {
      const fingerprint = crypto.randomUUID();
      
      // Insert a test visit record directly
      await fetch('/api/test-visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: '/test-page',
          language: language,
          fingerprint: fingerprint
        }),
      });
      
      // Refresh the page to show the new data
      window.location.reload();
    } catch (error) {
      console.error('Error generating test data:', error);
    }
  };

  if (!isAdmin) {
    return null; // Don't render anything if not admin
  }

  return (
    <div className="container mx-auto py-8 px-4" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('analytics_dashboard')}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateTestData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('generate_test_data') || 'Generate Test Data'}
          </Button>
          <Button variant="outline" onClick={handleGoBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('back_to_home')}
          </Button>
        </div>
      </div>
      <div className="space-y-8">
        <AnalyticsDashboard />
        <VisitsTable />
      </div>
    </div>
  );
};

export default AdminDashboard;
