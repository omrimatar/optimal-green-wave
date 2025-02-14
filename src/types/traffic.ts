
export interface GreenPhase {
  start: number;
  duration: number;
}

export interface Intersection {
  id: number;
  distance: number;
  green_up: GreenPhase[];
  green_down: GreenPhase[];
  cycle_up: number;
  cycle_down: number;
}

export interface NetworkData {
  intersections: Intersection[];
  travel: {
    up: { speed: number };
    down: { speed: number };
  };
}

export interface Weights {
  corridor_up: number;
  corridor_down: number;
  overlap_up: number;
  avg_delay_up: number;
  max_delay_up: number;
  overlap_down: number;
  avg_delay_down: number;
  max_delay_down: number;
}

export interface RunResult {
  status: string;
  offsets: number[];
  objective_value: number | null;
  overlap_up: number[];
  avg_delay_up: number[];
  max_delay_up: number[];
  overlap_down: number[];
  avg_delay_down: number[];
  max_delay_down: number[];
  corridorBW_up: number;
  corridorBW_down: number;
  chain_corridorBW_up?: number;
  chain_corridorBW_down?: number;
  local_up_L?: (number | null)[];
  local_up_U?: (number | null)[];
  local_down_L?: (number | null)[];
  local_down_U?: (number | null)[];
}

