
import { Button } from "@/components/ui/button";
import { FileUp, FileDown } from "lucide-react";
import type { Intersection } from "@/types/optimization";

interface FileActionsProps {
  speed: number;
  intersections: Intersection[];
  onLoadInput: (data: { speed: number; intersections: Intersection[] }) => void;
}

export const FileActions = ({ speed, intersections, onLoadInput }: FileActionsProps) => {
  const handleExport = () => {
    const data = {
      speed,
      intersections
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
        ייבוא נתונים
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleExport}
        className="flex items-center gap-2"
      >
        <FileDown size={16} />
        ייצוא נתונים
      </Button>
    </div>
  );
};
