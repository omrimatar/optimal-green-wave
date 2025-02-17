
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import glpk from 'npm:glpk.js@4.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  objectiveValue: number;
  overlap_up: number[];
  avg_delay_up: number[];
  max_delay_up: number[];
  overlap_down: number[];
  avg_delay_down: number[];
  max_delay_down: number[];
  corridorBW_up: number;
  corridorBW_down: number;
  chain_corridorBW_up: number | null;
  chain_corridorBW_down: number | null;
}

interface OverDelayVars {
  overlapName: string;
  avgDelayName: string;
  maxDelayName: string;
}

function defineOverlapAndDelay(
  model: any,
  i_pair: number,
  direction: string,
  data: NetworkData,
  travel_up: number[],
  travel_down: number[],
  M: number,
  weights: Weights
): OverDelayVars {
  const isUpstream = direction === "up";
  const i = isUpstream ? i_pair : data.intersections.length - 2 - i_pair;
  const j = i + 1;

  const cycle = data.intersections[i].cycle_up;
  const travelTime = isUpstream ? travel_up[i] : travel_down[i];

  const greenPhaseI = isUpstream
    ? data.intersections[i].green_up[0]
    : data.intersections[i].green_down[0];
  const greenPhaseJ = isUpstream
    ? data.intersections[j].green_up[0]
    : data.intersections[j].green_down[0];

  const overlapName = `overlap_${direction}_${i}_${j}`;
  const avgDelayName = `delay_${direction}_${i}_${j}`;
  const maxDelayName = `max_delay_${direction}_${i}_${j}`;

  model.vars[overlapName] = { obj: isUpstream ? weights.overlap_up : weights.overlap_down };
  model.vars[avgDelayName] = { obj: isUpstream ? weights.avg_delay_up : weights.avg_delay_down };
  model.vars[maxDelayName] = { obj: isUpstream ? weights.max_delay_up : weights.max_delay_down };

  const offI = `off_${i}`;
  const offJ = `off_${j}`;

  model.constraints[`overlap_constr1_${direction}_${i}_${j}`] = {
    vars: {
      [overlapName]: 1,
      [offI]: 1,
      [offJ]: -1,
    },
    bnds: { type: "lb", ub: Infinity, lb: greenPhaseI.start + travelTime - greenPhaseJ.start - greenPhaseJ.duration },
  };

  model.constraints[`overlap_constr2_${direction}_${i}_${j}`] = {
    vars: {
      [overlapName]: 1,
      [offI]: 1,
      [offJ]: -1,
    },
    bnds: { type: "ub", lb: -Infinity, ub: greenPhaseI.start + travelTime - greenPhaseJ.start },
  };

  model.constraints[`overlap_non_neg_${direction}_${i}_${j}`] = {
    vars: {
      [overlapName]: 1,
    },
    bnds: { type: "lb", ub: Infinity, lb: 0 },
  };

  model.constraints[`delay_constr1_${direction}_${i}_${j}`] = {
    vars: {
      [avgDelayName]: 1,
      [offI]: 1,
      [offJ]: -1,
    },
    bnds: { type: "lb", ub: Infinity, lb: greenPhaseI.start + travelTime - greenPhaseJ.start - M },
  };

  model.constraints[`delay_constr2_${direction}_${i}_${j}`] = {
    vars: {
      [avgDelayName]: 1,
      [offI]: 1,
      [offJ]: -1,
    },
    bnds: { type: "ub", lb: -Infinity, ub: greenPhaseI.start + travelTime - greenPhaseJ.start + M },
  };

  model.constraints[`delay_non_neg_${direction}_${i}_${j}`] = {
    vars: {
      [avgDelayName]: 1,
    },
    bnds: { type: "lb", ub: Infinity, lb: 0 },
  };

  model.constraints[`max_delay_constr1_${direction}_${i}_${j}`] = {
    vars: {
      [maxDelayName]: 1,
      [offI]: 1,
      [offJ]: -1,
    },
    bnds: { type: "lb", ub: Infinity, lb: greenPhaseI.start + travelTime - greenPhaseJ.start - greenPhaseJ.duration },
  };

  model.constraints[`max_delay_constr2_${direction}_${i}_${j}`] = {
    vars: {
      [maxDelayName]: 1,
      [offI]: 1,
      [offJ]: -1,
    },
    bnds: { type: "ub", lb: -Infinity, ub: greenPhaseI.start + travelTime - greenPhaseJ.start + cycle - greenPhaseJ.duration },
  };

  return { overlapName, avgDelayName, maxDelayName };
}

