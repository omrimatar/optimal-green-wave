
import { Button } from "@/components/ui/button";
import { FileUp, FileDown, Settings } from "lucide-react";
import type { Intersection } from "@/types/optimization";
import type { OptimizationWeights } from "@/types/optimization";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface FileActionsProps {
  speed: number;
  intersections: Intersection[];
  weights?: OptimizationWeights;
  useHalfCycleTime?: boolean;
  onLoadInput: (data: { 
    speed: number; 
    intersections: Intersection[];
    weights?: OptimizationWeights;
    useHalfCycleTime?: boolean;
  }) => void;
  onMaintenanceToggle?: (value: boolean) => void;
}

export const FileActions = ({ 
  speed, 
  intersections, 
  weights, 
  useHalfCycleTime,
  onLoadInput,
  onMaintenanceToggle
}: FileActionsProps) => {
  const { t, language } = useLanguage();
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(() => {
    const stored = localStorage.getItem('maintenanceMode');
    return stored === 'true';
  });

  const handleExport = () => {
    const data = {
      speed,
      intersections,
      weights,
      useHalfCycleTime
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'green-wave-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            onLoadInput(data);
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };
  
  const handleMaintenanceToggle = (value: boolean) => {
    setMaintenanceEnabled(value);
    if (onMaintenanceToggle) {
      onMaintenanceToggle(value);
      if (value) {
        toast.success(language === 'he' ? 'מצב תחזוקה הופעל' : 'Maintenance mode enabled');
      } else {
        toast.success(language === 'he' ? 'מצב תחזוקה בוטל' : 'Maintenance mode disabled');
      }
    }
    setShowAdminDialog(false);
  };

  return (
    <div className="flex justify-between flex-wrap">
      <div className="flex gap-4 flex-wrap">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleImport}
          className="flex items-center gap-2"
        >
          <FileUp size={16} />
          {language === 'he' ? 'ייבוא נתונים' : 'Import Data'}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExport}
          className="flex items-center gap-2"
        >
          <FileDown size={16} />
          {language === 'he' ? 'ייצוא נתונים' : 'Export Data'}
        </Button>
      </div>
      
      {onMaintenanceToggle && (
        <Dialog open={showAdminDialog} onOpenChange={setShowAdminDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Settings size={16} />
              {language === 'he' ? 'ניהול מערכת' : 'Admin'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md" dir={language === 'he' ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>
                {language === 'he' ? 'הגדרות מנהל' : 'Admin Settings'}
              </DialogTitle>
              <DialogDescription>
                {language === 'he' 
                  ? 'הגדר את מצב המערכת' 
                  : 'Configure system settings'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="maintenance-mode" className="font-medium">
                  {language === 'he' ? 'מצב תחזוקה' : 'Maintenance Mode'}
                </Label>
                <Switch 
                  id="maintenance-mode" 
                  checked={maintenanceEnabled}
                  onCheckedChange={handleMaintenanceToggle}
                />
              </div>
              
              <p className="text-sm text-muted-foreground">
                {language === 'he'
                  ? 'כאשר מצב תחזוקה מופעל, המערכת לא תהיה זמינה למשתמשים ותציג הודעת תחזוקה.'
                  : 'When maintenance mode is enabled, the system will be unavailable to users and display a maintenance message.'}
              </p>
            </div>
            
            <DialogFooter className={language === 'he' ? '' : 'flex-row-reverse'}>
              <Button variant="outline" onClick={() => setShowAdminDialog(false)}>
                {language === 'he' ? 'סגור' : 'Close'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
