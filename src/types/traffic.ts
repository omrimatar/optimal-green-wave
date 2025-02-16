
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

export interface RunResult {
    status: string;
    offsets: number[];
    objective_value: number | null;
    // רוחב פס גלובלי בציר
    corridorBW_up: number;
    corridorBW_down: number;
    // רוחב פס מקומי בין כל זוג צמתים
    local_up: Array<number|null>;
    local_down: Array<number|null>;
    // עיכובים
    avg_delay_up: Array<number|null>;
    avg_delay_down: Array<number|null>;
    max_delay_up: Array<number|null>;
    max_delay_down: Array<number|null>;
    // ערכי אלכסון (לא מוצגים בטבלה)
    diagonal_up_start: Array<number|null>;
    diagonal_up_end: Array<number|null>;
    diagonal_down_start: Array<number|null>;
    diagonal_down_end: Array<number|null>;
}
