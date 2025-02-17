
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
  objective_value: number | null;
  corridorBW_up: number;
  corridorBW_down: number;
  chain_corridorBW_up: number | null;
  chain_corridorBW_down: number | null;
  // רוחב פס מקומי בין כל זוג צמתים
  overlap_up?: Array<number|null>;
  overlap_down?: Array<number|null>;
  // עיכובים
  avg_delay_up: Array<number|null>;
  avg_delay_down: Array<number|null>;
  max_delay_up: Array<number|null>;
  max_delay_down: Array<number|null>;
  // ערכי אלכסון
  chain_up_start?: Array<number|null>;
  chain_up_end?: Array<number|null>;
  chain_down_start?: Array<number|null>;
  chain_down_end?: Array<number|null>;
}
