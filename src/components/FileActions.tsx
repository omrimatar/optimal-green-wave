
import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { type Intersection, type OptimizationWeights } from '@/types/optimization';
import { useModifiedFlags } from '@/contexts/ModifiedFlagsContext';

export const FileActions = ({ 
  speed,
  intersections,
  weights,
  onLoadInput 
}: {
  speed: number;
  intersections: Intersection[];
  weights: OptimizationWeights;
  onLoadInput: (data: { speed: number; intersections: Intersection[]; weights?: OptimizationWeights; }) => void;
}) => {
  const { t } = useLanguage();
  const downloadRef = useRef<HTMLAnchorElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { modifiedFlags } = useModifiedFlags();

  const handleSaveToFile = () => {
    try {
      const data = {
        speed,
        intersections: intersections.map(intersection => ({
          id: intersection.id,
          distance: intersection.distance,
          cycleTime: intersection.cycleTime,
          greenPhases: intersection.greenPhases,
          upstreamSpeed: intersection.upstreamSpeed,
          downstreamSpeed: intersection.downstreamSpeed,
          useHalfCycleTime: intersection.useHalfCycleTime,
          name: intersection.name
        })),
        weights: modifiedFlags.some(Boolean) ? weights : undefined
      };
      
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      
      if (downloadRef.current) {
        downloadRef.current.href = href;
        downloadRef.current.download = 'traffic_data.json';
        downloadRef.current.click();
        URL.revokeObjectURL(href);
      } else {
        console.error("Download link ref is not available.");
        toast.error(t('error_saving_file'));
      }
    } catch (error) {
      console.error("Error saving to file:", error);
      toast.error(t('error_saving_file'));
    }
  };

  const handleLoadFromFile = () => {
    if (fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0) {
      const file = fileInputRef.current.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          if (typeof content === 'string') {
            const data = JSON.parse(content);
            onLoadInput(data);
          } else {
            toast.error(t('error_reading_file'));
          }
        } catch (error) {
          console.error("Error parsing or loading file:", error);
          toast.error(t('error_loading_file'));
        }
      };
      
      reader.readAsText(file);
    } else {
      toast.error(t('no_file_selected'));
    }
  };

  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-wrap gap-2 md:gap-4">
      <Button variant="outline" onClick={handleSaveToFile} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-xs md:text-sm">
        <Download className="w-3 h-3 md:w-4 md:h-4" />
        {t('save_to_file')}
      </Button>
      <Button variant="outline" onClick={handleClickUpload} className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white text-xs md:text-sm">
        <Upload className="w-3 h-3 md:w-4 md:h-4" />
        {t('load_from_file')}
      </Button>
      <input
        type="file"
        style={{ display: 'none' }}
        accept=".json"
        ref={fileInputRef}
        onChange={handleLoadFromFile}
      />
      <a href="#" style={{ display: 'none' }} ref={downloadRef}>
        {t('download')}
      </a>
    </div>
  );
};
