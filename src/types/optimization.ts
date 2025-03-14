
export interface GreenPhase {
  direction: 'upstream' | 'downstream';
  startTime: number;
  duration: number;
}

export interface Intersection {
  id: number;
  distance: number;
  cycleTime: number;
  greenPhases: GreenPhase[];
  offset?: number;
  upstreamSpeed?: number;
  downstreamSpeed?: number;
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
}

export const DEFAULT_WEIGHTS: OptimizationWeights = {
  corridor_up: 0.2,
  corridor_down: 0.2,
  overlap_up: 0.1,
  overlap_down: 0.1,
  avg_delay_up: 0.2,
  avg_delay_down: 0.2,
  max_delay_up: 0.1,
  max_delay_down: 0.1
};

// Helper function to ensure weights sum to 1
export const normalizeWeights = (
  weights: OptimizationWeights, 
  changedKey: keyof OptimizationWeights, 
  newValue: number
): OptimizationWeights => {
  const updatedWeights = { ...weights };
  const oldValue = updatedWeights[changedKey];
  const diff = newValue - oldValue;
  
  if (diff === 0) return updatedWeights;
  
  updatedWeights[changedKey] = newValue;
  
  // Get keys to adjust (excluding the changed key)
  const keysToAdjust = Object.keys(updatedWeights).filter(
    key => key !== changedKey
  ) as Array<keyof OptimizationWeights>;
  
  // Calculate sum of weights to adjust
  const sumToAdjust = keysToAdjust.reduce(
    (sum, key) => sum + updatedWeights[key], 
    0
  );
  
  if (sumToAdjust === 0) {
    // Special case: if all other weights are 0, distribute evenly
    if (diff < 0) {
      const valueToAdd = Math.abs(diff) / keysToAdjust.length;
      keysToAdjust.forEach(key => {
        updatedWeights[key] = valueToAdd;
      });
    }
    return updatedWeights;
  }
  
  // Adjust other weights proportionally
  keysToAdjust.forEach(key => {
    const proportion = updatedWeights[key] / sumToAdjust;
    updatedWeights[key] = Math.max(0, updatedWeights[key] - (diff * proportion));
  });
  
  // Fix any rounding errors to ensure sum is exactly 1
  const newSum = Object.values(updatedWeights).reduce((sum, val) => sum + val, 0);
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
