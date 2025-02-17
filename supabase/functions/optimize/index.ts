import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import * as glpk from "https://esm.sh/glpk.js@6.0.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GreenPhase {
  start: number;
  duration: number;
}

interface Intersection {
  id: number;
  distance: number;
  green_up?: GreenPhase[];
  green_down?: GreenPhase[];
  cycle_up?: number;
  cycle_down?: number;
}

interface NetworkData {
  intersections: Intersection[];
  travel: {
    speedUp: number;
    speedDown: number;
  };
}

interface Weights {
  corridor_up: number;
  corridor_down: number;
  overlap_up: number;
  overlap_down: number;
  avg_delay_up: number;
  avg_delay_down: number;
  max_delay_up: number;
  max_delay_down: number;
}

interface RunResult {
  status: string;
  offsets: number[];
  objective_value: number | null;
  corridorBW_up: number;
  corridorBW_down: number;
  chain_corridorBW_up: number | null;
  chain_corridorBW_down: number | null;
  local_up?: Array<number|null>;
  local_down?: Array<number|null>;
  overlap_up?: Array<number|null>;
  overlap_down?: Array<number|null>;
  avg_delay_up: Array<number|null>;
  avg_delay_down: Array<number|null>;
  max_delay_up: Array<number|null>;
  max_delay_down: Array<number|null>;
  chain_up_start?: Array<number|null>;
  chain_up_end?: Array<number|null>;
  chain_down_start?: Array<number|null>;
  chain_down_end?: Array<number|null>;
}

interface OverDelayVars {
  overlapName: string;
  avgDelayName: string;
  maxDelayName: string;
}

function chainBWUp(offsets: number[], data: NetworkData, travelUp: number[]): number {
  const n = data.intersections.length;
  if (n < 2) return 0;
  let Lc: number, Uc: number;
  {
    const off_dep = offsets[0];
    const off_dest = offsets[1];
    const phDep = data.intersections[0].green_up![0];
    const phDest = data.intersections[1].green_up![0];
    const a = off_dep + phDep.start + travelUp[0];
    const c = a + phDep.duration;
    const b = off_dest + phDest.start;
    const d = b + phDest.duration;
    Lc = Math.max(a, b);
    Uc = Math.min(c, d);
    if (Lc > Uc) return 0;
  }
  for (let i = 1; i < n - 1; i++) {
    const t = travelUp[i];
    Lc += t;
    Uc += t;
    const off_dep = offsets[i];
    const off_dest = offsets[i + 1];
    const phDep = data.intersections[i].green_up![0];
    const phDest = data.intersections[i + 1].green_up![0];
    const a = off_dep + phDep.start;
    const c = a + phDep.duration;
    const b = off_dest + phDest.start;
    const d = b + phDest.duration;
    const newL = Math.max(Lc, a, b);
    const newU = Math.min(Uc, c, d);
    if (newL > newU) return 0;
    Lc = newL;
    Uc = newU;
  }
  return Math.max(0, Uc - Lc);
}

function chainBWDown(offsets: number[], data: NetworkData, travelDown: number[]): number {
  const n = data.intersections.length;
  if (n < 2) return 0;
  let Lc: number, Uc: number;
  {
    const off_dep = offsets[n - 1];
    const off_dest = offsets[n - 2];
    const ph_dep = data.intersections[n - 1].green_down![0];
    const ph_dest = data.intersections[n - 2].green_down![0];
    const t = travelDown[n - 2];
    const a = off_dep + ph_dep.start + t;
    const c = a + ph_dep.duration;
    const b = off_dest + ph_dest.start;
    const d = b + ph_dest.duration;
    Lc = Math.max(a, b);
    Uc = Math.min(c, d);
    if (Lc > Uc) return 0;
  }
  for (let i = n - 2; i > 0; i--) {
    const t = travelDown[i - 1];
    Lc += t;
    Uc += t;
    const off_dep = offsets[i];
    const off_dest = offsets[i - 1];
    const ph_dep = data.intersections[i].green_down![0];
    const ph_dest = data.intersections[i - 1].green_down![0];
    const a = off_dep + ph_dep.start;
    const c = a + ph_dep.duration;
    const b = off_dest + ph_dest.start;
    const d = b + ph_dest.duration;
    const newL = Math.max(Lc, a, b);
    const newU = Math.min(Uc, c, d);
    if (newL > newU) return 0;
    Lc = newL;
    Uc = newU;
  }
  return Math.max(0, Uc - Lc);
}

