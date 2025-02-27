
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
        up: { speed: number };
        down: { speed: number };
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

export interface DiagonalPoint {
    junction: number;
    low: number;
    top: number;
}

export interface DiagonalPoints {
    up: DiagonalPoint[];
    down: DiagonalPoint[];
}

export interface RunResult {
    status: string;
    offsets: number[];
    objective_value: number | null;
    // Bandwidth data
    corridorBW_up?: number;
    corridorBW_down?: number;
    corridor_bandwidth_up?: number;
    corridor_bandwidth_down?: number;
    // Local bandwidth between each pair of intersections
    local_up?: Array<number|null>;
    local_down?: Array<number|null>;
    pair_bandwidth_up?: Array<number|null>;
    pair_bandwidth_down?: Array<number|null>;
    // Delays
    avg_delay_up?: Array<number|null>;
    avg_delay_down?: Array<number|null>;
    max_delay_up?: Array<number|null>;
    max_delay_down?: Array<number|null>;
    // Diagonal data
    diagonal_up_start?: Array<number|null>;
    diagonal_up_end?: Array<number|null>;
    diagonal_down_start?: Array<number|null>;
    diagonal_down_end?: Array<number|null>;
    diagonal_points?: DiagonalPoints;
}
