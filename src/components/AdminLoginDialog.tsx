
import React, { useState } from 'react';
import { useMaintenanceMode } from '@/contexts/MaintenanceContext';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, ToggleLeft, ToggleRight, BarChart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AdminLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminLoginDialog = ({ open, onOpenChange }: AdminLoginDialogProps) => {
  const [password, setPassword] = useState('');
  const { isAdmin, setIsAdmin, isMaintenanceMode, toggleMaintenanceMode } = useMaintenanceMode();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  
  // Correct password: "omri2205"
  const handleLogin = () => {
    if (password === "omri2205") {
      setIsAdmin(true);
      onOpenChange(false);
      toast.success(t('admin_login_success'));
    } else {
      toast.error(t('wrong_password'));
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    onOpenChange(false);
    toast.info(t('admin_logout_success'));
  };

  const handleToggleMaintenance = () => {
    toggleMaintenanceMode();
    toast.info(isMaintenanceMode ? t('maintenance_mode_disabled') : t('maintenance_mode_enabled'));
  };

  const navigateToAnalytics = () => {
    onOpenChange(false);
    navigate('/admin/analytics');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {isAdmin ? t('manage_maintenance_mode') : t('admin_login')}
          </DialogTitle>
          <DialogDescription>
            {isAdmin 
              ? t('admin_panel_description')
              : t('admin_login_description')}
          </DialogDescription>
        </DialogHeader>
        
        {!isAdmin ? (
          <>
            <div className="flex items-center space-x-2 p-4">
              <div className="grid flex-1 gap-2">
                <Input
                  type="password"
                  placeholder={t('admin_password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-end">
              <Button type="button" onClick={handleLogin}>
                {t('login')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-4">
              <Button 
                onClick={navigateToAnalytics}
                variant="default"
                className={`flex items-center gap-2 ${language === 'he' ? "mr-auto" : "ml-auto"}`}
              >
                <BarChart className="h-5 w-5" />
                {t('view_analytics')}
              </Button>
              
              <Button 
                onClick={handleToggleMaintenance}
                variant={isMaintenanceMode ? "destructive" : "outline"}
                className={`flex items-center gap-2 ${language === 'he' ? "mr-auto" : "ml-auto"}`}
              >
                {isMaintenanceMode ? (
                  <>
                    <ToggleRight className="h-5 w-5" />
                    {t('disable_maintenance')}
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5" />
                    {t('enable_maintenance')}
                  </>
                )}
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="outline"
                className={language === 'he' ? "mr-auto" : "ml-auto"}
              >
                {t('admin_logout')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
