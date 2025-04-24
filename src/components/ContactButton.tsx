
import React from 'react';
import { Button } from "@/components/ui/button";
import { Mail, Copy } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from 'sonner';

const EMAIL = 'omrimatar@gmail.com';

export const ContactButton = () => {
  const { t } = useLanguage();
  
  const handleEmailClick = () => {
    window.location.href = `mailto:${EMAIL}`;
  };
  
  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      toast.success(`כתובת המייל ${EMAIL} הועתקה בהצלחה`);
    } catch (err) {
      toast.error('שגיאה בהעתקת כתובת המייל');
    }
  };
  
  return (
    <div className="w-full flex justify-center mt-8 mb-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1.5"
          >
            <Mail size={14} />
            {t('contact us')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2 flex flex-col gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleEmailClick}
            className="text-xs justify-start"
          >
            <Mail size={14} className="mr-2" />
            שליחת מייל
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCopyClick}
            className="text-xs justify-start"
          >
            <Copy size={14} className="mr-2" />
            העתקת כתובת
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};
