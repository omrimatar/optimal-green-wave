
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
}

export interface OptimizationWeights {
  corridorBandwidth: {
    upstream: number;
    downstream: number;
  };
  adjacentPairs: {
    upstream: number;
    downstream: number;
  };
  delayMinimization: {
    upstream: number;
    downstream: number;
  };
}

export const DEFAULT_WEIGHTS: OptimizationWeights = {
  corridorBandwidth: {
    upstream: 25,
    downstream: 25
  },
  adjacentPairs: {
    upstream: 15,
    downstream: 15
  },
  delayMinimization: {
    upstream: 10,
    downstream: 10
  }
};
