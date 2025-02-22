
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BIG_NEG = -9999999;
const BIG_POS = 9999999;

interface GreenPhase {
  start: number;
  duration: number;
  speed: number;
}

interface IntersectionInput {
  id: number;
  distance: number;
  cycle: number;
  green_up: GreenPhase[];
  green_down: GreenPhase[];
}

interface Intersection {
  id: number;
  distance: number;
  cycle: number;
  start_up_raw: number;
  duration_up: number;
  speed_up: number;
  start_down_raw: number;
  duration_down: number;
  speed_down: number;
  start_up_actual?: number;
  end_up_actual?: number;
  start_down_actual?: number;
  end_down_actual?: number;
}

interface NetworkData {
  intersections: IntersectionInput[];
}

interface RunResult {
  status: string;
  offsets: number[];
  objective_value: number;
  pair_bandwidth_up: number[];
  avg_delay_up: number[];
  max_delay_up: number[];
  pair_bandwidth_down: number[];
  avg_delay_down: number[];
  max_delay_down: number[];
  diagonal_points: {
    up: DiagonalPoint[];
    down: DiagonalPoint[];
  };
  corridor_bandwidth_up: number;
  corridor_bandwidth_down: number;
}

interface DiagonalPoint {
  junction: number;
  low: number;
  top: number;
}

interface OptimizationWeights {
  pair_bandwidth_up: number;
  pair_bandwidth_down: number;
  avg_delay_up: number;
  max_delay_up: number;
  avg_delay_down: number;
  max_delay_down: number;
  corridor_bandwidth_up: number;
  corridor_bandwidth_down: number;
}

function computePairMetrics(
  startUpN: number,
  endUpN: number,
  startDownN: number,
  endDownN: number,
  startUpNextRaw: number,
  durationUpNext: number,
  startDownNextRaw: number,
  durationDownNext: number,
  offsetNext: number,
  travelTimeUp: number,
  travelTimeDown: number,
  corridorUpPrev: [number, number],
  corridorDownPrev: [number, number],
  weights: OptimizationWeights
): [number, Record<string, number>, [number, number], [number, number]] {
  const startUpNext = startUpNextRaw + offsetNext;
  const endUpNext = startUpNext + durationUpNext;
  const startDownNext = startDownNextRaw + offsetNext;
  const endDownNext = startDownNext + durationDownNext;

  // Up direction reflection
  const refUpStart = startUpN + travelTimeUp;
  const refUpEnd = endUpN + travelTimeUp;
  const pairBwUp = Math.max(0, Math.min(refUpEnd, endUpNext) - Math.max(refUpStart, startUpNext));

  // Down direction reflection
  const refDownStart = startDownN + travelTimeDown;
  const refDownEnd = endDownN + travelTimeDown;
  const pairBwDown = Math.max(0, Math.min(refDownEnd, endDownNext) - Math.max(refDownStart, startDownNext));

  // Delays in Up direction
  const tStartUp = Math.ceil(startUpN);
  const tEndUp = Math.floor(endUpN);
  let sumDelayUp = 0;
  let maxDelayUp = 0;
  let countUp = 0;

  for (let t = tStartUp; t < tEndUp; t++) {
    const arrival = t + travelTimeUp;
    let delay = 0;
    if (arrival < startUpNext) {
      delay = startUpNext - arrival;
    } else if (arrival > endUpNext) {
      delay = arrival - endUpNext;
    }
    sumDelayUp += delay;
    maxDelayUp = Math.max(maxDelayUp, delay);
    countUp++;
  }

  const avgDelayUp = countUp > 0 ? sumDelayUp / countUp : 0;

  // Delays in Down direction
  const tStartDown = Math.ceil(startDownN);
  const tEndDown = Math.floor(endDownN);
  let sumDelayDown = 0;
  let maxDelayDown = 0;
  let countDown = 0;

  for (let t = tStartDown; t < tEndDown; t++) {
    const arrival = t + travelTimeDown;
    let delay = 0;
    if (arrival < startDownNext) {
      delay = startDownNext - arrival;
    } else if (arrival > endDownNext) {
      delay = arrival - endDownNext;
    }
    sumDelayDown += delay;
    maxDelayDown = Math.max(maxDelayDown, delay);
    countDown++;
  }

  const avgDelayDown = countDown > 0 ? sumDelayDown / countDown : 0;

  // Update corridor Up
  const localUpLow = Math.max(refUpStart, startUpNext);
  const localUpHigh = Math.min(refUpEnd, endUpNext);
  const corridorUpLowNew = Math.max(corridorUpPrev[0], localUpLow);
  const corridorUpHighNew = Math.min(corridorUpPrev[1], localUpHigh);
  const corridorUpValNew = Math.max(0, corridorUpHighNew - corridorUpLowNew);

  // Update corridor Down
  const localDownLow = Math.max(refDownStart, startDownNext);
  const localDownHigh = Math.min(refDownEnd, endDownNext);
  const corridorDownLowNew = Math.max(corridorDownPrev[0], localDownLow);
  const corridorDownHighNew = Math.min(corridorDownPrev[1], localDownHigh);
  const corridorDownValNew = Math.max(0, corridorDownHighNew - corridorDownLowNew);

  // Objective function
  let cost = 0;
  cost -= weights.pair_bandwidth_up * pairBwUp;
  cost -= weights.pair_bandwidth_down * pairBwDown;
  cost += weights.avg_delay_up * avgDelayUp;
  cost += weights.max_delay_up * maxDelayUp;
  cost += weights.avg_delay_down * avgDelayDown;
  cost += weights.max_delay_down * maxDelayDown;
  cost -= weights.corridor_bandwidth_up * corridorUpValNew;
  cost -= weights.corridor_bandwidth_down * corridorDownValNew;

  const metrics = {
    pair_overlap_up: pairBwUp,
    pair_overlap_down: pairBwDown,
    avg_delay_up: avgDelayUp,
    max_delay_up: maxDelayUp,
    avg_delay_down: avgDelayDown,
    max_delay_down: maxDelayDown
  };

  return [cost, metrics, [corridorUpLowNew, corridorUpHighNew], [corridorDownLowNew, corridorDownHighNew]];
}

