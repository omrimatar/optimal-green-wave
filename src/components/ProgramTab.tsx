
import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Play, Hand, ArrowRight } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Intersection, OptimizationWeights } from '@/types/optimization';
import { toast } from 'sonner';
import { IntersectionProgramInput } from './IntersectionProgramInput';

interface ProgramTabProps {
  programId: number;
  speed: number;
  intersections: Intersection[];
  weights: OptimizationWeights;
  showManualDialog: (programId: number) => void;
  onShowExisting: (programId: number) => void;
  onCalculate: (programId: number) => void;
  onIntersectionChange: (intersectionIndex: number, updatedIntersection: Intersection) => void;
  language: string;
  t: (key: string) => string;
}

export const ProgramTab: React.FC<ProgramTabProps> = ({
  programId,
  speed,
  intersections,
  weights,
  showManualDialog,
  onShowExisting,
  onCalculate,
  onIntersectionChange,
  language,
  t
}) => {
  return (
    <TabsContent value={`program-${programId}`} className="space-y-4">
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">{t('program')} {programId}</h3>
          </div>
          
          {intersections.map((intersection, index) => (
            <IntersectionProgramInput 
              key={`${intersection.id}-program-${programId}`}
              intersection={intersection}
              programId={programId}
              onChange={(updatedIntersection) => {
                onIntersectionChange(index, updatedIntersection);
              }}
            />
          ))}

          <div className="flex flex-wrap gap-2 md:gap-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => onShowExisting(programId)} 
              className="flex items-center gap-1 md:gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs md:text-sm"
            >
              <Play size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t('draw_existing')}</span>
              <span className="sm:hidden">{t('draw_existing')}</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => showManualDialog(programId)}
              className="flex items-center gap-1 md:gap-2 bg-purple-500 hover:bg-purple-600 text-white text-xs md:text-sm"
            >
              <Hand size={14} className="md:w-4 md:h-4" />
              <span className="hidden sm:inline">{t('manual_calculation')}</span>
              <span className="sm:hidden">{t('manual')}</span>
            </Button>

            <Button 
              onClick={() => onCalculate(programId)} 
              className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-xs md:text-sm"
            >
              <span className="sm:hidden">{t('calculate')}</span>
              <span className="hidden sm:inline">{t('calculate_green_wave')}</span>
              <ArrowRight className={`${language === 'he' ? "mr-2" : "ml-2"} w-3 h-3 md:w-4 md:h-4`} size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </TabsContent>
  );
};
