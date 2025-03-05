
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
  corridor_up: 0.125,
  corridor_down: 0.125,
  overlap_up: 0.125,
  overlap_down: 0.125,
  avg_delay_up: 0.125,
  avg_delay_down: 0.125,
  max_delay_up: 0.125,
  max_delay_down: 0.125
};