function computeDiagonalPointsUp(intersectionsList: Intersection[], offsets: number[], travelTimes: [number, number][]): DiagonalPoint[] {
  const n = intersectionsList.length;
  const diagUp: DiagonalPoint[] = [];
  if (n === 0) return diagUp;

  const startUp0 = intersectionsList[0].start_up_raw + offsets[0];
  const endUp0 = startUp0 + intersectionsList[0].duration_up;
  let waveLow = startUp0;
  let waveHigh = endUp0;

  diagUp.push({
    junction: intersectionsList[0].id,
    low: waveLow,
    top: waveHigh
  });

  for (let i = 1; i < n; i++) {
    const tUp = travelTimes[i - 1][0];
    waveLow += tUp;
    waveHigh += tUp;

    const suI = intersectionsList[i].start_up_raw + offsets[i];
    const euI = suI + intersectionsList[i].duration_up;

    waveLow = Math.max(waveLow, suI);
    waveHigh = Math.min(waveHigh, euI);

    diagUp.push({
      junction: intersectionsList[i].id,
      low: waveLow,
      top: waveHigh
    });
  }

  return diagUp;
}

function computeDiagonalPointsDown(intersectionsList: Intersection[], offsets: number[], travelTimes: [number, number][]): DiagonalPoint[] {
  const n = intersectionsList.length;
  const diagDown: DiagonalPoint[] = [];
  if (n === 0) return diagDown;

  const startDown0 = intersectionsList[0].start_down_raw + offsets[0];
  const endDown0 = startDown0 + intersectionsList[0].duration_down;
  let waveLow = startDown0;
  let waveHigh = endDown0;

  diagDown.push({
    junction: intersectionsList[0].id,
    low: waveLow,
    top: waveHigh
  });

  for (let i = 1; i < n; i++) {
    const tDown = travelTimes[i - 1][1];
    waveLow += tDown;
    waveHigh += tDown;

    const sdI = intersectionsList[i].start_down_raw + offsets[i];
    const edI = sdI + intersectionsList[i].duration_down;

    waveLow = Math.max(waveLow, sdI);
    waveHigh = Math.min(waveHigh, edI);

    diagDown.push({
      junction: intersectionsList[i].id,
      low: waveLow,
      top: waveHigh
    });
  }

  return diagDown;
}