function computeBaseline(
  data: NetworkData,
  weights: Weights,
  M: number
): RunResult {
  const numIntersections = data.intersections.length;
  return {
    status: "Success",
    offsets: new Array(numIntersections).fill(0),
    objectiveValue: 0,
    overlap_up: new Array(numIntersections - 1).fill(0),
    avg_delay_up: new Array(numIntersections - 1).fill(0),
    max_delay_up: new Array(numIntersections - 1).fill(0),
    overlap_down: new Array(numIntersections - 1).fill(0),
    avg_delay_down: new Array(numIntersections - 1).fill(0),
    max_delay_down: new Array(numIntersections - 1).fill(0),
    corridorBW_up: 0,
    corridorBW_down: 0,
    chain_corridorBW_up: 0,
    chain_corridorBW_down: 0,
  };
}

function greenWaveOptimization(
  data: NetworkData,
  weights: Weights,
  M: number
): { baseline_results: RunResult; optimized_results: RunResult } {
  const numIntersections = data.intersections.length;

  const model: any = {
    objective: {
      direction: "minimize",
    },
    vars: {},
    constraints: {},
    options: {
      tmlim: 60,
    },
  };

  for (let i = 0; i < numIntersections; i++) {
    const offName = `off_${i}`;
    model.vars[offName] = { obj: 0, bnds: { min: 0, max: data.intersections[i].cycle_up } };
  }

  model.constraints["first_offset_fixed"] = {
    vars: { off_0: 1 },
    bnds: { min: 0, max: 0 },
  };

  const travel_up: number[] = [];
  const travel_down: number[] = [];

  for (let i = 0; i < numIntersections - 1; i++) {
    const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
    travel_up.push(Math.round((dist * 3.6) / data.travel.speedUp));
    travel_down.push(Math.round((dist * 3.6) / data.travel.speedDown));
  }

  const overlapUpVars: string[] = [];
  const overlapDownVars: string[] = [];
  const avgDelayUpVars: string[] = [];
  const avgDelayDownVars: string[] = [];
  const maxDelayUpVars: string[] = [];
  const maxDelayDownVars: string[] = [];

  for (let i = 0; i < numIntersections - 1; i++) {
    const {
      overlapName: overlapUpName,
      avgDelayName: avgDelayUpName,
      maxDelayName: maxDelayUpName,
    } = defineOverlapAndDelay(model, i, "up", data, travel_up, travel_down, M, weights);
    overlapUpVars.push(overlapUpName);
    avgDelayUpVars.push(avgDelayUpName);
    maxDelayUpVars.push(maxDelayUpName);

    const {
      overlapName: overlapDownName,
      avgDelayName: avgDelayDownName,
      maxDelayName: maxDelayDownName,
    } = defineOverlapAndDelay(model, i, "down", data, travel_up, travel_down, M, weights);
    overlapDownVars.push(overlapDownName);
    avgDelayDownVars.push(avgDelayDownName);
    maxDelayDownVars.push(maxDelayDownName);
  }

  const results = glpk.solve(model, { msglev: glpk.GLP_MSG_OFF });

  const offsets: number[] = [];
  for (let i = 0; i < numIntersections; i++) {
    const offName = `off_${i}`;
    offsets.push(results.vars[offName].prim);
  }

  const extractValues = (vars: string[]): number[] => vars.map((v) => results.vars[v].prim);

  const overlap_up = extractValues(overlapUpVars);
  const avg_delay_up = extractValues(avgDelayUpVars);
  const max_delay_up = extractValues(maxDelayUpVars);
  const overlap_down = extractValues(overlapDownVars);
  const avg_delay_down = extractValues(avgDelayDownVars);
  const max_delay_down = extractValues(maxDelayDownVars);

  const optimized_results: RunResult = {
    status: results.result.code === glpk.GLP_OPT ? "Optimal" : "Suboptimal",
    offsets,
    objectiveValue: results.result.z,
    overlap_up,
    avg_delay_up,
    max_delay_up,
    overlap_down,
    avg_delay_down,
    max_delay_down,
    corridorBW_up: 0,
    corridorBW_down: 0,
    chain_corridorBW_up: 0,
    chain_corridorBW_down: 0,
  };

  const baseline_results: RunResult = {
    status: "Success",
    offsets: new Array(numIntersections).fill(0),
    objectiveValue: 0,
    overlap_up: new Array(numIntersections - 1).fill(0),
    avg_delay_up: new Array(numIntersections - 1).fill(0),
    max_delay_up: new Array(numIntersections - 1).fill(0),
    overlap_down: new Array(numIntersections - 1).fill(0),
    avg_delay_down: new Array(numIntersections - 1).fill(0),
    max_delay_down: new Array(numIntersections - 1).fill(0),
    corridorBW_up: 0,
    corridorBW_down: 0,
    chain_corridorBW_up: 0,
    chain_corridorBW_down: 0,
  };

  return { baseline_results, optimized_results };
}

