
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { OptimizationWeights } from "@/types/optimization";

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
}: WeightsPanelProps) => {
  if (!showWeights) return null;

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-medium">משקולות אופטימיזציה</h3>
      
      <div className="grid gap-4">
        {Object.entries(weights).map(([category, directions]) => (
          <div key={category} className="space-y-2">
            <Label>{category}</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm">במעלה הזרם</Label>
                <Input
                  type="number"
                  value={directions.upstream}
                  onChange={e => onWeightChange(category as keyof OptimizationWeights, 'upstream', Number(e.target.value))}
                />
              </div>
              <div>
                <Label className="text-sm">במורד הזרם</Label>
                <Input
                  type="number"
                  value={directions.downstream}
                  onChange={e => onWeightChange(category as keyof OptimizationWeights, 'downstream', Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
