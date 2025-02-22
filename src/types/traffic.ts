
export interface GreenPhase {
    start: number;
    duration: number;
    speed: number;  // km/h
}

export interface Intersection {
    id: number;
    distance: number;
    green_up: GreenPhase[];    // Changed to array for multiple phases
    green_down: GreenPhase[];  // Changed to array for multiple phases
    cycle: number;
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
    pairIndex: number;
    corridor: boolean;     // Whether this is a "corridor" point or pair
    direction: "up" | "down";
    phaseIndex: number;    // Phase index at source
    targetLow: number;     // start at target
    targetHigh: number;    // end at target
    sourceLow: number;     // start at source
    sourceHigh: number;    // end at source
}

export interface RunResult {
    status: string;
    offsets: number[];
    objective_value: number | null;
    corridorBW_up: number;
    corridorBW_down: number;
    local_up: Array<number|null>;
    local_down: Array<number|null>;
    avg_delay_up: Array<number|null>;
    avg_delay_down: Array<number|null>;
    max_delay_up: Array<number|null>;
    max_delay_down: Array<number|null>;
    diagonal_points: DiagonalPoint[];
}

