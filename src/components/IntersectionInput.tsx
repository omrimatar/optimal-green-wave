
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { type Intersection } from "@/types/optimization";
import { toast } from "sonner";
import { useState } from "react";

interface IntersectionInputProps {
  intersection: Intersection;
  onChange: (updated: Intersection) => void;
  onDelete: () => void;
  allIntersections: Intersection[]; // Added prop to access all intersections for validation
  defaultSpeed: number; // Default speed from design speed
}

export const IntersectionInput = ({ 
  intersection, 
  onChange, 
  onDelete, 
  allIntersections, 
  defaultSpeed 
}: IntersectionInputProps) => {
  // Add local state to track if the distance input is being edited
  const [isEditingDistance, setIsEditingDistance] = useState(false);
  const [tempDistance, setTempDistance] = useState<string>(intersection.distance.toString());

  const handleGreenPhaseChange = (phaseIndex: number, field: 'startTime' | 'duration', value: number) => {
    // Check for valid start time and duration based on cycle time
    const cycleTime = intersection.cycleTime;
    
    if (field === 'startTime') {
      if (value < 0 || value > cycleTime || !Number.isInteger(value)) {
        toast.error(`זמן התחלה חייב להיות מספר שלם בין 0 ל-${cycleTime}`);
        return;
      }
    } else if (field === 'duration') {
      if (value < 1 || value > cycleTime || !Number.isInteger(value)) {
        toast.error(`משך חייב להיות מספר שלם בין 1 ל-${cycleTime}`);
        return;
      }
    }

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

  const handleAddPhase = (direction: 'upstream' | 'downstream') => {
    const lastPhase = intersection.greenPhases[intersection.greenPhases.length - 1];
    const newStartTime = (lastPhase?.startTime || 0) + (lastPhase?.duration || 0);
    
    onChange({
      ...intersection,
      greenPhases: [
        ...intersection.greenPhases,
        {
          direction,
          startTime: newStartTime,
          duration: Math.min(45, intersection.cycleTime)
        }
      ]
    });
  };

  const handleDeletePhase = (phaseIndex: number) => {
    if (intersection.greenPhases.length > 1) {
      onChange({
        ...intersection,
        greenPhases: intersection.greenPhases.filter((_, index) => index !== phaseIndex)
      });
    }
  };

  const handleDistanceChange = (value: string) => {
    setTempDistance(value);
    setIsEditingDistance(true);
  };

  const validateAndUpdateDistance = () => {
    setIsEditingDistance(false);
    
    const numValue = parseInt(tempDistance);
    if (isNaN(numValue) || numValue < 0 || numValue > 10000 || !Number.isInteger(numValue)) {
      toast.error("מרחק חייב להיות מספר שלם בין 0 ל-10000 מטר");
      setTempDistance(intersection.distance.toString());
      return;
    }
    
    // Find the current index of this intersection
    const currentIndex = allIntersections.findIndex(i => i.id === intersection.id);
    
    // Check if distance is valid compared to previous and next intersections
    if (currentIndex > 0) {
      const prevIntersection = allIntersections[currentIndex - 1];
      if (numValue < prevIntersection.distance) {
        toast.error(`מרחק חייב להיות גדול או שווה למרחק הצומת הקודם (${prevIntersection.distance})`);
        setTempDistance(intersection.distance.toString());
        return;
      }
    }
    
    if (currentIndex < allIntersections.length - 1) {
      const nextIntersection = allIntersections[currentIndex + 1];
      if (numValue > nextIntersection.distance) {
        toast.error(`מרחק חייב להיות קטן או שווה למרחק הצומת הבא (${nextIntersection.distance})`);
        setTempDistance(intersection.distance.toString());
        return;
      }
    }
    
    onChange({
      ...intersection,
      distance: numValue
    });
  };

  const handleCycleTimeChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 300 || !Number.isInteger(numValue)) {
      toast.error("זמן מחזור חייב להיות מספר שלם בין 0 ל-300 שניות");
      return;
    }
    
    onChange({
      ...intersection,
      cycleTime: numValue
    });
  };

  const handleSpeedChange = (direction: 'upstream' | 'downstream', value: string) => {
    const numValue = parseInt(value);
    
    if (isNaN(numValue) || numValue < 0 || numValue > 120 || !Number.isInteger(numValue)) {
      toast.error("מהירות חייבת להיות מספר שלם בין 0 ל-120 קמ\"ש");
      return;
    }
    
    if (direction === 'upstream') {
      onChange({
        ...intersection,
        upstreamSpeed: numValue
      });
    } else {
      onChange({
        ...intersection,
        downstreamSpeed: numValue
      });
    }
  };

  // Get the effective speeds (either specific speeds or default)
  const upstreamSpeed = intersection.upstreamSpeed !== undefined ? intersection.upstreamSpeed : defaultSpeed;
  const downstreamSpeed = intersection.downstreamSpeed !== undefined ? intersection.downstreamSpeed : defaultSpeed;

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
            value={isEditingDistance ? tempDistance : intersection.distance}
            onChange={e => handleDistanceChange(e.target.value)}
            onBlur={validateAndUpdateDistance}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                validateAndUpdateDistance();
              }
            }}
          />
        </div>

        <div>
          <Label>זמן מחזור (שניות)</Label>
          <Input
            type="number"
            value={intersection.cycleTime}
            onChange={e => handleCycleTimeChange(e.target.value)}
          />
        </div>
      </div>

      {/* Speed inputs */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>מהירות במעלה הזרם (קמ"ש)</Label>
          <Input
            type="number"
            value={upstreamSpeed}
            placeholder={defaultSpeed.toString()}
            onChange={e => handleSpeedChange('upstream', e.target.value)}
          />
        </div>

        <div>
          <Label>מהירות במורד הזרם (קמ"ש)</Label>
          <Input
            type="number"
            value={downstreamSpeed}
            placeholder={defaultSpeed.toString()}
            onChange={e => handleSpeedChange('downstream', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">פאזות ירוקות</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPhase('upstream')}
              className="flex items-center gap-1"
            >
              <ArrowUp size={14} />
              הוסף מופע במעלה
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPhase('downstream')}
              className="flex items-center gap-1"
            >
              <ArrowDown size={14} />
              הוסף מופע במורד
            </Button>
          </div>
        </div>

        {intersection.greenPhases.map((phase, index) => (
          <div key={index} className="space-y-2 border rounded p-3">
            <div className="flex justify-between items-center">
              <Label>פאזה ירוקה {phase.direction === 'upstream' ? 'במעלה הזרם' : 'במורד הזרם'}</Label>
              {intersection.greenPhases.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeletePhase(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm">זמן התחלה</Label>
                <Input
                  type="number"
                  value={phase.startTime}
                  min={0}
                  max={intersection.cycleTime}
                  onChange={e => handleGreenPhaseChange(index, 'startTime', Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-sm">משך</Label>
                <Input
                  type="number"
                  value={phase.duration}
                  min={1}
                  max={intersection.cycleTime}
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
