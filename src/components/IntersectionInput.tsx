
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { type Intersection } from "@/types/optimization";

interface IntersectionInputProps {
  intersection: Intersection;
  onChange: (updated: Intersection) => void;
  onDelete: () => void;
}

export const IntersectionInput = ({ intersection, onChange, onDelete }: IntersectionInputProps) => {
  const handleGreenPhaseChange = (phaseIndex: number, field: 'startTime' | 'duration', value: number) => {
    const updatedGreenPhases = [...intersection.greenPhases];
    updatedGreenPhases[phaseIndex] = {
      ...updatedGreenPhases[phaseIndex],
      [field]: value
    };
    onChange({
      ...intersection,
      greenPhases: updatedGreenPhases
    });
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">צומת {intersection.id}</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 size={16} />
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>מרחק (מטר)</Label>
          <Input
            type="number"
            value={intersection.distance}
            onChange={e => onChange({
              ...intersection,
              distance: Number(e.target.value)
            })}
          />
        </div>

        <div>
          <Label>זמן מחזור (שניות)</Label>
          <Input
            type="number"
            value={intersection.cycleTime}
            onChange={e => onChange({
              ...intersection,
              cycleTime: Number(e.target.value)
            })}
          />
        </div>

        {intersection.greenPhases.map((phase, index) => (
          <div key={index} className="space-y-2">
            <Label>פאזה ירוקה {phase.direction === 'upstream' ? 'במעלה הזרם' : 'במורד הזרם'}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm">זמן התחלה</Label>
                <Input
                  type="number"
                  value={phase.startTime}
                  onChange={e => handleGreenPhaseChange(index, 'startTime', Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-sm">משך</Label>
                <Input
                  type="number"
                  value={phase.duration}
                  onChange={e => handleGreenPhaseChange(index, 'duration', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
