
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { type Intersection } from "@/types/optimization";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  // Add local state to track if the distance input is being edited
  const [isEditingDistance, setIsEditingDistance] = useState(false);
  const [tempDistance, setTempDistance] = useState<string>(intersection.distance.toString());
  const [useHalfCycleTime, setUseHalfCycleTime] = useState(false);
  
  // Add effect to update speeds when defaultSpeed changes
  useEffect(() => {
    onChange({
      ...intersection,
      upstreamSpeed: defaultSpeed,
      downstreamSpeed: defaultSpeed
    });
  }, [defaultSpeed]);

  const handleGreenPhaseChange = (phaseIndex: number, field: 'startTime' | 'duration', value: number) => {
    // Check for valid start time and duration based on cycle time
    const cycleTime = intersection.cycleTime;
    
    if (field === 'startTime') {
      if (value < 0 || value > cycleTime || !Number.isInteger(value)) {
        toast.error(`${t('start_time')} must be an integer between 0 and ${cycleTime}`);
        return;
      }
    } else if (field === 'duration') {
      if (value < 1 || value > cycleTime || !Number.isInteger(value)) {
        toast.error(`${t('duration')} must be an integer between 1 and ${cycleTime}`);
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
      toast.error(`${t('distance')} must be an integer between 0 and 10000 meters`);
      setTempDistance(intersection.distance.toString());
      return;
    }
    
    // Find the current index of this intersection
    const currentIndex = allIntersections.findIndex(i => i.id === intersection.id);
    
    // Check if distance is valid compared to previous and next intersections
    if (currentIndex > 0) {
      const prevIntersection = allIntersections[currentIndex - 1];
      if (numValue < prevIntersection.distance) {
        toast.error(`${t('distance')} must be greater than or equal to the previous intersection (${prevIntersection.distance})`);
        setTempDistance(intersection.distance.toString());
        return;
      }
    }
    
    if (currentIndex < allIntersections.length - 1) {
      const nextIntersection = allIntersections[currentIndex + 1];
      if (numValue > nextIntersection.distance) {
        toast.error(`${t('distance')} must be less than or equal to the next intersection (${nextIntersection.distance})`);
        setTempDistance(intersection.distance.toString());
        return;
      }
    }
    
    onChange({
      ...intersection,
      distance: numValue
    });
  };

  const handleHalfCycleTimeChange = (checked: boolean) => {
    setUseHalfCycleTime(checked);
    // We don't directly update the actual cycleTime prop here
    // The actual value will be computed when needed (e.g., in calculation functions)
  };

  const handleSpeedChange = (direction: 'upstream' | 'downstream', value: string) => {
    const numValue = parseInt(value);
    
    if (isNaN(numValue) || numValue < 0 || numValue > 120 || !Number.isInteger(numValue)) {
      toast.error(`${direction === 'upstream' ? t('upstream_speed') : t('downstream_speed')} must be an integer between 0 and 120 km/h`);
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

  // Get effective cycle time
  const effectiveCycleTime = useHalfCycleTime ? intersection.cycleTime / 2 : intersection.cycleTime;

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">{t('intersection')} {intersection.id}</h3>
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
          <Label>{t('distance')}</Label>
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
          <Label>{t('cycle_time')}</Label>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Checkbox 
                id={`halfCycleTime-${intersection.id}`} 
                checked={useHalfCycleTime}
                onCheckedChange={handleHalfCycleTimeChange}
              />
              <Label 
                htmlFor={`halfCycleTime-${intersection.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {t('half_cycle_time')}
              </Label>
            </div>
            <div className="text-xs text-muted-foreground">
              {t('effective_cycle_time')}: {effectiveCycleTime} {t('seconds')}
            </div>
          </div>
        </div>
      </div>

      {/* Speed inputs */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>{t('upstream_speed')}</Label>
          <Input
            type="number"
            value={upstreamSpeed}
            placeholder={defaultSpeed.toString()}
            onChange={e => handleSpeedChange('upstream', e.target.value)}
          />
        </div>

        <div>
          <Label>{t('downstream_speed')}</Label>
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
          <h4 className="font-medium">{t('green_phases')}</h4>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPhase('upstream')}
              className="flex items-center gap-1"
            >
              <ArrowUp size={14} />
              {t('add_upstream_phase')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddPhase('downstream')}
              className="flex items-center gap-1"
            >
              <ArrowDown size={14} />
              {t('add_downstream_phase')}
            </Button>
          </div>
        </div>

        {intersection.greenPhases.map((phase, index) => (
          <div key={index} className="space-y-2 border rounded p-3">
            <div className="flex justify-between items-center">
              <Label>{phase.direction === 'upstream' ? t('upstream_phase') : t('downstream_phase')}</Label>
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
                <Label className="text-sm">{t('start_time')}</Label>
                <Input
                  type="number"
                  value={phase.startTime}
                  min={0}
                  max={intersection.cycleTime}
                  onChange={e => handleGreenPhaseChange(index, 'startTime', Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-sm">{t('duration')}</Label>
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
