
import type { NetworkData, RunResult } from "@/types/traffic";

export function chainPostProc(run: RunResult, data: NetworkData) {
    const n = data.intersections.length;
    const travelUp: number[] = [];
    const travelDown: number[] = [];
    
    for(let i = 0; i < n-1; i++) {
        const dist = data.intersections[i+1].distance - data.intersections[i].distance;
        travelUp[i] = Math.round(dist * 3.6 / data.travel.up.speed);
        travelDown[i] = Math.round(dist * 3.6 / data.travel.down.speed);
    }

    const diagonalUp = chainBWUp(run.offsets, data, travelUp);
    const diagonalDown = chainBWDown(run.offsets, data, travelDown);

    run.diagonal_up_start = diagonalUp.diagonal_up_start;
    run.diagonal_up_end = diagonalUp.diagonal_up_end;
    run.diagonal_down_start = diagonalDown.diagonal_down_start;
    run.diagonal_down_end = diagonalDown.diagonal_down_end;
}

export function chainBWUp(offsets: number[], data: NetworkData, travelUp: number[]): {
    diagonal_up_start: Array<number|null>;
    diagonal_up_end: Array<number|null>;
} {
    const n = data.intersections.length;
    if(n < 2) return {diagonal_up_start: [], diagonal_up_end: []};
    
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
        if(Lc > Uc) return {diagonal_up_start: [], diagonal_up_end: []};
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
        if(newL > newU) return {diagonal_up_start: [], diagonal_up_end: []};
        Lc = newL;
        Uc = newU;
    }
    return {diagonal_up_start: [Math.max(0, Uc-Lc)], diagonal_up_end: [Math.max(0, Uc-Lc)]};
}

export function chainBWDown(offsets: number[], data: NetworkData, travelDown: number[]): {
    diagonal_down_start: Array<number|null>;
    diagonal_down_end: Array<number|null>;
} {
    const n = data.intersections.length;
    if(n < 2) return {diagonal_down_start: [], diagonal_down_end: []};
    
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
        if(Lc > Uc) return {diagonal_down_start: [], diagonal_down_end: []};
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
        if(newL > newU) return {diagonal_down_start: [], diagonal_down_end: []};
        Lc = newL;
        Uc = newU;
    }
    return {diagonal_down_start: [Math.max(0, Uc-Lc)], diagonal_down_end: [Math.max(0, Uc-Lc)]};
}