function computeBaseline(data: NetworkData, weights: Weights): RunResult {
  const n = data.intersections.length;
  
  // חישוב זמני נסיעה
  const travelUp: number[] = [];
  const travelDown: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
    travelUp.push(Math.round((dist * 3.6) / data.travel.speedUp));
    travelDown.push(Math.round((dist * 3.6) / data.travel.speedDown));
  }

  const offsets = Array(n).fill(0);
  const chainUp = chainBWUp(offsets, data, travelUp);
  const chainDown = chainBWDown(offsets, data, travelDown);

  return {
    status: "Optimal",
    offsets,
    objective_value: 0,
    corridorBW_up: chainUp,
    corridorBW_down: chainDown,
    chain_corridorBW_up: chainUp,
    chain_corridorBW_down: chainDown,
    local_up: [],
    local_down: [],
    overlap_up: [],
    overlap_down: [],
    avg_delay_up: [],
    avg_delay_down: [],
    max_delay_up: [],
    max_delay_down: [],
    chain_up_start: [],
    chain_up_end: [],
    chain_down_start: [],
    chain_down_end: []
  };
}

function createOptimizationModel(data: NetworkData, weights: Weights) {
  const n = data.intersections.length;
  
  // יצירת בעיית האופטימיזציה
  const problem = {
    name: 'GreenWaveOptimization',
    objective: {
      direction: glpk.GLP_MAX,
      name: 'obj',
      vars: [] as { name: string; coef: number }[]
    },
    subjectTo: [] as {
      name: string;
      vars: { name: string; coef: number }[];
      bnds: { type: number; ub?: number; lb?: number };
    }[],
    bounds: [] as { name: string; type: number; ub?: number; lb?: number }[]
  };

  // חישוב זמני נסיעה
  const travelUp: number[] = [];
  const travelDown: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
    travelUp.push(Math.round((dist * 3.6) / data.travel.speedUp));
    travelDown.push(Math.round((dist * 3.6) / data.travel.speedDown));
  }

  // הוספת משתני ההיסט
  for (let i = 0; i < n; i++) {
    problem.bounds.push({
      name: `offset_${i}`,
      type: glpk.GLP_DB,
      ub: i === 0 ? 0 : data.intersections[i].cycle_up! - 1,
      lb: 0
    });
    problem.objective.vars.push({
      name: `offset_${i}`,
      coef: 0
    });
  }

  // משתנים לרוחב פס וחפיפה
  for (let i = 0; i < n - 1; i++) {
    // רוחב פס למעלה
    problem.bounds.push({
      name: `overlap_up_${i}`,
      type: glpk.GLP_DB,
      ub: Math.min(
        data.intersections[i].green_up![0].duration,
        data.intersections[i + 1].green_up![0].duration
      ),
      lb: 0
    });
    problem.objective.vars.push({
      name: `overlap_up_${i}`,
      coef: weights.overlap_up
    });

    // רוחב פס למטה
    problem.bounds.push({
      name: `overlap_down_${i}`,
      type: glpk.GLP_DB,
      ub: Math.min(
        data.intersections[i].green_down![0].duration,
        data.intersections[i + 1].green_down![0].duration
      ),
      lb: 0
    });
    problem.objective.vars.push({
      name: `overlap_down_${i}`,
      coef: weights.overlap_down
    });

    // אילוצי חפיפה למעלה
    const currUp = data.intersections[i].green_up![0];
    const nextUp = data.intersections[i + 1].green_up![0];
    problem.subjectTo.push({
      name: `overlap_up_constraint_${i}`,
      vars: [
        { name: `offset_${i}`, coef: 1 },
        { name: `offset_${i + 1}`, coef: -1 },
        { name: `overlap_up_${i}`, coef: -1 }
      ],
      bnds: { type: glpk.GLP_UP, ub: -travelUp[i] - currUp.start + nextUp.start }
    });

    // אילוצי חפיפה למטה
    const currDown = data.intersections[i].green_down![0];
    const nextDown = data.intersections[i + 1].green_down![0];
    problem.subjectTo.push({
      name: `overlap_down_constraint_${i}`,
      vars: [
        { name: `offset_${i}`, coef: 1 },
        { name: `offset_${i + 1}`, coef: -1 },
        { name: `overlap_down_${i}`, coef: -1 }
      ],
      bnds: { type: glpk.GLP_UP, ub: -travelDown[i] - currDown.start + nextDown.start }
    });
  }

  return { problem, travelUp, travelDown };
}

