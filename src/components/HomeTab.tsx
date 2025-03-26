
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { FileActions } from '@/components/FileActions';
import { WeightsPanel } from '@/components/WeightsPanel';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { TabsContent } from '@/components/ui/tabs';
import { OptimizationWeights, Intersection } from '@/types/optimization';
import { IntersectionBaseInput } from './IntersectionBaseInput';

interface HomeTabProps {
  globalCycleTime: number;
  speed: number;
  weights: OptimizationWeights;
  showWeights: boolean;
  intersections: Intersection[];
  onGlobalCycleTimeChange: (value: string) => void;
  onSpeedChange: (value: string) => void;
  onToggleWeights: () => void;
  onWeightChange: (category: keyof OptimizationWeights, value: number) => void;
  onResetWeights: () => void;
  onLoadInput: (data: {
    speed: number;
    intersections: Intersection[];
    weights?: OptimizationWeights;
  }) => void;
  onIntersectionChange: (index: number, updatedIntersection: Intersection) => void;
  onAddIntersection: () => void;
  onDeleteIntersection: (id: number) => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  globalCycleTime,
  speed,
  weights,
  showWeights,
  intersections,
  onGlobalCycleTimeChange,
  onSpeedChange,
  onToggleWeights,
  onWeightChange,
  onResetWeights,
  onLoadInput,
  onIntersectionChange,
  onAddIntersection,
  onDeleteIntersection
}) => {
  const { t } = useLanguage();

  return (
    <TabsContent value="home" className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <FileActions
            speed={speed}
            intersections={intersections}
            weights={weights}
            onLoadInput={onLoadInput}
          />

          <div>
            <Label htmlFor="globalCycleTime">{t('cycle_time')}</Label>
            <Input
              id="globalCycleTime"
              type="number"
              value={globalCycleTime}
              min={0}
              max={300}
              onChange={e => onGlobalCycleTimeChange(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <Label htmlFor="speed">{t('default_speed')}</Label>
            <Input
              id="speed"
              type="number"
              value={speed}
              min={0}
              max={120}
              onChange={e => onSpeedChange(e.target.value)}
              className="w-full"
            />
          </div>

          <WeightsPanel
            weights={weights}
            showWeights={showWeights}
            onWeightChange={onWeightChange}
            onToggleWeights={onToggleWeights}
            onResetWeights={onResetWeights}
          />

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>{t('intersections')}</Label>
              <Button variant="outline" size="sm" onClick={onAddIntersection} className="flex items-center gap-2">
                <Plus size={16} />
                <span className="hidden sm:inline">{t('add_intersection')}</span>
                <span className="sm:hidden">{t('add')}</span>
              </Button>
            </div>

            {intersections.map((intersection, index) => (
              <IntersectionBaseInput
                key={intersection.id}
                intersection={intersection}
                defaultSpeed={speed}
                onChange={updated => onIntersectionChange(index, updated)}
                onDelete={() => {
                  if (intersections.length > 2) {
                    onDeleteIntersection(intersection.id);
                  }
                }}
              />
            ))}
          </div>
        </div>
      </Card>
    </TabsContent>
  );
};
