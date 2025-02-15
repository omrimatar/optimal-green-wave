
import { supabase } from "@/integrations/supabase/client";
import type { NetworkData, Weights, RunResult } from "@/types/traffic";

// הגדרת מופע ירוק בצומת
export interface GreenPhase {
    start: number; // זמן תחילת המופע במחזור
    duration: number; // משך המופע
}

// הגדרת צומת
export interface Intersection {
    id: number;
    distance: number; // מרחק לאורך הציר
    green_up: GreenPhase[]; // רשימת מופעים בכיוון up
    green_down: GreenPhase[]; // רשימת מופעים בכיוון down
    cycle_up: number; // אורך מחזור בכיוון up
    cycle_down: number; // אורך מחזור בכיוון down
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

/*******************************************************************
* פונקציית האופטימיזציה הראשית
******************************************************************/
export async function greenWaveOptimization(data: NetworkData, weights: Weights) {
    try {
        console.log('Starting optimization with data:', { 
            intersections: data.intersections,
            travel: data.travel
        });
        console.log('Using weights:', weights);

        // בדיקת תקינות הנתונים לפני השליחה
        if (!data.intersections || !data.travel || !weights) {
            throw new Error('Missing required data for optimization');
        }

        // שליחת הבקשה לפונקציית Edge
        console.log('Preparing request body...');
        const requestBody = {
            data: {
                intersections: data.intersections,
                travel: data.travel
            },
            weights
        };
        console.log('Request body:', requestBody);
        
        const { data: results, error } = await supabase.functions.invoke('optimize', {
            headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
            body: requestBody
        });

        if (error) {
            console.error('Error in optimization:', error);
            throw error;
        }

        if (!results) {
            throw new Error('No results returned from optimization');
        }

        console.log('Received results:', results);

        // חישוב post-processing על התוצאות
        if (results.baseline_results) {
            console.log('Processing baseline results...');
            chainPostProc(results.baseline_results, data);
        }
        if (results.optimized_results) {
            console.log('Processing optimized results...');
            chainPostProc(results.optimized_results, data);
        }

        console.log('Final results:', results);
        return results;
    } catch (error) {
        console.error('Error in greenWaveOptimization:', error);
        throw error;
    }
}
