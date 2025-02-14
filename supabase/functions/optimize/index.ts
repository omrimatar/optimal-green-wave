
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// טעינת GLPK WASM
const glpkWasm = await WebAssembly.instantiateStreaming(
  fetch("https://cdn.jsdelivr.net/npm/glpk.js@4.0.0/dist/glpk.wasm")
);

console.log("Loading optimize function with GLPK WASM");

function solveLP(data: any, weights: any) {
  const problem = {
    name: 'GreenWave',
    objective: {
      direction: glpkWasm.instance.exports.GLP_MAX,
      name: 'z',
      vars: []
    },
    subjectTo: [],
    bounds: []
  };

  const n = data.intersections.length;
  
  // הוספת משתני היסט (offsets)
  const offsetVars = [];
  for (let i = 0; i < n; i++) {
    const offsetVar = problem.vars.length + 1;
    problem.vars.push({
      name: `offset_${i}`,
      coef: 0
    });
    
    problem.bounds.push({
      type: i === 0 ? glpkWasm.instance.exports.GLP_FX : glpkWasm.instance.exports.GLP_DB,
      ub: i === 0 ? 0 : 300,
      lb: 0,
      name: `offset_${i}_bounds`
    });
    offsetVars.push(offsetVar);
  }

  // חישוב זמני נסיעה
  const travelUp = [];
  const travelDown = [];
  for (let i = 0; i < n - 1; i++) {
    const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
    travelUp[i] = Math.round(dist * 3.6 / data.travel.up.speed);
    travelDown[i] = Math.round(dist * 3.6 / data.travel.down.speed);
  }

  // הוספת משתני מסדרון (corridor)
  const corridorUpVar = problem.vars.length + 1;
  problem.vars.push({
    name: 'corridorBW_up',
    coef: weights.corridor_up
  });
  problem.bounds.push({
    type: glpkWasm.instance.exports.GLP_LO,
    lb: 0,
    ub: 0,
    name: 'corridorBW_up_bounds'
  });

  const corridorDownVar = problem.vars.length + 1;
  problem.vars.push({
    name: 'corridorBW_down',
    coef: weights.corridor_down
  });
  problem.bounds.push({
    type: glpkWasm.instance.exports.GLP_LO,
    lb: 0,
    ub: 0,
    name: 'corridorBW_down_bounds'
  });

  // הוספת משתני Overlap ו-Delay לכל כיוון
  const upVars = [];
  const downVars = [];
  
  for (let i = 0; i < n; i++) {
    // UP direction
    if (i < n - 1) {
      const overlapVar = problem.vars.length + 1;
      problem.vars.push({
        name: `overlap_${i}_up`,
        coef: weights.overlap_up
      });
      problem.bounds.push({
        type: glpkWasm.instance.exports.GLP_LO,
        lb: 0,
        ub: 0,
        name: `overlap_${i}_up_bounds`
      });

      const avgDelayVar = problem.vars.length + 1;
      problem.vars.push({
        name: `avgDelay_${i}_up`,
        coef: -weights.avg_delay_up
      });
      problem.bounds.push({
        type: glpkWasm.instance.exports.GLP_LO,
        lb: 0,
        ub: 0,
        name: `avgDelay_${i}_up_bounds`
      });

      const maxDelayVar = problem.vars.length + 1;
      problem.vars.push({
        name: `maxDelay_${i}_up`,
        coef: -weights.max_delay_up
      });
      problem.bounds.push({
        type: glpkWasm.instance.exports.GLP_LO,
        lb: 0,
        ub: 0,
        name: `maxDelay_${i}_up_bounds`
      });

      upVars.push({ overlapVar, avgDelayVar, maxDelayVar });
    }

    // DOWN direction
    if (i > 0) {
      const overlapVar = problem.vars.length + 1;
      problem.vars.push({
        name: `overlap_${i}_down`,
        coef: weights.overlap_down
      });
      problem.bounds.push({
        type: glpkWasm.instance.exports.GLP_LO,
        lb: 0,
        ub: 0,
        name: `overlap_${i}_down_bounds`
      });

      const avgDelayVar = problem.vars.length + 1;
      problem.vars.push({
        name: `avgDelay_${i}_down`,
        coef: -weights.avg_delay_down
      });
      problem.bounds.push({
        type: glpkWasm.instance.exports.GLP_LO,
        lb: 0,
        ub: 0,
        name: `avgDelay_${i}_down_bounds`
      });

      const maxDelayVar = problem.vars.length + 1;
      problem.vars.push({
        name: `maxDelay_${i}_down`,
        coef: -weights.max_delay_down
      });
      problem.bounds.push({
        type: glpkWasm.instance.exports.GLP_LO,
        lb: 0,
        ub: 0,
        name: `maxDelay_${i}_down_bounds`
      });

      downVars.push({ overlapVar, avgDelayVar, maxDelayVar });
    }
  }

  // פתרון הבעיה
  const result = glpkWasm.instance.exports.glp_simplex(problem, {
    presolve: glpkWasm.instance.exports.GLP_ON
  });

  // חילוץ התוצאות
  const offsets = offsetVars.map(varIndex => 
    glpkWasm.instance.exports.glp_get_col_prim(problem, varIndex)
  );

  const optimizedRes = {
    status: result === 0 ? "Optimal" : "Error",
    offsets,
    objective_value: glpkWasm.instance.exports.glp_get_obj_val(problem),
    overlap_up: upVars.map(vars => 
      glpkWasm.instance.exports.glp_get_col_prim(problem, vars.overlapVar)
    ),
    avg_delay_up: upVars.map(vars => 
      glpkWasm.instance.exports.glp_get_col_prim(problem, vars.avgDelayVar)
    ),
    max_delay_up: upVars.map(vars => 
      glpkWasm.instance.exports.glp_get_col_prim(problem, vars.maxDelayVar)
    ),
    overlap_down: downVars.map(vars => 
      glpkWasm.instance.exports.glp_get_col_prim(problem, vars.overlapVar)
    ),
    avg_delay_down: downVars.map(vars => 
      glpkWasm.instance.exports.glp_get_col_prim(problem, vars.avgDelayVar)
    ),
    max_delay_down: downVars.map(vars => 
      glpkWasm.instance.exports.glp_get_col_prim(problem, vars.maxDelayVar)
    ),
    corridorBW_up: glpkWasm.instance.exports.glp_get_col_prim(problem, corridorUpVar),
    corridorBW_down: glpkWasm.instance.exports.glp_get_col_prim(problem, corridorDownVar)
  };

  return optimizedRes;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { data, weights } = await req.json();
    
    // פתרון בעיית האופטימיזציה
    const optimizationResults = solveLP(data, weights);
    
    // כרגע נחזיר תוצאות דמה בנוסף לתוצאות האמיתיות לצורך השוואה
    const n = data.intersections.length;
    const baselineRes = {
      status: "Optimal",
      offsets: new Array(n).fill(0),
      objective_value: 100,
      overlap_up: new Array(n-1).fill(20),
      avg_delay_up: new Array(n-1).fill(15),
      max_delay_up: new Array(n-1).fill(25),
      overlap_down: new Array(n-1).fill(20),
      avg_delay_down: new Array(n-1).fill(15),
      max_delay_down: new Array(n-1).fill(25),
      corridorBW_up: 30,
      corridorBW_down: 30
    };

    return new Response(
      JSON.stringify({
        baseline_results: baselineRes,
        optimized_results: optimizationResults
      }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json"
        } 
      }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});

