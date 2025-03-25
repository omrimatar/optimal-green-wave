
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
import { Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface AdminLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminLoginDialog = ({ open, onOpenChange }: AdminLoginDialogProps) => {
  const [password, setPassword] = useState('');
  const { isAdmin, setIsAdmin, toggleMaintenanceMode } = useMaintenanceMode();
  const { language } = useLanguage();
  
  // This is a simple hash function - not secure for production
  // but better than plaintext in the code
  const hashPassword = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  };

  // Admin password: "admin123" (hashed value: -1322487871)
  const handleLogin = () => {
    if (hashPassword(password) === -1322487871) {
      setIsAdmin(true);
      toggleMaintenanceMode();
      onOpenChange(false);
      toast.success("נכנסת כמנהל מערכת");
    } else {
      toast.error("סיסמה שגויה");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    if (isAdmin) {
      toggleMaintenanceMode(); // Exit maintenance mode on logout
    }
    onOpenChange(false);
    toast.info("התנתקת ממצב מנהל");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={language === 'he' ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            {isAdmin ? "ניהול מצב תחזוקה" : "כניסת מנהל מערכת"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin 
              ? "אתה מחובר כמנהל מערכת. האם תרצה להפעיל או לבטל מצב תחזוקה?"
              : "הזן סיסמת מנהל מערכת כדי להפעיל מצב תחזוקה"}
          </DialogDescription>
        </DialogHeader>
        
        {!isAdmin ? (
          <>
            <div className="flex items-center space-x-2 p-4">
              <div className="grid flex-1 gap-2">
                <Input
                  type="password"
                  placeholder="סיסמת מנהל מערכת"
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
                כניסה
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex flex-col gap-4">
              <Button 
                onClick={toggleMaintenanceMode}
                variant="outline"
                className={language === 'he' ? "mr-auto" : "ml-auto"}
              >
                {isAdmin ? "הפעל/בטל מצב תחזוקה" : "הפעל מצב תחזוקה"}
              </Button>
              <Button 
                onClick={handleLogout} 
                variant="destructive"
                className={language === 'he' ? "mr-auto" : "ml-auto"}
              >
                התנתק ממצב מנהל
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
