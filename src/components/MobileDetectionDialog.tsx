
import React from 'react';
import { X, Smartphone, Tablet, Monitor } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useIsMobile } from '@/hooks/use-mobile';

export const MobileDetectionDialog = () => {
  const [open, setOpen] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const isMobile = useIsMobile();
  const { t } = useLanguage();

  React.useEffect(() => {
    // Check if we've already dismissed this session
    const hasBeenDismissed = localStorage.getItem('mobile-warning-dismissed');
    
    if (isMobile && !hasBeenDismissed && !dismissed) {
      setOpen(true);
    }
  }, [isMobile, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setOpen(false);
    // Remember dismissal for this session only
    localStorage.setItem('mobile-warning-dismissed', 'true');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-purple-400">
            {t('best_experience_title')}
          </DialogTitle>
          <X
            className="absolute right-4 top-4 h-6 w-6 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
            onClick={handleDismiss}
          />
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center space-y-6 py-4">
          <img 
            src="/lovable-uploads/efa3c3e2-c92f-42c7-8cc6-a4096430a863.png" 
            alt="Green Wave Logo" 
            className="h-16 w-auto"
          />
          
          <DialogDescription className="text-center text-base">
            {t('mobile_warning_message')}
          </DialogDescription>
          
          <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-4">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-red-900/50 p-4">
                <Smartphone className="h-8 w-8 text-red-400" />
              </div>
              <span className="text-sm text-gray-300">{t('not_supported')}</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-green-900/50 p-4">
                <Tablet className="h-8 w-8 text-green-400" />
              </div>
              <span className="text-sm text-gray-300">{t('tablet')}</span>
            </div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-green-900/50 p-4">
                <Monitor className="h-8 w-8 text-green-400" />
              </div>
              <span className="text-sm text-gray-300">{t('desktop')}</span>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <p className="text-center mb-2 text-sm text-gray-400">{t('explore_anyway')}</p>
          <Button 
            variant="outline" 
            onClick={handleDismiss}
            className="w-full max-w-xs mx-auto bg-purple-100 hover:bg-purple-200 text-purple-600"
          >
            {t('continue_anyway')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
