
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { OptimizationWeights, normalizeWeights } from "@/types/optimization";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

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
  const { t } = useLanguage();
  const [localWeights, setLocalWeights] = useState<OptimizationWeights>(weights);
  const formatNumber = (num: number) => num.toFixed(1);

  // Update local weights when props change
  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  const handleWeightChange = (category: keyof OptimizationWeights, value: number) => {
    if (category === 'corridor_up' || category === 'corridor_down') {
      // These values are locked at 0
      return;
    }

    // Make sure value is between 0 and 1
    value = Math.max(0, Math.min(1, value));

    // Normalize weights so they sum to 1
    const updatedWeights = normalizeWeights(localWeights, category, value);

    // Update local state immediately for responsive UI
    setLocalWeights(updatedWeights);

    // Notify parent component
    onWeightChange(category, value);
  };

  const handleInputChange = (category: keyof OptimizationWeights, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      handleWeightChange(category, numValue);
    }
  };

  const getDisabled = (category: keyof OptimizationWeights) => {
    return category === 'corridor_up' || category === 'corridor_down';
  };

  // Ensure weights sum to 1
  const totalWeight = Object.values(localWeights).reduce((sum, val) => sum + val, 0);

  return <>
    <div className="flex gap-2">
      <Button onClick={onToggleWeights} variant="outline" className="flex-1 flex items-center gap-2 justify-center">
        <SlidersHorizontal size={16} />
        {showWeights ? t('hide_weights') : t('show_weights')}
      </Button>
      {showWeights && <Button onClick={onResetWeights} variant="outline" className="flex items-center gap-2">
        <RotateCcw size={16} />
        {t('reset')}
      </Button>}
    </div>

    {showWeights && <div className="space-y-6 p-4 border rounded-lg">
      <div className="mb-2 flex justify-between items-center text-sm">
        <span></span>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-semibold">{t('corridor_wave')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t('upstream')} ({formatNumber(localWeights.corridor_up)})</Label>
            <input type="number" value={localWeights.corridor_up} min="0" max="1" step="0.1" disabled className="w-16 text-right border rounded px-2" />
          </div>
          <Slider value={[localWeights.corridor_up * 100]} onValueChange={value => handleWeightChange('corridor_up', value[0] / 100)} max={100} step={1} disabled={true} />
          
          <div className="flex justify-between">
            <Label>{t('downstream')} ({formatNumber(localWeights.corridor_down)})</Label>
            <input type="number" value={localWeights.corridor_down} min="0" max="1" step="0.1" disabled className="w-16 text-right border rounded px-2" />
          </div>
          <Slider value={[localWeights.corridor_down * 100]} onValueChange={value => handleWeightChange('corridor_down', value[0] / 100)} max={100} step={1} disabled={true} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">{t('pair_bandwidth')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t('upstream')} ({formatNumber(localWeights.overlap_up)})</Label>
            <input type="number" value={parseFloat(localWeights.overlap_up.toFixed(2))} min="0" max="1" step="0.1" onChange={e => handleInputChange('overlap_up', e.target.value)} className="w-16 text-right border rounded px-2" />
          </div>
          <Slider value={[localWeights.overlap_up * 100]} onValueChange={value => handleWeightChange('overlap_up', value[0] / 100)} max={100} step={1} />
          
          <div className="flex justify-between">
            <Label>{t('downstream')} ({formatNumber(localWeights.overlap_down)})</Label>
            <input type="number" value={parseFloat(localWeights.overlap_down.toFixed(2))} min="0" max="1" step="0.1" onChange={e => handleInputChange('overlap_down', e.target.value)} className="w-16 text-right border rounded px-2" />
          </div>
          <Slider value={[localWeights.overlap_down * 100]} onValueChange={value => handleWeightChange('overlap_down', value[0] / 100)} max={100} step={1} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">{t('average_delay')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t('upstream')} ({formatNumber(localWeights.avg_delay_up)})</Label>
            <input type="number" value={parseFloat(localWeights.avg_delay_up.toFixed(2))} min="0" max="1" step="0.1" onChange={e => handleInputChange('avg_delay_up', e.target.value)} className="w-16 text-right border rounded px-2" />
          </div>
          <Slider value={[localWeights.avg_delay_up * 100]} onValueChange={value => handleWeightChange('avg_delay_up', value[0] / 100)} max={100} step={1} />
          
          <div className="flex justify-between">
            <Label>{t('downstream')} ({formatNumber(localWeights.avg_delay_down)})</Label>
            <input type="number" value={parseFloat(localWeights.avg_delay_down.toFixed(2))} min="0" max="1" step="0.1" onChange={e => handleInputChange('avg_delay_down', e.target.value)} className="w-16 text-right border rounded px-2" />
          </div>
          <Slider value={[localWeights.avg_delay_down * 100]} onValueChange={value => handleWeightChange('avg_delay_down', value[0] / 100)} max={100} step={1} />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">{t('maximum_delay')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t('upstream')} ({formatNumber(localWeights.max_delay_up)})</Label>
            <input type="number" value={parseFloat(localWeights.max_delay_up.toFixed(2))} min="0" max="1" step="0.1" onChange={e => handleInputChange('max_delay_up', e.target.value)} className="w-16 text-right border rounded px-2" />
          </div>
          <Slider value={[localWeights.max_delay_up * 100]} onValueChange={value => handleWeightChange('max_delay_up', value[0] / 100)} max={100} step={1} />
          
          <div className="flex justify-between">
            <Label>{t('downstream')} ({formatNumber(localWeights.max_delay_down)})</Label>
            <input type="number" value={parseFloat(localWeights.max_delay_down.toFixed(2))} min="0" max="1" step="0.1" onChange={e => handleInputChange('max_delay_down', e.target.value)} className="w-16 text-right border rounded px-2" />
          </div>
          <Slider value={[localWeights.max_delay_down * 100]} onValueChange={value => handleWeightChange('max_delay_down', value[0] / 100)} max={100} step={1} />
        </div>
      </div>
    </div>}
  </>;
};
