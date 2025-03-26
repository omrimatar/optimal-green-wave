
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
import { Lock, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface AdminLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminLoginDialog = ({ open, onOpenChange }: AdminLoginDialogProps) => {
  const [password, setPassword] = useState('');
  const { isAdmin, setIsAdmin, isMaintenanceMode, toggleMaintenanceMode } = useMaintenanceMode();
  const { language } = useLanguage();
  
  // Correct password: "omri2205"
  const handleLogin = () => {
    if (password === "omri2205") {
      setIsAdmin(true);
      onOpenChange(false);
      toast.success("נכנסת כמנהל מערכת");
    } else {
      toast.error("סיסמה שגויה");
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    onOpenChange(false);
    toast.info("התנתקת ממצב מנהל");
  };

  const handleToggleMaintenance = () => {
    toggleMaintenanceMode();
    if (isMaintenanceMode) {
      toast.info("מצב תחזוקה בוטל - המערכת נגישה לכל המשתמשים");
    } else {
      toast.info("מצב תחזוקה הופעל - המערכת חסומה לכל המשתמשים בכל המכשירים");
    }
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
              ? "אתה מחובר כמנהל מערכת. האם תרצה להפעיל או לבטל מצב תחזוקה עבור כל המשתמשים?"
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
                onClick={handleToggleMaintenance}
                variant={isMaintenanceMode ? "destructive" : "outline"}
                className={`flex items-center gap-2 ${language === 'he' ? "mr-auto" : "ml-auto"}`}
              >
                {isMaintenanceMode ? (
                  <>
                    <ToggleRight className="h-5 w-5" />
                    בטל מצב תחזוקה
                  </>
                ) : (
                  <>
                    <ToggleLeft className="h-5 w-5" />
                    הפעל מצב תחזוקה גלובלי
                  </>
                )}
              </Button>
              <div className="text-sm text-gray-500 bg-gray-100 p-3 rounded-md">
                {isMaintenanceMode 
                  ? "כאשר מצב תחזוקה מופעל, כל המשתמשים בכל המכשירים יראו את דף התחזוקה עד שתבטל אותו." 
                  : "הפעלת מצב תחזוקה תחסום גישה למערכת עבור כל המשתמשים בכל המכשירים והדפדפנים."}
              </div>
              <Button 
                onClick={handleLogout} 
                variant="outline"
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
