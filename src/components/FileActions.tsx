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
export const FileActions = ({
  speed,
  intersections,
  weights,
  onLoadInput
}: FileActionsProps) => {
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const {
    isAdmin
  } = useMaintenanceMode();
  const {
    t
  } = useLanguage();
  const handleExport = () => {
    // Ensure alpha and beta parameters are included in the export
    const formattedWeights = weights ? {
      ...weights,
      alpha: weights.alpha ?? 0.5,
      // Ensure alpha has a value
      beta: 1.0 // Always ensure beta is 1.0 (inactive feature)
    } : undefined;

    // Create a proper copy of intersections that includes all properties including name
    const formattedIntersections = intersections.map(intersection => ({
      ...intersection,
      name: intersection.name || ''
    }));
    const data = {
      speed,
      intersections: formattedIntersections,
      weights: formattedWeights
    };
    console.log("Exporting data:", data); // Add logging to debug export

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
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
    input.onchange = event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const jsonData = e.target?.result as string;
            const data = JSON.parse(jsonData);
            console.log("Imported data:", data); // Add logging to debug import

            // Ensure all intersection properties are properly mapped
            if (data.intersections) {
              data.intersections = data.intersections.map((intersection: any) => ({
                id: intersection.id,
                distance: intersection.distance,
                cycleTime: intersection.cycleTime,
                greenPhases: intersection.greenPhases || [],
                useHalfCycleTime: intersection.useHalfCycleTime || false,
                upstreamSpeed: intersection.upstreamSpeed,
                downstreamSpeed: intersection.downstreamSpeed,
                offset: intersection.offset || 0,
                name: intersection.name || '' // Ensure name is always included
              }));
            }

            // Force beta to be 1.0 on import as it's an inactive feature
            if (data.weights) {
              data.weights.beta = 1.0;
            }
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
  return <div className="flex gap-4 flex-wrap">
      <Button variant="outline" size="sm" onClick={handleImport} className="flex items-center gap-2">
        <FileUp size={16} />
        {t('import_data')}
      </Button>
      <Button variant="outline" size="sm" onClick={handleExport} className="flex items-center gap-2">
        <FileDown size={16} />
        {t('export_data')}
      </Button>
      <Button variant={isAdmin ? "secondary" : "outline"} size="sm" onClick={() => setShowAdminDialog(true)} className="flex items-center gap-2 text-base bg-gray-400 hover:bg-gray-300">
        <Lock size={16} />
        {t('admin_login')}
      </Button>

      <AdminLoginDialog open={showAdminDialog} onOpenChange={setShowAdminDialog} />
    </div>;
};