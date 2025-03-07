
// Input types for the Lambda function
export interface LambdaGreenPhase {
  start: number;
  duration: number;
  speed: number;
}

export interface LambdaIntersection {
  id: number;
  distance: number;
  green_up: LambdaGreenPhase[];
  green_down: LambdaGreenPhase[];
  cycle: number;
}

export interface LambdaData {
  intersections: LambdaIntersection[];
}

export interface LambdaWeights {
  pair_bandwidth_up: number;
  pair_bandwidth_down: number;
  avg_delay_up: number;
  max_delay_up: number;
  avg_delay_down: number;
  max_delay_down: number;
  corridor_bandwidth_up: number;
  corridor_bandwidth_down: number;
}

export interface LambdaRequest {
  mode: 'optimization' | 'manual';
  data: LambdaData;
  weights: LambdaWeights;
  manualOffsets?: number[];
}

// Lambda response types
export interface DiagonalPoint {
  junction: number;
  top: number;
  low: number;
}

export interface DiagonalPoints {
  up: DiagonalPoint[];
  down: DiagonalPoint[];
}

export interface PairBandPoint {
  from_junction: number;
  to_junction: number;
  up: {
    origin_low: number;
    origin_high: number;
    dest_low: number;
    dest_high: number;
  };
  down: {
    origin_low: number;
    origin_high: number;
    dest_low: number;
    dest_high: number;
  };
}

export interface RunResult {
  // Arrays of results per intersection pair
  pair_bandwidth_up?: number[];
  pair_bandwidth_down?: number[];
  avg_delay_up?: number[];
  avg_delay_down?: number[];
  max_delay_up?: number[];
  max_delay_down?: number[];
  
  // Overall corridor metrics
  corridor_bandwidth_up?: number;
  corridor_bandwidth_down?: number;
  
  // Calculated local bandwidths (added after Lambda call)
  local_up?: Array<number|null>;
  local_down?: Array<number|null>;
  
  // For compatibility with UI components
  corridorBW_up?: number;
  corridorBW_down?: number;
  
  // Diagonal points for visualization
  diagonal_points?: DiagonalPoints;
  diagonal_up_start?: Array<number|null>;
  diagonal_up_end?: Array<number|null>;
  diagonal_down_start?: Array<number|null>;
  diagonal_down_end?: Array<number|null>;
  
  // Band points for each pair of intersections
  pairs_band_points?: PairBandPoint[];
  
  // Optimization results
  offsets: number[];
  // Added distances property to store actual intersection distances
  distances?: number[];
  
  // Added properties for green wave visualization
  cycle_times?: number[];
  green_up?: Array<{start: number; duration: number; speed?: number}[]>;
  green_down?: Array<{start: number; duration: number; speed?: number}[]>;
  speed?: number;
  
  status: string;
  objective_value: number;
}

export interface LambdaResponse {
  optimization_results: RunResult;
  baseline_results: RunResult;
}

// Network data types for application
export interface GreenPhase {
  start: number;
  duration: number;
  speed?: number;
}

export interface Intersection {
  id: number;
  distance: number;
  green_up: GreenPhase[];
  green_down: GreenPhase[];
  cycle_up?: number;
  cycle_down?: number;
}

export interface Travel {
  up: { speed: number };
  down: { speed: number };
}

export interface NetworkData {
  intersections: Intersection[];
  travel: Travel;
}

export interface Weights {
  overlap_up: number;
  overlap_down: number;
  avg_delay_up: number;
  max_delay_up: number;
  avg_delay_down: number;
  max_delay_down: number;
  corridor_up: number;
  corridor_down: number;
}
