import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { OptimizationWeights } from "@/types/optimization";
interface WeightsPanelProps {
  weights: OptimizationWeights;
  showWeights: boolean;
  onWeightChange: (category: keyof OptimizationWeights, value: number) => void;
  onToggleWeights: () => void;
  onResetWeights: () => void;
}
export const WeightsPanel = ({
  weights,
  showWeights,
  onWeightChange,
  onToggleWeights,
  onResetWeights
}: WeightsPanelProps) => {
  const formatNumber = (num: number) => num.toFixed(1);
  return <>
      <div className="flex gap-2">
        <Button onClick={onToggleWeights} variant="outline" className="flex-1 flex items-center gap-2 justify-center">
          <SlidersHorizontal size={16} />
          {showWeights ? 'הסתר משקולות אופטימיזציה' : 'הצג משקולות אופטימיזציה'}
        </Button>
        {showWeights && <Button onClick={onResetWeights} variant="outline" className="flex items-center gap-2">
            <RotateCcw size={16} />
            איפוס
          </Button>}
      </div>

      {showWeights && <div className="space-y-6 p-4 border rounded-lg">
          <div className="space-y-4">
            <h3 className="font-semibold">גל ירוק בציר</h3>
            <div className="space-y-2">
              <Label>במעלה הזרם ({formatNumber(weights.corridor_up)})</Label>
              <Slider value={[weights.corridor_up * 100]} onValueChange={value => onWeightChange('corridor_up', value[0] / 100)} max={100} step={1} />
              <Label>במורד הזרם ({formatNumber(weights.corridor_down)})</Label>
              <Slider value={[weights.corridor_down * 100]} onValueChange={value => onWeightChange('corridor_down', value[0] / 100)} max={100} step={1} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">רוחב פס בין צמתים סמוכים</h3>
            <div className="space-y-2">
              <Label>במעלה הזרם ({formatNumber(weights.overlap_up)})</Label>
              <Slider value={[weights.overlap_up * 100]} onValueChange={value => onWeightChange('overlap_up', value[0] / 100)} max={100} step={1} />
              <Label>במורד הזרם ({formatNumber(weights.overlap_down)})</Label>
              <Slider value={[weights.overlap_down * 100]} onValueChange={value => onWeightChange('overlap_down', value[0] / 100)} max={100} step={1} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">עיכוב ממוצע</h3>
            <div className="space-y-2">
              <Label>במעלה הזרם ({formatNumber(weights.avg_delay_up)})</Label>
              <Slider value={[weights.avg_delay_up * 100]} onValueChange={value => onWeightChange('avg_delay_up', value[0] / 100)} max={100} step={1} />
              <Label>במורד הזרם ({formatNumber(weights.avg_delay_down)})</Label>
              <Slider value={[weights.avg_delay_down * 100]} onValueChange={value => onWeightChange('avg_delay_down', value[0] / 100)} max={100} step={1} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">עיכוב מקסימלי</h3>
            <div className="space-y-2">
              <Label>במעלה הזרם ({formatNumber(weights.max_delay_up)})</Label>
              <Slider value={[weights.max_delay_up * 100]} onValueChange={value => onWeightChange('max_delay_up', value[0] / 100)} max={100} step={1} />
              <Label>במורד הזרם ({formatNumber(weights.max_delay_down)})</Label>
              <Slider value={[weights.max_delay_down * 100]} onValueChange={value => onWeightChange('max_delay_down', value[0] / 100)} max={100} step={1} />
            </div>
          </div>
        </div>}
    </>;
};