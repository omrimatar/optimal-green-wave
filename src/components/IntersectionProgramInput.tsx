
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { GreenPhase, Intersection } from '@/types/optimization';

interface IntersectionProgramInputProps {
  intersection: Intersection;
  programId: number;
  onChange: (updatedIntersection: Intersection) => void;
}

export const IntersectionProgramInput: React.FC<IntersectionProgramInputProps> = ({
  intersection,
  programId,
  onChange
}) => {
  const { t } = useLanguage();
  const [useHalfCycleTime, setUseHalfCycleTime] = useState(intersection.useHalfCycleTime || false);

  const handlePhaseChange = (phaseIndex: number, field: keyof GreenPhase, value: number) => {
    const updatedPhases = [...intersection.greenPhases];
    
    if (updatedPhases[phaseIndex]) {
      updatedPhases[phaseIndex] = {
        ...updatedPhases[phaseIndex],
        [field]: value
      };
      
      const updatedIntersection = {
        ...intersection,
        greenPhases: updatedPhases,
        useHalfCycleTime
      };
      
      onChange(updatedIntersection);
    }
  };

  const addPhase = (direction: 'upstream' | 'downstream') => {
    const newPhase: GreenPhase = {
      direction,
      startTime: 0,
      duration: Math.max(15, Math.floor(intersection.cycleTime / 4))
    };
    
    const existingPhases = intersection.greenPhases.filter(
      phase => phase.direction === direction
    );
    
    // If there are existing phases of this direction, set a default start time
    // after the last phase of the same direction
    if (existingPhases.length > 0) {
      const lastPhase = existingPhases[existingPhases.length - 1];
      newPhase.startTime = (lastPhase.startTime + lastPhase.duration) % intersection.cycleTime;
    }
    
    const updatedIntersection = {
      ...intersection,
      greenPhases: [...intersection.greenPhases, newPhase],
      useHalfCycleTime
    };
    
    onChange(updatedIntersection);
  };

  const removePhase = (phaseIndex: number) => {
    const updatedPhases = intersection.greenPhases.filter((_, index) => index !== phaseIndex);
    
    const updatedIntersection = {
      ...intersection,
      greenPhases: updatedPhases,
      useHalfCycleTime
    };
    
    onChange(updatedIntersection);
  };

  const toggleHalfCycleTime = (checked: boolean) => {
    setUseHalfCycleTime(checked);
    
    const updatedIntersection = {
      ...intersection,
      useHalfCycleTime: checked
    };
    
    onChange(updatedIntersection);
  };

  const upstreamPhases = intersection.greenPhases.filter(phase => phase.direction === 'upstream');
  const downstreamPhases = intersection.greenPhases.filter(phase => phase.direction === 'downstream');

  return (
    <Card className="p-4 border-2 border-blue-100">
      <div className="space-y-4">
        <div className="text-center font-medium">
          {intersection.id}. {t('intersection')} {intersection.id} ({t('distance')}: {intersection.distance}m)
        </div>
        
        <div className="flex items-center space-x-2 justify-end">
          <Label htmlFor={`half-cycle-${intersection.id}-${programId}`}>
            {t('use_half_cycle_time')}
          </Label>
          <Switch 
            id={`half-cycle-${intersection.id}-${programId}`} 
            checked={useHalfCycleTime}
            onCheckedChange={toggleHalfCycleTime}
          />
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t('upstream_phases')}</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addPhase('upstream')}
              className="flex items-center gap-1"
            >
              <Plus size={14} />
              <span>{t('add')}</span>
            </Button>
          </div>
          
          {upstreamPhases.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-2">
              {t('no_upstream_phases')}
            </div>
          )}
          
          {upstreamPhases.map((phase, phaseIndex) => {
            const realIndex = intersection.greenPhases.findIndex(p => p === phase);
            return (
              <div key={`upstream-${phaseIndex}`} className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor={`upstream-start-${intersection.id}-${programId}-${phaseIndex}`}>
                    {t('start_time')}
                  </Label>
                  <Input 
                    id={`upstream-start-${intersection.id}-${programId}-${phaseIndex}`}
                    type="number"
                    value={phase.startTime} 
                    onChange={(e) => handlePhaseChange(realIndex, 'startTime', parseInt(e.target.value))}
                    min={0}
                    max={intersection.cycleTime}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`upstream-duration-${intersection.id}-${programId}-${phaseIndex}`}>
                    {t('duration')}
                  </Label>
                  <Input 
                    id={`upstream-duration-${intersection.id}-${programId}-${phaseIndex}`}
                    type="number"
                    value={phase.duration} 
                    onChange={(e) => handlePhaseChange(realIndex, 'duration', parseInt(e.target.value))}
                    min={1}
                    max={intersection.cycleTime}
                  />
                </div>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="mt-5" 
                  onClick={() => removePhase(realIndex)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            );
          })}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>{t('downstream_phases')}</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => addPhase('downstream')}
              className="flex items-center gap-1"
            >
              <Plus size={14} />
              <span>{t('add')}</span>
            </Button>
          </div>
          
          {downstreamPhases.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-2">
              {t('no_downstream_phases')}
            </div>
          )}
          
          {downstreamPhases.map((phase, phaseIndex) => {
            const realIndex = intersection.greenPhases.findIndex(p => p === phase);
            return (
              <div key={`downstream-${phaseIndex}`} className="flex items-center gap-2">
                <div className="flex-1">
                  <Label htmlFor={`downstream-start-${intersection.id}-${programId}-${phaseIndex}`}>
                    {t('start_time')}
                  </Label>
                  <Input 
                    id={`downstream-start-${intersection.id}-${programId}-${phaseIndex}`}
                    type="number"
                    value={phase.startTime} 
                    onChange={(e) => handlePhaseChange(realIndex, 'startTime', parseInt(e.target.value))}
                    min={0}
                    max={intersection.cycleTime}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`downstream-duration-${intersection.id}-${programId}-${phaseIndex}`}>
                    {t('duration')}
                  </Label>
                  <Input 
                    id={`downstream-duration-${intersection.id}-${programId}-${phaseIndex}`}
                    type="number"
                    value={phase.duration} 
                    onChange={(e) => handlePhaseChange(realIndex, 'duration', parseInt(e.target.value))}
                    min={1}
                    max={intersection.cycleTime}
                  />
                </div>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="mt-5" 
                  onClick={() => removePhase(realIndex)}
                >
                  <Trash size={14} />
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
