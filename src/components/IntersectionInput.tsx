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
  const [isEditingDistance, setIsEditingDistance] = useState(false);
  const [tempDistance, setTempDistance] = useState<string>(intersection.distance.toString());
  const [useHalfCycleTime, setUseHalfCycleTime] = useState(intersection.useHalfCycleTime || false);
  
  const [tempGreenPhaseValues, setTempGreenPhaseValues] = useState<{
    [key: number]: { startTime: string; duration: string }
  }>({});
  
  const [tempUpstreamSpeed, setTempUpstreamSpeed] = useState<string>(
    intersection.upstreamSpeed !== undefined ? intersection.upstreamSpeed.toString() : defaultSpeed.toString()
  );
  const [tempDownstreamSpeed, setTempDownstreamSpeed] = useState<string>(
    intersection.downstreamSpeed !== undefined ? intersection.downstreamSpeed.toString() : defaultSpeed.toString()
  );
  
  useEffect(() => {
    if (intersection.upstreamSpeed === undefined || intersection.upstreamSpeed === defaultSpeed) {
      setTempUpstreamSpeed(defaultSpeed.toString());
    }
    
    if (intersection.downstreamSpeed === undefined || intersection.downstreamSpeed === defaultSpeed) {
      setTempDownstreamSpeed(defaultSpeed.toString());
    }
  }, [defaultSpeed, intersection.upstreamSpeed, intersection.downstreamSpeed]);
  
  useEffect(() => {
    const initialPhaseValues: {[key: number]: { startTime: string; duration: string }} = {};
    intersection.greenPhases.forEach((phase, index) => {
      initialPhaseValues[index] = {
        startTime: phase.startTime.toString(),
        duration: phase.duration.toString()
      };
    });
    setTempGreenPhaseValues(initialPhaseValues);
  }, [intersection.greenPhases.length]);

  const [tempPhaseNumbers, setTempPhaseNumbers] = useState<{
    [key: number]: string
  }>({});

  useEffect(() => {
    const initialPhaseNumbers: {[key: number]: string} = {};
    intersection.greenPhases.forEach((phase, index) => {
      initialPhaseNumbers[index] = phase.phaseNumber?.toString() || '';
    });
    setTempPhaseNumbers(initialPhaseNumbers);
  }, [intersection.greenPhases.length]);

  const phasesOverlap = (phase1Start: number, phase1Duration: number, phase2Start: number, phase2Duration: number, cycleTime: number) => {
    const effectiveCycleTime = useHalfCycleTime ? cycleTime / 2 : cycleTime;
    
    const phase1End = (phase1Start + phase1Duration) % effectiveCycleTime;
    const phase2End = (phase2Start + phase2Duration) % effectiveCycleTime;
    
    if (phase1Start < phase1End && phase2Start < phase2End) {
      return (phase1Start < phase2End && phase2Start < phase1End);
    } else if (phase1Start >= phase1End && phase2Start < phase2End) {
      return (phase2Start < phase1End || phase2End > phase1Start);
    } else if (phase1Start < phase1End && phase2Start >= phase2End) {
      return (phase1Start < phase2End || phase1End > phase2Start);
    } else {
      return true;
    }
  };

  const wouldOverlapWithExistingPhases = (direction: 'upstream' | 'downstream', startTime: number, duration: number) => {
    const effectiveCycleTime = useHalfCycleTime ? intersection.cycleTime / 2 : intersection.cycleTime;
    
    const existingPhasesInSameDirection = intersection.greenPhases.filter(
      phase => phase.direction === direction
    );
    
    for (const existingPhase of existingPhasesInSameDirection) {
      if (phasesOverlap(startTime, duration, existingPhase.startTime, existingPhase.duration, effectiveCycleTime)) {
        return true;
      }
    }
    
    return false;
  };

  const handleGreenPhaseChange = (phaseIndex: number, field: 'startTime' | 'duration', value: string) => {
    setTempGreenPhaseValues(prev => ({
      ...prev,
      [phaseIndex]: {
        ...prev[phaseIndex],
        [field]: value
      }
    }));
  };
  
  const validateAndUpdateGreenPhase = (phaseIndex: number, field: 'startTime' | 'duration') => {
    const effectiveCycleTime = useHalfCycleTime ? intersection.cycleTime / 2 : intersection.cycleTime;
    
    const value = parseInt(tempGreenPhaseValues[phaseIndex][field]);
    
    if (isNaN(value)) {
      toast.error(`${field === 'startTime' ? t('start_time') : t('duration')} ${t('must_be_a_number')}`);
      
      setTempGreenPhaseValues(prev => ({
        ...prev,
        [phaseIndex]: {
          ...prev[phaseIndex],
          [field]: intersection.greenPhases[phaseIndex][field].toString()
        }
      }));
      
      return;
    }
    
    if (field === 'startTime') {
      if (value < 0 || !Number.isInteger(value)) {
        toast.error(`${t('start_time')} ${t('must_be_between')} 0 ${t('and')} ${effectiveCycleTime - 1}`);
        
        setTempGreenPhaseValues(prev => ({
          ...prev,
          [phaseIndex]: {
            ...prev[phaseIndex],
            startTime: intersection.greenPhases[phaseIndex].startTime.toString()
          }
        }));
        
        return;
      }

      if (value >= effectiveCycleTime) {
        toast.error(`${t('start_time')} ${t('must_be_less_than')} ${effectiveCycleTime}`);
        
        setTempGreenPhaseValues(prev => ({
          ...prev,
          [phaseIndex]: {
            ...prev[phaseIndex],
            startTime: intersection.greenPhases[phaseIndex].startTime.toString()
          }
        }));
        
        return;
      }
    } else if (field === 'duration') {
      if (value < 1 || value > effectiveCycleTime || !Number.isInteger(value)) {
        toast.error(`${t('duration')} ${t('must_be_between')} 1 ${t('and')} ${effectiveCycleTime}`);
        
        setTempGreenPhaseValues(prev => ({
          ...prev,
          [phaseIndex]: {
            ...prev[phaseIndex],
            duration: intersection.greenPhases[phaseIndex].duration.toString()
          }
        }));
        
        return;
      }
    }

    const updatedGreenPhases = [...intersection.greenPhases];
    const currentPhase = updatedGreenPhases[phaseIndex];
    
    const newStartTime = field === 'startTime' ? value : currentPhase.startTime;
    const newDuration = field === 'duration' ? value : currentPhase.duration;
    
    for (const otherPhase of updatedGreenPhases.filter(
      (phase, idx) => phase.direction === currentPhase.direction && idx !== phaseIndex
    )) {
      if (phasesOverlap(newStartTime, newDuration, otherPhase.startTime, otherPhase.duration, effectiveCycleTime)) {
        toast.error(`${t('phase_overlap_error')} ${currentPhase.direction === 'upstream' ? t('upstream_phase') : t('downstream_phase')}`);
        
        setTempGreenPhaseValues(prev => ({
          ...prev,
          [phaseIndex]: {
            startTime: currentPhase.startTime.toString(),
            duration: currentPhase.duration.toString()
          }
        }));
        
        return;
      }
    }
    
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
    const effectiveCycleTime = useHalfCycleTime ? intersection.cycleTime / 2 : intersection.cycleTime;
    
    const phasesInSameDirection = intersection.greenPhases.filter(phase => phase.direction === direction);
    
    let newStartTime = 0;
    let newDuration = Math.min(30, effectiveCycleTime);
    let attemptCount = 0;
    const maxAttempts = effectiveCycleTime;
    
    while (attemptCount < maxAttempts) {
      if (!wouldOverlapWithExistingPhases(direction, newStartTime, newDuration)) {
        break;
      }
      
      newStartTime = (newStartTime + 5) % effectiveCycleTime;
      attemptCount++;
      
      if (attemptCount === maxAttempts - 1 && newDuration > 5) {
        newDuration = 5;
        attemptCount = 0;
      }
    }
    
    if (attemptCount === maxAttempts) {
      toast.error(`${t('cannot_add_phase')} - ${t('no_non_overlapping_slot_available')}`);
      return;
    }
    
    onChange({
      ...intersection,
      greenPhases: [
        ...intersection.greenPhases,
        {
          direction,
          startTime: newStartTime,
          duration: newDuration
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
      toast.error(`${t('distance')} ${t('must_be_between')} 0 ${t('and')} 10000 ${t('meters')}`);
      setTempDistance(intersection.distance.toString());
      return;
    }
    
    const currentIndex = allIntersections.findIndex(i => i.id === intersection.id);
    
    if (currentIndex > 0) {
      const prevIntersection = allIntersections[currentIndex - 1];
      if (numValue < prevIntersection.distance) {
        toast.error(`${t('distance')} ${t('must_be_greater_than')} ${prevIntersection.distance}`);
        setTempDistance(intersection.distance.toString());
        return;
      }
    }
    
    if (currentIndex < allIntersections.length - 1) {
      const nextIntersection = allIntersections[currentIndex + 1];
      if (numValue > nextIntersection.distance) {
        toast.error(`${t('distance')} ${t('must_be_less_than')} ${nextIntersection.distance}`);
        setTempDistance(intersection.distance.toString());
        return;
      }
    }
    
    onChange({
      ...intersection,
      distance: numValue
    });
  };

  const validatePhasesForHalfCycle = (checked: boolean): boolean => {
    if (!checked) return true;
    
    const halfCycleTime = intersection.cycleTime / 2;
    
    for (const phase of intersection.greenPhases) {
      if (phase.startTime >= halfCycleTime) {
        toast.error(`${t('cannot_enable_half_cycle')} - ${t('phase_starts_after_half_cycle')}`);
        return false;
      }
    }
    
    return true;
  };

  const handleHalfCycleTimeChange = (checked: boolean) => {
    if (!validatePhasesForHalfCycle(checked)) {
      return;
    }
    
    setUseHalfCycleTime(checked);
    
    onChange({
      ...intersection,
      useHalfCycleTime: checked
    });
  };

  const handleSpeedChange = (direction: 'upstream' | 'downstream', value: string) => {
    if (direction === 'upstream') {
      setTempUpstreamSpeed(value);
    } else {
      setTempDownstreamSpeed(value);
    }
  };
  
  const validateAndUpdateSpeed = (direction: 'upstream' | 'downstream') => {
    const value = direction === 'upstream' ? tempUpstreamSpeed : tempDownstreamSpeed;
    const numValue = parseInt(value);
    
    if (isNaN(numValue) || numValue < 0 || numValue > 120 || !Number.isInteger(numValue)) {
      toast.error(`${direction === 'upstream' ? t('upstream_speed') : t('downstream_speed')} ${t('must_be_between')} 0 ${t('and')} 120 km/h`);
      
      if (direction === 'upstream') {
        setTempUpstreamSpeed(intersection.upstreamSpeed?.toString() || defaultSpeed.toString());
      } else {
        setTempDownstreamSpeed(intersection.downstreamSpeed?.toString() || defaultSpeed.toString());
      }
      
      return;
    }
    
    if (direction === 'upstream') {
      onChange({
        ...intersection,
        upstreamSpeed: numValue === defaultSpeed ? undefined : numValue
      });
    } else {
      onChange({
        ...intersection,
        downstreamSpeed: numValue === defaultSpeed ? undefined : numValue
      });
    }
  };

  const getPhaseNumber = (index: number, direction: 'upstream' | 'downstream'): number => {
    const phasesInSameDirection = intersection.greenPhases
      .filter(phase => phase.direction === direction);
    
    const currentPhase = intersection.greenPhases[index];
    const positionInDirection = phasesInSameDirection.findIndex(
      phase => phase.startTime === currentPhase.startTime && phase.duration === currentPhase.duration
    );
    
    return positionInDirection + 1;
  };

  const isSecondaryPhase = (index: number, direction: 'upstream' | 'downstream'): boolean => {
    return getPhaseNumber(index, direction) > 1;
  };

  const upstreamSpeed = intersection.upstreamSpeed !== undefined ? intersection.upstreamSpeed : defaultSpeed;
  const downstreamSpeed = intersection.downstreamSpeed !== undefined ? intersection.downstreamSpeed : defaultSpeed;

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

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>{t('upstream_speed')}</Label>
          <Input
            type="number"
            value={tempUpstreamSpeed}
            placeholder={defaultSpeed.toString()}
            onChange={e => handleSpeedChange('upstream', e.target.value)}
            onBlur={() => validateAndUpdateSpeed('upstream')}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                validateAndUpdateSpeed('upstream');
              }
            }}
          />
        </div>

        <div>
          <Label>{t('downstream_speed')}</Label>
          <Input
            type="number"
            value={tempDownstreamSpeed}
            placeholder={defaultSpeed.toString()}
            onChange={e => handleSpeedChange('downstream', e.target.value)}
            onBlur={() => validateAndUpdateSpeed('downstream')}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                validateAndUpdateSpeed('downstream');
              }
            }}
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
              <Label>
                {phase.direction === 'upstream' 
                  ? isSecondaryPhase(index, 'upstream') 
                    ? `${t('upstream_phase')} משני #${getPhaseNumber(index, 'upstream')}` 
                    : t('upstream_phase')
                  : isSecondaryPhase(index, 'downstream')
                    ? `${t('downstream_phase')} משני #${getPhaseNumber(index, 'downstream')}` 
                    : t('downstream_phase')
                }
              </Label>
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
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-sm">{t('start_time')}</Label>
                <Input
                  type="number"
                  value={tempGreenPhaseValues[index]?.startTime || phase.startTime}
                  min={0}
                  max={effectiveCycleTime - 1}
                  onChange={e => handleGreenPhaseChange(index, 'startTime', e.target.value)}
                  onBlur={() => validateAndUpdateGreenPhase(index, 'startTime')}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      validateAndUpdateGreenPhase(index, 'startTime');
                    }
                  }}
                />
              </div>
              <div>
                <Label className="text-sm">{t('duration')}</Label>
                <Input
                  type="number"
                  value={tempGreenPhaseValues[index]?.duration || phase.duration}
                  min={1}
                  max={effectiveCycleTime}
                  onChange={e => handleGreenPhaseChange(index, 'duration', e.target.value)}
                  onBlur={() => validateAndUpdateGreenPhase(index, 'duration')}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      validateAndUpdateGreenPhase(index, 'duration');
                    }
                  }}
                />
              </div>
              <div>
                <Label className="text-sm">{t('phase_number') || 'מספר מופע'}</Label>
                <Input
                  type="number"
                  value={tempPhaseNumbers[index] || ''}
                  placeholder={t('optional') || 'לא חובה'}
                  min={1}
                  max={100}
                  onChange={e => handlePhaseNumberChange(index, e.target.value)}
                  onBlur={() => validateAndUpdatePhaseNumber(index)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      validateAndUpdatePhaseNumber(index);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