function computeSolutionMetrics(
  intersectionsList: Intersection[],
  offsets: number[],
  travelTimes: [number, number][],
  weights: OptimizationWeights
): RunResult {
  const n = intersectionsList.length;

  // Prepare actual start/end times
  for (let i = 0; i < n; i++) {
    const suRaw = intersectionsList[i].start_up_raw;
    const du = intersectionsList[i].duration_up;
    const sdRaw = intersectionsList[i].start_down_raw;
    const dd = intersectionsList[i].duration_down;
    const off = offsets[i];

    intersectionsList[i].start_up_actual = suRaw + off;
    intersectionsList[i].end_up_actual = suRaw + off + du;
    intersectionsList[i].start_down_actual = sdRaw + off;
    intersectionsList[i].end_down_actual = sdRaw + off + dd;
  }

  const pairBandwidthUp: number[] = [];
  const pairBandwidthDown: number[] = [];
  const avgDelayUp: number[] = [];
  const maxDelayUp: number[] = [];
  const avgDelayDown: number[] = [];
  const maxDelayDown: number[] = [];
  let objectiveValue = 0;

  let corridorUpRange: [number, number] = [BIG_NEG, BIG_POS];
  let corridorDownRange: [number, number] = [BIG_NEG, BIG_POS];

  for (let i = 0; i < n - 1; i++) {
    const suN = intersectionsList[i].start_up_actual!;
    const euN = intersectionsList[i].end_up_actual!;
    const sdN = intersectionsList[i].start_down_actual!;
    const edN = intersectionsList[i].end_down_actual!;

    const suNextRaw = intersectionsList[i + 1].start_up_raw;
    const duNext = intersectionsList[i + 1].duration_up;
    const sdNextRaw = intersectionsList[i + 1].start_down_raw;
    const ddNext = intersectionsList[i + 1].duration_down;
    const offNext = offsets[i + 1];

    const [tUp, tDown] = travelTimes[i];

    const [costPair, metricsPair, corrUpNew, corrDownNew] = computePairMetrics(
      suN, euN, sdN, edN,
      suNextRaw, duNext,
      sdNextRaw, ddNext,
      offNext, tUp, tDown,
      corridorUpRange,
      corridorDownRange,
      weights
    );

    objectiveValue += costPair;

    pairBandwidthUp.push(metricsPair.pair_overlap_up);
    pairBandwidthDown.push(metricsPair.pair_overlap_down);
    avgDelayUp.push(metricsPair.avg_delay_up);
    maxDelayUp.push(metricsPair.max_delay_up);
    avgDelayDown.push(metricsPair.avg_delay_down);
    maxDelayDown.push(metricsPair.max_delay_down);

    corridorUpRange = corrUpNew;
    corridorDownRange = corrDownNew;
  }

  const corridorBwUp = Math.max(0, corridorUpRange[1] - corridorUpRange[0]);
  const corridorBwDown = Math.max(0, corridorDownRange[1] - corridorDownRange[0]);

  const diagUp = computeDiagonalPointsUp(intersectionsList, offsets, travelTimes);
  const diagDown = computeDiagonalPointsDown(intersectionsList, offsets, travelTimes);

  return {
    status: "Optimal",
    offsets,
    objective_value: objectiveValue,
    pair_bandwidth_up: pairBandwidthUp,
    avg_delay_up: avgDelayUp,
    max_delay_up: maxDelayUp,
    pair_bandwidth_down: pairBandwidthDown,
    avg_delay_down: avgDelayDown,
    max_delay_down: maxDelayDown,
    diagonal_points: {
      up: diagUp,
      down: diagDown
    },
    corridor_bandwidth_up: corridorBwUp,
    corridor_bandwidth_down: corridorBwDown
  };
}

