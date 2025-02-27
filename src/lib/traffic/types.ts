
import { NetworkData, RunResult } from "@/types/traffic";

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

export interface BandwidthResult {
  up: number|null; 
  down: number|null;
  local_up: Array<number|null>;
  local_down: Array<number|null>;
}
