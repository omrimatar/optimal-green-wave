
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase, getOrCreateVisitorFingerprint } from '@/lib/supabaseClient';
import { useLanguage } from '@/contexts/LanguageContext';

const LogPageView: React.FC = () => {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const logVisit = async () => {
      try {
        const fingerprint = getOrCreateVisitorFingerprint();
        const currentPath = location.pathname;

        console.log(`Logging page view: Path=${currentPath}, Fingerprint=${fingerprint.substring(0, 8)}...`);

        const { error } = await supabase
          .from('visits')
          .insert({
            visitor_fingerprint: fingerprint,
            path: currentPath,
            language: language // Track which language the user is using
          });

        if (error) {
          console.error('Error logging page view:', error.message);
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