function applyOffsetModulo(off: number, cycle: number): number {
  return ((off % cycle) + cycle) % cycle;
}

function bruteForceSolve(
  intersectionsList: Intersection[],
  travelTimes: [number, number][],
  weights: OptimizationWeights
): number[] {
  const n = intersectionsList.length;
  let bestOffsets = new Array(n).fill(0);
  let bestCost = Infinity;

  function dfs(i: number, currentOffsets: number[]) {
    if (i === n) {
      const sol = computeSolutionMetrics(intersectionsList, currentOffsets, travelTimes, weights);
      const cost = sol.objective_value;
      if (cost < bestCost) {
        bestCost = cost;
        bestOffsets = [...currentOffsets];
      }
      return;
    }
    if (i === 0) {
      dfs(i + 1, currentOffsets);
    } else {
      const cyc = intersectionsList[i].cycle;
      for (let offCandidate = -cyc; offCandidate <= 2 * cyc; offCandidate++) {
        currentOffsets[i] = offCandidate;
        dfs(i + 1, currentOffsets);
      }
      currentOffsets[i] = 0;
    }
  }

  const currentOffsets = new Array(n).fill(0);
  dfs(0, currentOffsets);

  return bestOffsets.map((off, i) => applyOffsetModulo(off, intersectionsList[i].cycle));
}

function solveGreenWave(inputData: {
  mode: "optimization" | "manual";
  data: NetworkData;
  weights: OptimizationWeights;
  manual_offsets?: number[];
}): {
  baseline_results: RunResult;
  optimization_results: RunResult;
} {
  const { mode, data, weights } = inputData;
  const interDef = data.intersections;

  // Build internal structure
  const intersectionsList: Intersection[] = interDef.map(c => ({
    id: c.id,
    distance: c.distance,
    cycle: c.cycle,
    start_up_raw: c.green_up[0].start,
    duration_up: c.green_up[0].duration,
    speed_up: c.green_up[0].speed,
    start_down_raw: c.green_down[0].start,
    duration_down: c.green_down[0].duration,
    speed_down: c.green_down[0].speed
  }));

  // Calculate travel times
  const travelTimes: [number, number][] = [];
  for (let i = 0; i < intersectionsList.length - 1; i++) {
    const dist = Math.abs(intersectionsList[i + 1].distance - intersectionsList[i].distance);
    const spUpMS = intersectionsList[i].speed_up > 0 ? intersectionsList[i].speed_up / 3.6 : 1;
    const spDownMS = intersectionsList[i].speed_down > 0 ? intersectionsList[i].speed_down / 3.6 : 1;
    const tUp = dist / spUpMS;
    const tDown = dist / spDownMS;
    travelTimes.push([tUp, tDown]);
  }

  // Baseline (all offsets = 0)
  const baselineOffsets = new Array(intersectionsList.length).fill(0);
  const baselineSol = computeSolutionMetrics(intersectionsList, baselineOffsets, travelTimes, weights);
  baselineSol.status = "Optimal";

  let optSol: RunResult;
  if (mode === "manual") {
    const manualOffsetsIn = inputData.manual_offsets || new Array(intersectionsList.length).fill(0);
    const finalManual = manualOffsetsIn.map((off, i) => 
      applyOffsetModulo(off, intersectionsList[i].cycle)
    );
    optSol = computeSolutionMetrics(intersectionsList, finalManual, travelTimes, weights);
    optSol.status = "Optimal";
  } else {
    const bestOffs = bruteForceSolve(intersectionsList, travelTimes, weights);
    optSol = computeSolutionMetrics(intersectionsList, bestOffs, travelTimes, weights);
    optSol.status = "Optimal";
  }

  return {
    baseline_results: baselineSol,
    optimization_results: optSol
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const body = await req.json();
    console.log("Received request body:", body);
    
    const results = solveGreenWave(body);
    console.log("Optimization results:", results);
    
    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Error in optimization:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400
    });
  }
});
