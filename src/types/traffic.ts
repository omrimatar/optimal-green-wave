
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

/*******************************************************************
* פונקציית עזר לחישוב L_i,U_i בצורה חיצונית + שרשור
******************************************************************/
export function chainPostProc(run: RunResult, data: NetworkData) {
    const n = data.intersections.length;
    const travelUp: number[] = [];
    const travelDown: number[] = [];
    
    for(let i = 0; i < n-1; i++) {
        const dist = data.intersections[i+1].distance - data.intersections[i].distance;
        travelUp[i] = Math.round(dist * 3.6 / data.travel.up.speed);
        travelDown[i] = Math.round(dist * 3.6 / data.travel.down.speed);
    }

    const corrUp = chainBWUp(run.offsets, data, travelUp);
    const corrDown = chainBWDown(run.offsets, data, travelDown);

    run.chain_corridorBW_up = corrUp;
    run.chain_corridorBW_down = corrDown;
}

/*******************************************************************
* שרשור UP
******************************************************************/
function chainBWUp(offsets: number[], data: NetworkData, travelUp: number[]): number {
    const n = data.intersections.length;
    if(n < 2) return 0;
    
    let Lc: number, Uc: number;
    {
        const off_dep = offsets[0];
        const off_dest = offsets[1];
        const phDep = data.intersections[0].green_up[0];
        const phDest = data.intersections[1].green_up[0];
        const a = off_dep + phDep.start + travelUp[0];
        const c = a + phDep.duration;
        const b = off_dest + phDest.start;
        const d = b + phDest.duration;
        Lc = Math.max(a, b);
        Uc = Math.min(c, d);
        if(Lc > Uc) return 0;
    }

    for(let i = 1; i < n-1; i++) {
        const t = travelUp[i];
        Lc += t;
        Uc += t;
        const off_dep = offsets[i];
        const off_dest = offsets[i+1];
        const phDep = data.intersections[i].green_up[0];
        const phDest = data.intersections[i+1].green_up[0];
        const a = off_dep + phDep.start;
        const c = a + phDep.duration;
        const b = off_dest + phDest.start;
        const d = b + phDest.duration;
        const newL = Math.max(Lc, Math.max(a, b));
        const newU = Math.min(Uc, Math.min(c, d));
        if(newL > newU) return 0;
        Lc = newL;
        Uc = newU;
    }
    return Math.max(0, Uc-Lc);
}

/*******************************************************************
* שרשור DOWN
******************************************************************/
function chainBWDown(offsets: number[], data: NetworkData, travelDown: number[]): number {
    const n = data.intersections.length;
    if(n < 2) return 0;
    
    let Lc: number, Uc: number;
    {
        const off_dep = offsets[n-1];
        const off_dest = offsets[n-2];
        const ph_dep = data.intersections[n-1].green_down[0];
        const ph_dest = data.intersections[n-2].green_down[0];
        const t = travelDown[n-2];
        const a = off_dep + ph_dep.start + t;
        const c = a + ph_dep.duration;
        const b = off_dest + ph_dest.start;
        const d = b + ph_dest.duration;
        Lc = Math.max(a, b);
        Uc = Math.min(c, d);
        if(Lc > Uc) return 0;
    }

    for(let i = n-2; i > 0; i--) {
        const t = travelDown[i-1];
        Lc += t;
        Uc += t;
        const off_dep = offsets[i];
        const off_dest = offsets[i-1];
        const ph_dep = data.intersections[i].green_down[0];
        const ph_dest = data.intersections[i-1].green_down[0];
        const a = off_dep + ph_dep.start;
        const c = a + ph_dep.duration;
        const b = off_dest + ph_dest.start;
        const d = b + ph_dest.duration;
        const newL = Math.max(Lc, Math.max(a, b));
        const newU = Math.min(Uc, Math.min(c, d));
        if(newL > newU) return 0;
        Lc = newL;
        Uc = newU;
    }
    return Math.max(0, Uc-Lc);
}

