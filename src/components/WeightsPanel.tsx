
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { OptimizationWeights } from "@/types/optimization";

interface WeightsPanelProps {
  weights: OptimizationWeights;
  showWeights: boolean;
  onWeightChange: (category: keyof OptimizationWeights, direction: 'upstream' | 'downstream', value: number) => void;
  onToggleWeights: () => void;
  onResetWeights: () => void;
}

export const WeightsPanel = ({
  weights,
  showWeights,
  onWeightChange,
  onToggleWeights,
  onResetWeights,
}: WeightsPanelProps) => {
  const formatNumber = (num: number) => num.toFixed(1);

  return (
    <>
      <div className="flex gap-2">
        <Button 
          onClick={onToggleWeights} 
          variant="outline" 
          className="flex-1 flex items-center gap-2 justify-center"
        >
          <SlidersHorizontal size={16} />
          {showWeights ? 'הסתר משקולות אופטימיזציה' : 'הצג משקולות אופטימיזציה'}
        </Button>
        {showWeights && (
          <Button
            onClick={onResetWeights}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw size={16} />
            איפוס
          </Button>
        )}
      </div>

      {showWeights && (
        <div className="space-y-6 p-4 border rounded-lg">
          <div className="space-y-4">
            <h3 className="font-semibold">גל ירוק בציר</h3>
            <div className="space-y-2">
              <Label>במעלה הזרם ({formatNumber(weights.corridorBandwidth.upstream)}%)</Label>
              <Slider 
                value={[weights.corridorBandwidth.upstream]}
                onValueChange={(value) => onWeightChange('corridorBandwidth', 'upstream', value[0])}
                max={100}
                step={0.1}
                defaultValue={[25]}
              />
              <Label>במורד הזרם ({formatNumber(weights.corridorBandwidth.downstream)}%)</Label>
              <Slider 
                value={[weights.corridorBandwidth.downstream]}
                onValueChange={(value) => onWeightChange('corridorBandwidth', 'downstream', value[0])}
                max={100}
                step={0.1}
                defaultValue={[25]}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">חפיפה בין צמתים סמוכים</h3>
            <div className="space-y-2">
              <Label>במעלה הזרם ({formatNumber(weights.adjacentPairs.upstream)}%)</Label>
              <Slider 
                value={[weights.adjacentPairs.upstream]}
                onValueChange={(value) => onWeightChange('adjacentPairs', 'upstream', value[0])}
                max={100}
                step={0.1}
                defaultValue={[15]}
              />
              <Label>במורד הזרם ({formatNumber(weights.adjacentPairs.downstream)}%)</Label>
              <Slider 
                value={[weights.adjacentPairs.downstream]}
                onValueChange={(value) => onWeightChange('adjacentPairs', 'downstream', value[0])}
                max={100}
                step={0.1}
                defaultValue={[15]}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">מזעור עיכובים</h3>
            <div className="space-y-2">
              <Label>במעלה הזרם ({formatNumber(weights.delayMinimization.upstream)}%)</Label>
              <Slider 
                value={[weights.delayMinimization.upstream]}
                onValueChange={(value) => onWeightChange('delayMinimization', 'upstream', value[0])}
                max={100}
                step={0.1}
                defaultValue={[10]}
              />
              <Label>במורד הזרם ({formatNumber(weights.delayMinimization.downstream)}%)</Label>
              <Slider 
                value={[weights.delayMinimization.downstream]}
                onValueChange={(value) => onWeightChange('delayMinimization', 'downstream', value[0])}
                max={100}
                step={0.1}
                defaultValue={[10]}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
