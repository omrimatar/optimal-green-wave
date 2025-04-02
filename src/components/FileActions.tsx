
import { Button } from "@/components/ui/button";
import { FileUp, FileDown, Lock } from "lucide-react";
import type { Intersection } from "@/types/optimization";
import type { OptimizationWeights } from "@/types/optimization";
import { useState } from "react";
import { AdminLoginDialog } from "@/components/AdminLoginDialog";
import { useMaintenanceMode } from "@/contexts/MaintenanceContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface FileActionsProps {
  speed: number;
  intersections: Intersection[];
  weights?: OptimizationWeights;
  onLoadInput: (data: { 
    speed: number; 
    intersections: Intersection[];
    weights?: OptimizationWeights;
  }) => void;
}

export const FileActions = ({ speed, intersections, weights, onLoadInput }: FileActionsProps) => {
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const { isAdmin } = useMaintenanceMode();
  const { t } = useLanguage();

  const handleExport = () => {
    // Ensure alpha and beta parameters are included in the export
    const formattedWeights = weights ? {
      ...weights,
      alpha: weights.alpha ?? 0.5, // Ensure alpha has a value
      beta: weights.beta ?? 1.0     // Ensure beta has a value
    } : undefined;
    
    const data = {
      speed,
      intersections,
      weights: formattedWeights
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

  return (
    <div className="flex gap-4 flex-wrap">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleImport}
        className="flex items-center gap-2"
      >
        <FileUp size={16} />
        {t('import_data')}
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleExport}
        className="flex items-center gap-2"
      >
        <FileDown size={16} />
        {t('export_data')}
      </Button>
      <Button
        variant={isAdmin ? "secondary" : "outline"}
        size="sm"
        onClick={() => setShowAdminDialog(true)}
        className="flex items-center gap-2"
      >
        <Lock size={16} />
        {t('admin_login')}
      </Button>

      <AdminLoginDialog 
        open={showAdminDialog} 
        onOpenChange={setShowAdminDialog}
      />
    </div>
  );
};
