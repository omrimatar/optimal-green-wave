
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { OptimizationWeights, normalizeWeights, modifiedWeights, resetModifiedFlags } from "@/types/optimization";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Separator } from "@/components/ui/separator";

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
  const { t, language } = useLanguage();
  const [localWeights, setLocalWeights] = useState<OptimizationWeights>(weights);
  const formatNumber = (num: number) => num.toFixed(1);

  // Update local weights when props change
  useEffect(() => {
    setLocalWeights(weights);
  }, [weights]);

  const handleWeightChange = (category: keyof OptimizationWeights, value: number) => {
    // Make sure value is between 0 and 1
    value = Math.max(0, Math.min(1, value));

    // For alpha, restrict to 0.1-1.0 range
    if (category === 'alpha') {
      value = Math.max(0.1, value);
    }

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

  const handleResetWeights = () => {
    // Reset the modified flags when user resets weights
    resetModifiedFlags();
    onResetWeights();
  };

  // Ensure weights sum to 1
  const totalWeight = Object.entries(localWeights)
    .filter(([key]) => key !== 'alpha' && key !== 'beta')
    .reduce((sum, [_, val]) => sum + val, 0);

  return <>
    <div className="flex gap-2">
      <Button onClick={onToggleWeights} variant="outline" className="flex-1 flex items-center gap-2 justify-center">
        <SlidersHorizontal size={16} />
        {showWeights ? t('hide_weights') : t('show_weights')}
      </Button>
      {showWeights && <Button onClick={handleResetWeights} variant="outline" className="flex items-center gap-2">
        <RotateCcw size={16} />
        {t('reset')}
      </Button>}
    </div>

    {showWeights && <div className="space-y-6 p-4 border rounded-lg">
      <div className="mb-2 flex justify-between items-center text-sm">
        <span></span>
      </div>
      
      <h3 className="font-semibold text-lg mb-4">{t('optimization_weights')}</h3>
      
      <div className="space-y-4">
        <h3 className="font-semibold">{t('corridor_wave')}</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t('upstream')} ({formatNumber(localWeights.corridor_up)})</Label>
            <input type="number" value={parseFloat(localWeights.corridor_up.toFixed(2))} min="0" max="1" step="0.1" onChange={e => handleInputChange('corridor_up', e.target.value)} className="w-16 text-right border rounded px-2" />
          </div>
          <Slider value={[localWeights.corridor_up * 100]} onValueChange={value => handleWeightChange('corridor_up', value[0] / 100)} max={100} step={1} />
          
          <div className="flex justify-between">
            <Label>{t('downstream')} ({formatNumber(localWeights.corridor_down)})</Label>
            <input type="number" value={parseFloat(localWeights.corridor_down.toFixed(2))} min="0" max="1" step="0.1" onChange={e => handleInputChange('corridor_down', e.target.value)} className="w-16 text-right border rounded px-2" />
          </div>
          <Slider value={[localWeights.corridor_down * 100]} onValueChange={value => handleWeightChange('corridor_down', value[0] / 100)} max={100} step={1} />
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
      
      <Separator className="my-6" />
      
      <div className="space-y-6">
        <h3 className="font-semibold text-lg">{t('special_parameters')}</h3>
        
        {/* Alpha parameter - direction balancing */}
        <div className="space-y-3 p-3 bg-gray-50 rounded-md">
          <div className="flex justify-between">
            <Label className="font-medium text-base">α {t('direction_balance')} ({formatNumber(localWeights.alpha || 0.5)})</Label>
            <input 
              type="number" 
              value={parseFloat((localWeights.alpha || 0.5).toFixed(2))} 
              min="0.1" 
              max="1" 
              step="0.1" 
              onChange={e => handleInputChange('alpha', e.target.value)} 
              className="w-16 text-right border rounded px-2" 
            />
          </div>
          <Slider 
            value={[(localWeights.alpha || 0.5) * 100]} 
            onValueChange={value => handleWeightChange('alpha', value[0] / 100)} 
            min={10} // min 0.1
            max={100} // max 1.0
            step={1} 
          />
          <div className={`flex justify-between text-xs text-gray-500 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
            <span>{t('full_direction_balance')}</span>
            <span>{t('no_direction_balance')}</span>
          </div>
        </div>
        
        {/* Beta parameter - secondary phase priority - DISABLED */}
        <div className="space-y-3 p-3 bg-gray-50 rounded-md opacity-60">
          <div className="flex justify-between">
            <Label className="font-medium text-base text-gray-500">β {t('main_phase_priority')} (1.0)</Label>
            <input 
              type="number" 
              value={1.0} 
              min="0" 
              max="1" 
              step="0.1" 
              disabled
              className="w-16 text-right border rounded px-2 bg-gray-100 text-gray-500 cursor-not-allowed" 
            />
          </div>
          <Slider 
            value={[100]} 
            disabled
            className="cursor-not-allowed"
            max={100} 
            step={1} 
          />
          <div className={`flex justify-between text-xs text-gray-500 ${language === 'he' ? 'flex-row-reverse' : ''}`}>
            <span>{t('no_main_phase_priority')}</span>
            <span>{t('full_main_phase_priority')}</span>
          </div>
          <p className="text-sm text-gray-500 italic mt-1">{t('experimental_feature_inactive')}</p>
        </div>
      </div>
    </div>}
  </>;
};