function optimizeGreenWave(data: NetworkData, weights: Weights): RunResult {
  const n = data.intersections.length;
  const { problem, travelUp, travelDown } = createOptimizationModel(data, weights);

  // יצירת המודל ופתרון
  try {
    console.log("Creating GLPK problem...");
    const lp = glpk.glp_create_prob();
    glpk.glp_set_prob_name(lp, problem.name);
    glpk.glp_set_obj_dir(lp, problem.objective.direction);

    // הוספת משתנים
    const numVars = problem.bounds.length;
    glpk.glp_add_cols(lp, numVars);
    problem.bounds.forEach((bound, i) => {
      glpk.glp_set_col_name(lp, i + 1, bound.name);
      glpk.glp_set_col_bnds(lp, i + 1, bound.type, bound.lb || 0, bound.ub || 0);
    });

    // הוספת אילוצים
    const numConstraints = problem.subjectTo.length;
    glpk.glp_add_rows(lp, numConstraints);
    problem.subjectTo.forEach((constraint, i) => {
      glpk.glp_set_row_name(lp, i + 1, constraint.name);
      glpk.glp_set_row_bnds(lp, i + 1, constraint.bnds.type, 0, constraint.bnds.ub || 0);
    });

    // הגדרת פונקציית המטרה
    problem.objective.vars.forEach((v, i) => {
      glpk.glp_set_obj_coef(lp, i + 1, v.coef);
    });

    console.log("Solving problem...");
    const solution = glpk.glp_simplex(lp, { presolve: glpk.GLP_ON });
    console.log("Solution status:", solution);

    if (solution.result !== 0) {
      console.error("Failed to solve problem");
      throw new Error("Optimization failed");
    }

    // חילוץ התוצאות
    const offsets = Array(n).fill(0).map((_, i) => 
      Math.round(glpk.glp_get_col_prim(lp, i + 1))
    );

    const overlap_up = Array(n-1).fill(0).map((_, i) => 
      glpk.glp_get_col_prim(lp, n + i + 1)
    );

    const overlap_down = Array(n-1).fill(0).map((_, i) => 
      glpk.glp_get_col_prim(lp, n + (n-1) + i + 1)
    );

    const chainUp = chainBWUp(offsets, data, travelUp);
    const chainDown = chainBWDown(offsets, data, travelDown);

    glpk.glp_delete_prob(lp);

    return {
      status: "Optimal",
      offsets,
      objective_value: glpk.glp_get_obj_val(lp),
      corridorBW_up: chainUp,
      corridorBW_down: chainDown,
      chain_corridorBW_up: chainUp,
      chain_corridorBW_down: chainDown,
      overlap_up,
      overlap_down,
      avg_delay_up: [],
      avg_delay_down: [],
      max_delay_up: [],
      max_delay_down: [],
      local_up: [],
      local_down: [],
      chain_up_start: [],
      chain_up_end: [],
      chain_down_start: [],
      chain_down_end: []
    };
  } catch (error) {
    console.error("Optimization error:", error);
    return {
      status: "Failed",
      offsets: Array(n).fill(0),
      objective_value: null,
      corridorBW_up: 0,
      corridorBW_down: 0,
      chain_corridorBW_up: null,
      chain_corridorBW_down: null,
      avg_delay_up: [],
      avg_delay_down: [],
      max_delay_up: [],
      max_delay_down: [],
      local_up: [],
      local_down: [],
      overlap_up: [],
      overlap_down: []
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  try {
    const bodyText = await req.text();
    if (!bodyText) throw new Error("Request body is empty");
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(bodyText);
    } catch (e) {
      throw new Error("Invalid JSON in request body");
    }
    const { data, weights, manualOffsets } = parsedBody;
    if (!data || !weights) throw new Error("Missing required fields: data or weights");
    
    // baseline
    const baselineRes = computeBaseline(data, weights);
    
    // optimized - כעת משתמשים באופטימיזציה
    const optimizedRes = optimizeGreenWave(data, weights);
    
    // manual
    let manual_results = null;
    if (manualOffsets && manualOffsets.length === data.intersections.length) {
      const normalizedOffsets = [...manualOffsets];
      normalizedOffsets[0] = 0;
      
      const travelUp: number[] = [];
      const travelDown: number[] = [];
      for (let i = 0; i < data.intersections.length - 1; i++) {
        const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
        travelUp.push(Math.round((dist * 3.6) / data.travel.speedUp));
        travelDown.push(Math.round((dist * 3.6) / data.travel.speedDown));
      }
      
      const chainUp = chainBWUp(normalizedOffsets, data, travelUp);
      const chainDown = chainBWDown(normalizedOffsets, data, travelDown);
      
      manual_results = {
        status: "Success",
        offsets: normalizedOffsets,
        objective_value: null,
        corridorBW_up: chainUp,
        corridorBW_down: chainDown,
        chain_corridorBW_up: chainUp,
        chain_corridorBW_down: chainDown,
        local_up: [],
        local_down: [],
        overlap_up: [],
        overlap_down: [],
        avg_delay_up: [],
        avg_delay_down: [],
        max_delay_up: [],
        max_delay_down: [],
        chain_up_start: [],
        chain_up_end: [],
        chain_down_start: [],
        chain_down_end: []
      };
    }
    
    const response = {
      baseline_results: baselineRes,
      optimized_results: optimizedRes,
      manual_results,
    };
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Function error:", error);
    return new Response(
      JSON.stringify({ error: error.message, type: error.constructor.name }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
