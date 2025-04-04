import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, HelpCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from '@/contexts/LanguageContext';
import { Intersection } from '@/types/optimization';

export const IntersectionInput = ({ 
  intersection, 
  defaultSpeed,
  allIntersections,
  onChange, 
  onDelete 
}: { 
  intersection: Intersection; 
  defaultSpeed: number;
  allIntersections: Intersection[];
  onChange: (intersection: Intersection) => void; 
  onDelete: () => void;
}) => {
  const { t, language } = useLanguage();
  const [expandedUi, setExpandedUi] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUseHalfCycleTooltip, setShowUseHalfCycleTooltip] = useState(false);

  const handleDistanceChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 10000 || !Number.isInteger(numValue)) {
      return;
    }
    onChange({
      ...intersection,
      distance: numValue
    });
  };

  const handleCycleTimeChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 300 || !Number.isInteger(numValue)) {
      return;
    }
    onChange({
      ...intersection,
      cycleTime: numValue
    });
  };

  const handleUpstreamSpeedChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 120 || !Number.isInteger(numValue)) {
      return;
    }
    onChange({
      ...intersection,
      upstreamSpeed: numValue
    });
  };

  const handleDownstreamSpeedChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 120 || !Number.isInteger(numValue)) {
      return;
    }
    onChange({
      ...intersection,
      downstreamSpeed: numValue
    });
  };

  const handleUseHalfCycleTimeChange = (value: boolean) => {
    onChange({
      ...intersection,
      useHalfCycleTime: value
    });
  };

  const handleXChange = (direction: 'upstream' | 'downstream', index: number, field: 'startTime' | 'duration', value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > intersection.cycleTime || !Number.isInteger(numValue)) {
      return;
    }
  
    const newPhases = [...intersection.greenPhases];
    const phaseToUpdate = newPhases.find(phase => phase.direction === direction && newPhases.indexOf(phase) === index);
  
    if (phaseToUpdate) {
      phaseToUpdate[field] = numValue;
      onChange({
        ...intersection,
        greenPhases: newPhases
      });
    }
  };

  const handleNameChange = (value: string) => {
    onChange({
      ...intersection,
      name: value
    });
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          {t('intersection')} {allIntersections.findIndex(i => i.id === intersection.id) + 1}
        </CardTitle>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button 
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  onMouseEnter={() => setShowUseHalfCycleTooltip(true)}
                  onMouseLeave={() => setShowUseHalfCycleTooltip(false)}
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                <p>מחצית זמן מחזור</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="hover:bg-red-500 hover:text-white">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={language === 'he' ? 'rtl' : 'ltr'}>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('delete_intersection')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('are_you_sure_delete_intersection')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete()}>{t('delete')}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-1 md:col-span-2">
            <Label htmlFor={`name-${intersection.id}`}>{t('intersection_name') || 'Intersection Name'}</Label>
            <Input
              id={`name-${intersection.id}`}
              type="text"
              value={intersection.name || ''}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t('enter_intersection_name') || 'Enter intersection name'}
              dir="auto"
            />
          </div>
          <div>
            <Label htmlFor={`distance-${intersection.id}`}>{t('distance')}</Label>
            <Input
              id={`distance-${intersection.id}`}
              type="number"
              value={intersection.distance}
              onChange={(e) => handleDistanceChange(e.target.value)}
              min={0}
              max={10000}
            />
          </div>
          <div>
            <Label htmlFor={`cycleTime-${intersection.id}`}>{t('cycle_time')}</Label>
            <Input
              id={`cycleTime-${intersection.id}`}
              type="number"
              value={intersection.cycleTime}
              onChange={(e) => handleCycleTimeChange(e.target.value)}
              min={0}
              max={300}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor={`upstreamSpeed-${intersection.id}`}>{t('upstream_speed')}</Label>
            <Input
              id={`upstreamSpeed-${intersection.id}`}
              type="number"
              value={intersection.upstreamSpeed || defaultSpeed}
              onChange={(e) => handleUpstreamSpeedChange(e.target.value)}
              min={0}
              max={120}
            />
          </div>
          <div>
            <Label htmlFor={`downstreamSpeed-${intersection.id}`}>{t('downstream_speed')}</Label>
            <Input
              id={`downstreamSpeed-${intersection.id}`}
              type="number"
              value={intersection.downstreamSpeed || defaultSpeed}
              onChange={(e) => handleDownstreamSpeedChange(e.target.value)}
              min={0}
              max={120}
            />
          </div>
          <div className="flex items-center">
            <Label htmlFor={`useHalfCycleTime-${intersection.id}`} className="mr-2">{t('use_half_cycle')}</Label>
            <Input
              id={`useHalfCycleTime-${intersection.id}`}
              type="checkbox"
              checked={intersection.useHalfCycleTime || false}
              onChange={(e) => handleUseHalfCycleTimeChange(e.target.checked)}
            />
          </div>
        </div>

        <div>
          <Label>{t('green_phases')}</Label>
          <div className="space-y-2">
            {intersection.greenPhases.map((phase, index) => (
              <div key={`${phase.direction}-${index}`} className="grid grid-cols-3 gap-2">
                <Label htmlFor={`${phase.direction}-startTime-${index}`} className="text-right">{phase.direction === 'upstream' ? t('upstream') : t('downstream')} {t('start_time')}</Label>
                <Input
                  id={`${phase.direction}-startTime-${index}`}
                  type="number"
                  value={phase.startTime}
                  onChange={(e) => handleXChange(phase.direction, index, 'startTime', e.target.value)}
                  min={0}
                  max={intersection.cycleTime}
                />
                <Input
                  id={`${phase.direction}-duration-${index}`}
                  type="number"
                  value={phase.duration}
                  onChange={(e) => handleXChange(phase.direction, index, 'duration', e.target.value)}
                  min={1}
                  max={intersection.cycleTime}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
