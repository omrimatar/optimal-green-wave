
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

    // תיקון הטיפוסים - התאמה למערכים
    run.chain_up_start = corrUp.chain_up_start;
    run.chain_up_end = corrUp.chain_up_end;
    run.chain_down_start = corrDown.chain_down_start;
    run.chain_down_end = corrDown.chain_down_end;
}

/*******************************************************************
* שרשור UP
******************************************************************/
function chainBWUp(offsets: number[], data: NetworkData, travelUp: number[]): {
    chain_up_start: Array<number|null>;
    chain_up_end: Array<number|null>;
} {
    const n = data.intersections.length;
    if(n < 2) return {chain_up_start: [], chain_up_end: []};
    
    // בדיקה שיש מופעים במעלה הזרם בצמתים הראשונים
    const hasUpPhases = data.intersections[0].green_up?.length > 0 && 
                       data.intersections[1].green_up?.length > 0;
    if (!hasUpPhases) {
        return {
            chain_up_start: new Array(n).fill(null),
            chain_up_end: new Array(n).fill(null)
        };
    }

    let Lc: number, Uc: number;
    const phDep = data.intersections[0].green_up[0];
    const phDest = data.intersections[1].green_up[0];
    const off_dep = offsets[0];
    const off_dest = offsets[1];
    const a = off_dep + phDep.start + travelUp[0];
    const c = a + phDep.duration;
    const b = off_dest + phDest.start;
    const d = b + phDest.duration;
    Lc = Math.max(a, b);
    Uc = Math.min(c, d);
    if(Lc > Uc) {
        return {
            chain_up_start: new Array(n).fill(null),
            chain_up_end: new Array(n).fill(null)
        };
    }

    for(let i = 1; i < n-1; i++) {
        if (!data.intersections[i].green_up?.length || 
            !data.intersections[i+1].green_up?.length) {
            return {
                chain_up_start: new Array(n).fill(null),
                chain_up_end: new Array(n).fill(null)
            };
        }

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
        if(newL > newU) {
            return {
                chain_up_start: new Array(n).fill(null),
                chain_up_end: new Array(n).fill(null)
            };
        }
        Lc = newL;
        Uc = newU;
    }

    // מילוי המערך בערכים מתאימים
    const chain_up_start = new Array(n).fill(null);
    const chain_up_end = new Array(n).fill(null);
    const validValue = Math.max(0, Uc-Lc);
    chain_up_start[0] = validValue;
    chain_up_end[0] = validValue;
    
    return {chain_up_start, chain_up_end};
}

/*******************************************************************
* שרשור DOWN
******************************************************************/
function chainBWDown(offsets: number[], data: NetworkData, travelDown: number[]): {
    chain_down_start: Array<number|null>;
    chain_down_end: Array<number|null>;
} {
    const n = data.intersections.length;
    if(n < 2) return {chain_down_start: [], chain_down_end: []};
    
    // בדיקה שיש מופעים במורד הזרם בצמתים האחרונים
    const hasDownPhases = data.intersections[n-1].green_down?.length > 0 && 
                         data.intersections[n-2].green_down?.length > 0;
    if (!hasDownPhases) {
        return {
            chain_down_start: new Array(n).fill(null),
            chain_down_end: new Array(n).fill(null)
        };
    }

    let Lc: number, Uc: number;
    const ph_dep = data.intersections[n-1].green_down[0];
    const ph_dest = data.intersections[n-2].green_down[0];
    const off_dep = offsets[n-1];
    const off_dest = offsets[n-2];
    const t = travelDown[n-2];
    const a = off_dep + ph_dep.start + t;
    const c = a + ph_dep.duration;
    const b = off_dest + ph_dest.start;
    const d = b + ph_dest.duration;
    Lc = Math.max(a, b);
    Uc = Math.min(c, d);
    if(Lc > Uc) {
        return {
            chain_down_start: new Array(n).fill(null),
            chain_down_end: new Array(n).fill(null)
        };
    }

    for(let i = n-2; i > 0; i--) {
        if (!data.intersections[i].green_down?.length || 
            !data.intersections[i-1].green_down?.length) {
            return {
                chain_down_start: new Array(n).fill(null),
                chain_down_end: new Array(n).fill(null)
            };
        }

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
        if(newL > newU) {
            return {
                chain_down_start: new Array(n).fill(null),
                chain_down_end: new Array(n).fill(null)
            };
        }
        Lc = newL;
        Uc = newU;
    }

    // מילוי המערך בערכים מתאימים
    const chain_down_start = new Array(n).fill(null);
    const chain_down_end = new Array(n).fill(null);
    const validValue = Math.max(0, Uc-Lc);
    chain_down_start[n-1] = validValue;
    chain_down_end[n-1] = validValue;

    return {chain_down_start, chain_down_end};
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
        
        const functionUrl = `https://xfdqxyxvjzbvxewbzrpe.supabase.co/functions/v1/optimize?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmZHF4eXh2anpidnhld2J6cnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk1NzE5MTIsImV4cCI6MjA1NTE0NzkxMn0.uhp87GwzK6g04w3ZTBE1vVe8dtDkXALlzrBsSjAuUtg`;
        console.log('Function URL:', functionUrl);
        
        const response = await fetch(functionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const results = await response.json();
        console.log('Received results:', results);

        if (!results) {
            throw new Error('No results returned from optimization');
        }

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
