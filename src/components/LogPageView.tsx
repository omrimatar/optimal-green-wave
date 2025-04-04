
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const LogPageView: React.FC = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const logVisit = async () => {
      try {
        // Generate a unique visitor fingerprint if not already present
        const fingerprint = crypto.randomUUID(); 
        const currentPath = location.pathname;

        console.log(`Logging page view: Path=${currentPath}, Fingerprint=${fingerprint.substring(0, 8)}...`);

        const { error } = await supabase
          .from('visits')
          .insert({
            visitor_fingerprint: fingerprint,
            path: currentPath,
            language: language
          });

        if (error) {
          console.error('Error logging page visit:', error.message);
        }
      } catch (err) {
        console.error('Failed to log page view:', err);
      }
    };

    logVisit();
  }, [location.pathname, language]);

  return null;
};

export default LogPageView;
