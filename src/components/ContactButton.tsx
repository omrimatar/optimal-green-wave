
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

export const ContactButton = () => {
  const { t } = useLanguage();
  
  const handleContact = () => {
    window.location.href = 'mailto:omrimatar@gmail.com';
  };
  
  return (
    <div className="w-full flex justify-center mt-8 mb-4">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleContact}
        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
      >
        <Mail size={14} />
        {t('contact_us')}
      </Button>
    </div>
  );
};
