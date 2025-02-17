
export interface GreenPhase {
  start: number;
  duration: number;
}

export interface Intersection {
  id: number;
  distance: number;
  green_up?: GreenPhase[];
  green_down?: GreenPhase[];
  cycle_up?: number;
  cycle_down?: number;
}

export interface NetworkData {
  intersections: Intersection[];
  travel: {
    speedUp: number;
    speedDown: number;
  };
}

export interface Weights {
  corridor_up: number;
  corridor_down: number;
  overlap_up: number;
  overlap_down: number;
  avg_delay_up: number;
  avg_delay_down: number;
  max_delay_up: number;
  max_delay_down: number;
}

export interface RunResult {
  status: string;
  offsets: number[];
  objectiveValue: number;
  overlap_up: number[];
  avg_delay_up: number[];
  max_delay_up: number[];
  overlap_down: number[];
  avg_delay_down: number[];
  max_delay_down: number[];
  corridorBW_up: number;
  corridorBW_down: number;
  chain_corridorBW_up: number | null;
  chain_corridorBW_down: number | null;
}

export interface OptimizationResponse {
  baseline_results: RunResult;
  optimized_results: RunResult;
  manual_results?: RunResult;
}
