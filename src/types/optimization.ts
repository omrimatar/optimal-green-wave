export interface GreenPhase {
  direction: 'upstream' | 'downstream';
  startTime: number;
  duration: number;
  phaseNumber?: number;
}

export interface Intersection {
  id: number;
  distance: number;
  cycleTime: number;
  greenPhases: GreenPhase[];
  upstreamSpeed?: number;
  downstreamSpeed?: number;
  offset?: number;
  useHalfCycleTime?: boolean;
  name?: string;
}

export interface OptimizationWeights {
  corridor_up: number;
  corridor_down: number;
  overlap_up: number;
  overlap_down: number;
  avg_delay_up: number;
  avg_delay_down: number;
  max_delay_up: number;
  max_delay_down: number;
  alpha?: number;
  beta?: number;
}

export const DEFAULT_WEIGHTS: OptimizationWeights = {
  corridor_up: 0.1,
  corridor_down: 0.1,
  overlap_up: 0.1,
  overlap_down: 0.1,
  avg_delay_up: 0.2,
  avg_delay_down: 0.2,
  max_delay_up: 0.1,
  max_delay_down: 0.1,
  alpha: 0.5,
  beta: 1.0
};

export const modifiedWeights: Record<keyof OptimizationWeights, boolean> = {
  corridor_up: false,
  corridor_down: false,
  overlap_up: false,
  overlap_down: false,
  avg_delay_up: false,
  avg_delay_down: false,
  max_delay_up: false,
  max_delay_down: false,
  alpha: false,
  beta: false
};

export const normalizeWeights = (
  weights: OptimizationWeights, 
  changedKey: keyof OptimizationWeights, 
  newValue: number
): OptimizationWeights => {
  if (changedKey === 'alpha' || changedKey === 'beta') {
    const updatedWeights = { ...weights };
    updatedWeights[changedKey] = newValue;
    modifiedWeights[changedKey] = true;
    return updatedWeights;
  }
  
  const updatedWeights = { ...weights };
  const oldValue = updatedWeights[changedKey];
  const diff = newValue - oldValue;
  
  if (diff === 0) return updatedWeights;
  
  updatedWeights[changedKey] = newValue;
  
  modifiedWeights[changedKey] = true;
  
  const keysToAdjust = Object.keys(updatedWeights).filter(
    key => key !== changedKey && 
           key !== 'alpha' && 
           key !== 'beta' && 
           !modifiedWeights[key as keyof OptimizationWeights]
  ) as Array<keyof OptimizationWeights>;
  
  if (keysToAdjust.length === 0) {
    const allKeysExceptCurrent = Object.keys(updatedWeights).filter(
      key => key !== changedKey && key !== 'alpha' && key !== 'beta'
    ) as Array<keyof OptimizationWeights>;
    
    const sumToAdjust = allKeysExceptCurrent.reduce(
      (sum, key) => sum + updatedWeights[key], 
      0
    );
    
    if (sumToAdjust > 0) {
      const scale = (1 - newValue) / sumToAdjust;
      allKeysExceptCurrent.forEach(key => {
        updatedWeights[key] = Math.max(0, updatedWeights[key] * scale);
      });
    } else {
      const valuePerKey = (1 - newValue) / allKeysExceptCurrent.length;
      allKeysExceptCurrent.forEach(key => {
        updatedWeights[key] = valuePerKey;
      });
    }
    
    return updatedWeights;
  }
  
  const sumToAdjust = keysToAdjust.reduce(
    (sum, key) => sum + updatedWeights[key], 
    0
  );
  
  if (sumToAdjust === 0) {
    if (diff < 0) {
      const valueToAdd = Math.abs(diff) / keysToAdjust.length;
      keysToAdjust.forEach(key => {
        updatedWeights[key] = valueToAdd;
      });
    }
    return updatedWeights;
  }
  
  keysToAdjust.forEach(key => {
    const proportion = updatedWeights[key] / sumToAdjust;
    updatedWeights[key] = Math.max(0, updatedWeights[key] - (diff * proportion));
  });
  
  const newSum = Object.keys(updatedWeights)
    .filter(key => key !== 'alpha' && key !== 'beta')
    .reduce((sum, key) => sum + updatedWeights[key as keyof OptimizationWeights], 0);
    
  if (Math.abs(newSum - 1) > 0.00001) {
    const nonZeroKeys = keysToAdjust.filter(key => updatedWeights[key] > 0);
    if (nonZeroKeys.length > 0) {
      const adjustment = (1 - newSum) / nonZeroKeys.length;
      nonZeroKeys.forEach(key => {
        updatedWeights[key] = Math.max(0, updatedWeights[key] + adjustment);
      });
    }
  }
  
  return updatedWeights;
};

export const resetModifiedFlags = () => {
  Object.keys(modifiedWeights).forEach(key => {
    modifiedWeights[key as keyof OptimizationWeights] = false;
  });
};