function chainPostProc(run: RunResult, data: NetworkData): void {
}

function chainBWUp(
  offsets: number[],
  data: NetworkData,
  travelUp: number[]
): number {
  return 0;
}

function chainBWDown(
  offsets: number[],
  data: NetworkData,
  travelDown: number[]
): number {
  return 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      throw new Error(`HTTP method ${req.method} is not supported.`);
    }

    const body = await req.json();
    const { data, weights, manualOffsets } = body;

    if (!data || !weights) {
      throw new Error('Missing required fields: data or weights');
    }

    const baselineRes = computeBaseline(data, weights, 3);
    const baselineBandwidth = chainBWUp(
      baselineRes.offsets,
      data,
      data.intersections.map((_, i) => {
        if (i < data.intersections.length - 1) {
          const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
          return Math.round((dist * 3.6) / data.travel.speedUp);
        }
        return 0;
      })
    );

    const { baseline_results, optimized_results } = greenWaveOptimization(data, weights, 3);

    let manual_results = null;
    if (manualOffsets && manualOffsets.length === data.intersections.length) {
      const normalizedOffsets = [...manualOffsets];
      normalizedOffsets[0] = 0;
      
      const chainUp = chainBWUp(
        normalizedOffsets,
        data,
        data.intersections.map((_, i) => {
          if (i < data.intersections.length - 1) {
            const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
            return Math.round((dist * 3.6) / data.travel.speedUp);
          }
          return 0;
        })
      );
      
      const chainDown = chainBWDown(
        normalizedOffsets,
        data,
        data.intersections.map((_, i) => {
          if (i < data.intersections.length - 1) {
            const dist = data.intersections[i + 1].distance - data.intersections[i].distance;
            return Math.round((dist * 3.6) / data.travel.speedDown);
          }
          return 0;
        })
      );

      manual_results = {
        status: "Success",
        offsets: normalizedOffsets,
        objectiveValue: 0,
        overlap_up: [],
        avg_delay_up: [],
        max_delay_up: [],
        overlap_down: [],
        avg_delay_down: [],
        max_delay_down: [],
        corridorBW_up: chainUp,
        corridorBW_down: chainDown,
        chain_corridorBW_up: chainUp,
        chain_corridorBW_down: chainDown
      };
    }

    const response = {
      baseline_results,
      optimized_results,
      manual_results
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        type: error.constructor.name
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});
