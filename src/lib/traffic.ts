
import { NetworkData, Weights, RunResult, DiagonalPoint } from '../types/traffic';

// Constants
const BIG_NEG = -9999999;
const BIG_POS = 9999999;

export async function greenWaveOptimization(
  networkData: NetworkData, 
  weights: Weights,
  manualOffsets?: number[]
): Promise<{
  baseline_results: RunResult;
  optimized_results: RunResult;
  manual_results?: RunResult;
}> {
  const mode = manualOffsets ? "manual" : "optimization";
  
  const inputData = {
    mode,
    data: {
      intersections: networkData.intersections.map(intersection => ({
        id: intersection.id,
        distance: intersection.distance,
        green_up: intersection.green_up,
        green_down: intersection.green_down,
        cycle: intersection.cycle
      }))
    },
    weights: {
      pair_bandwidth_up: weights.overlap_up,
      pair_bandwidth_down: weights.overlap_down,
      avg_delay_up: weights.avg_delay_up,
      max_delay_up: weights.max_delay_up,
      avg_delay_down: weights.avg_delay_down,
      max_delay_down: weights.max_delay_down,
      corridor_bandwidth_up: weights.corridor_up,
      corridor_bandwidth_down: weights.corridor_down
    },
    manual_offsets: manualOffsets
  };

  const results = solveGreenWave(inputData);
  
  const convertToRunResult = (result: ResultStructure): RunResult => ({
    status: result.status,
    offsets: result.offsets,
    objective_value: result.objective_value,
    corridorBW_up: result.corridor_bandwidth_up,
    corridorBW_down: result.corridor_bandwidth_down,
    local_up: result.pair_bandwidth_up,
    local_down: result.pair_bandwidth_down,
    avg_delay_up: result.avg_delay_up,
    avg_delay_down: result.avg_delay_down,
    max_delay_up: result.max_delay_up,
    max_delay_down: result.max_delay_down,
    diagonal_points: result.diagonal_points
  });

  const output: {
    baseline_results: RunResult;
    optimized_results: RunResult;
    manual_results?: RunResult;
  } = {
    baseline_results: convertToRunResult(results.baseline_results),
    optimized_results: convertToRunResult(results.optimization_results)
  };

  if (mode === "manual") {
    output.manual_results = convertToRunResult(results.optimization_results);
  }

  return output;
}

interface GreenPhase {
  start: number;
  duration: number;
  speed: number;
}

interface IntersectionDef {
  id: number;
  distance: number;
  green_up: GreenPhase[];
  green_down: GreenPhase[];
  cycle: number;
}

interface InputData {
  mode: string;
  data: {
    intersections: IntersectionDef[];
  };
  weights: Record<string, number>;
  manual_offsets?: number[];
}

interface IntersectionItem {
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

interface DiagPoint {
  pairIndex: number;
  direction: "up" | "down";
  phaseIndex: number;
  targetLow: number;
  targetHigh: number;
  sourceLow: number;
  sourceHigh: number;
  corridor: boolean;
}

interface ResultStructure {
  status: string;
  offsets: number[];
  objective_value: number;
  pair_bandwidth_up: number[];
  avg_delay_up: number[];
  max_delay_up: number[];
  pair_bandwidth_down: number[];
  avg_delay_down: number[];
  max_delay_down: number[];
  diagonal_points: DiagPoint[];
  corridor_bandwidth_up: number;
  corridor_bandwidth_down: number;
}

interface SolveGreenWaveOutput {
  baseline_results: ResultStructure;
  optimization_results: ResultStructure;
}

/**
 * computePairMetrics
 * מחשב מדדים לזוג צמתים (N, N+1), מחזיר עלות ומדדים.
 */
function computePairMetrics(
  start_up_N: number, end_up_N: number,
  start_down_N: number, end_down_N: number,
  start_up_next_raw: number, duration_up_next: number,
  start_down_next_raw: number, duration_down_next: number,
  offset_next: number,
  travel_time_up: number,
  travel_time_down: number,
  corridor_up_prev: [number, number],
  corridor_down_prev: [number, number],
  weights: Record<string, number>
): [number, Record<string, number>, [number, number], [number, number]] {

  const w_pair_bw_up   = weights["pair_bandwidth_up"]   ?? 0;
  const w_pair_bw_down = weights["pair_bandwidth_down"] ?? 0;
  const w_avg_up       = weights["avg_delay_up"]        ?? 0;
  const w_max_up       = weights["max_delay_up"]        ?? 0;
  const w_avg_down     = weights["avg_delay_down"]      ?? 0;
  const w_max_down     = weights["max_delay_down"]      ?? 0;
  const w_corr_up      = weights["corridor_bandwidth_up"]   ?? 0;
  const w_corr_down    = weights["corridor_bandwidth_down"] ?? 0;

  const start_up_next   = start_up_next_raw   + offset_next;
  const end_up_next     = start_up_next       + duration_up_next;
  const start_down_next = start_down_next_raw + offset_next;
  const end_down_next   = start_down_next     + duration_down_next;

  const pair_bw_up = Math.max(0, Math.min(end_up_next, end_up_N) - Math.max(start_up_next, start_up_N));

  // חישוב עבור כיוון DOWN
  const ref_down_start = start_down_next + travel_time_down;
  const ref_down_end   = end_down_next + travel_time_down;
  const pair_bw_down = Math.max(
    0,
    Math.min(ref_down_end, end_down_N) - Math.max(ref_down_start, start_down_N)
  );

  const t_start_up = Math.ceil(start_up_N);
  const t_end_up   = Math.floor(end_up_N);
  let sum_delay_up = 0.0;
  let max_delay_up = 0.0;
  let count_up = 0;

  for (let t = t_start_up; t < t_end_up; t++) {
    const arrival = t + travel_time_up;
    let delay = 0.0;
    if (arrival < start_up_next) {
      delay = start_up_next - arrival;
    } else if (arrival > end_up_next) {
      delay = arrival - end_up_next;
    }
    sum_delay_up += delay;
    if (delay > max_delay_up) {
      max_delay_up = delay;
    }
    count_up++;
  }
  let avg_delay_up = 0.0;
  if (count_up > 0) {
    avg_delay_up = sum_delay_up / count_up;
  }

  // חישוב עיכוב עבור כיוון DOWN: הלולאה נעשית על חלון ירוק של צומת N+1 (source)
  const t_start_down = Math.ceil(start_down_next);
  const t_end_down   = Math.floor(end_down_next);
  let sum_delay_down = 0.0;
  let max_delay_down = 0.0;
  let count_down = 0;

  for (let t = t_start_down; t < t_end_down; t++) {
    const arrival = t + travel_time_down;
    let delay = 0.0;
    if (arrival < start_down_N) {
      delay = start_down_N - arrival;
    } else if (arrival > end_down_N) {
      delay = arrival - end_down_N;
    }
    sum_delay_down += delay;
    if (delay > max_delay_down) {
      max_delay_down = delay;
    }
    count_down++;
  }
  let avg_delay_down = 0.0;
  if (count_down > 0) {
    avg_delay_down = sum_delay_down / count_down;
  }

  const local_up_low  = Math.max(start_up_N, start_up_next);
  const local_up_high = Math.min(end_up_N,   end_up_next);
  const corridor_up_low_new  = Math.max(corridor_up_prev[0], local_up_low);
  const corridor_up_high_new = Math.min(corridor_up_prev[1], local_up_high);
  const corridor_up_val_new  = Math.max(0, corridor_up_high_new - corridor_up_low_new);

  const local_down_low  = Math.max(start_down_N, start_down_next);
  const local_down_high = Math.min(end_down_N,   end_down_next);
  const corridor_down_low_new  = Math.max(corridor_down_prev[0], local_down_low);
  const corridor_down_high_new = Math.min(corridor_down_prev[1], local_down_high);
  const corridor_down_val_new  = Math.max(0, corridor_down_high_new - corridor_down_low_new);

  let cost = 0;
  cost -= w_pair_bw_up * pair_bw_up;
  cost -= w_pair_bw_down * pair_bw_down;
  cost += w_avg_up   * avg_delay_up;
  cost += w_max_up   * max_delay_up;
  cost += w_avg_down * avg_delay_down;
  cost += w_max_down * max_delay_down;
  cost -= w_corr_up   * corridor_up_val_new;
  cost -= w_corr_down * corridor_down_val_new;

  const metrics: Record<string, number> = {
    "pair_overlap_up": pair_bw_up,
    "pair_overlap_down": pair_bw_down,
    "avg_delay_up": avg_delay_up,
    "max_delay_up": max_delay_up,
    "avg_delay_down": avg_delay_down,
    "max_delay_down": max_delay_down
  };

  return [
    cost,
    metrics,
    [corridor_up_low_new,   corridor_up_high_new],
    [corridor_down_low_new, corridor_down_high_new]
  ];
}

/**
 * diagonal_points בכיוון up
 */
function computeDiagonalPointsUp(
  intersectionsList: IntersectionItem[],
  offsets: number[],
  travelTimes: [number, number][]
): DiagonalPoint[] {
  const n = intersectionsList.length;
  const diag_up: DiagonalPoint[] = [];
  if (n === 0) return diag_up;

  const start_up_0 = intersectionsList[0].start_up_raw + offsets[0];
  const end_up_0   = start_up_0 + intersectionsList[0].duration_up;
  let wave_low  = start_up_0;
  let wave_high = end_up_0;

  diag_up.push({
    pairIndex: 0,
    direction: "up",
    phaseIndex: 0,
    targetLow: wave_low,
    targetHigh: wave_high,
    sourceLow: wave_low,
    sourceHigh: wave_high,
    corridor: true
  });

  for (let i = 1; i < n; i++) {
    const t_up = travelTimes[i-1][0];
    wave_low  += t_up;
    wave_high += t_up;

    const su_i = intersectionsList[i].start_up_raw + offsets[i];
    const eu_i = su_i + intersectionsList[i].duration_up;

    wave_low  = Math.max(wave_low, su_i);
    wave_high = Math.min(wave_high, eu_i);

    diag_up.push({
      pairIndex: i,
      direction: "up",
      phaseIndex: 0,
      targetLow: wave_low,
      targetHigh: wave_high,
      sourceLow: su_i,
      sourceHigh: eu_i,
      corridor: true
    });
  }

  return diag_up;
}

/**
 * diagonal_points בכיוון down
 */
function computeDiagonalPointsDown(
  intersectionsList: IntersectionItem[],
  offsets: number[],
  travelTimes: [number, number][]
): DiagonalPoint[] {
  const n = intersectionsList.length;
  const diag_down: DiagonalPoint[] = [];
  if (n === 0) return diag_down;

  const start_down_0 = intersectionsList[0].start_down_raw + offsets[0];
  const end_down_0   = start_down_0 + intersectionsList[0].duration_down;
  let wave_low  = start_down_0;
  let wave_high = end_down_0;

  diag_down.push({
    pairIndex: 0,
    direction: "down",
    phaseIndex: 0,
    targetLow: wave_low,
    targetHigh: wave_high,
    sourceLow: wave_low,
    sourceHigh: wave_high,
    corridor: true
  });

  for (let i = 1; i < n; i++) {
    const t_down = travelTimes[i-1][1];
    wave_low  += t_down;
    wave_high += t_down;

    const sd_i = intersectionsList[i].start_down_raw + offsets[i];
    const ed_i = sd_i + intersectionsList[i].duration_down;

    wave_low  = Math.max(wave_low, sd_i);
    wave_high = Math.min(wave_high, ed_i);

    diag_down.push({
      pairIndex: i,
      direction: "down",
      phaseIndex: 0,
      targetLow: wave_low,
      targetHigh: wave_high,
      sourceLow: sd_i,
      sourceHigh: ed_i,
      corridor: true
    });
  }
  return diag_down;
}

/**
 * computeSolutionMetrics
 * מחשב את כל המדדים עבור רשימת צמתים ואופסטים נתונים
 */
function computeSolutionMetrics(
  intersectionsList: IntersectionItem[],
  offsets: number[],
  travelTimes: [number, number][],
  weights: Record<string, number>
): ResultStructure {
  const n = intersectionsList.length;

  for (let i = 0; i < n; i++) {
    const su_raw = intersectionsList[i].start_up_raw;
    const du     = intersectionsList[i].duration_up;
    const sd_raw = intersectionsList[i].start_down_raw;
    const dd     = intersectionsList[i].duration_down;
    const off    = offsets[i];

    intersectionsList[i].start_up_actual   = su_raw + off;
    intersectionsList[i].end_up_actual     = su_raw + off + du;
    intersectionsList[i].start_down_actual = sd_raw + off;
    intersectionsList[i].end_down_actual   = sd_raw + off + dd;
  }

  const pair_bandwidth_up: number[] = [];
  const pair_bandwidth_down: number[] = [];
  const avg_delay_up: number[] = [];
  const max_delay_up: number[] = [];
  const avg_delay_down: number[] = [];
  const max_delay_down: number[] = [];
  let objective_value = 0.0;

  let corridor_up_range: [number, number]   = [BIG_NEG, BIG_POS];
  let corridor_down_range: [number, number] = [BIG_NEG, BIG_POS];

  for (let i = 0; i < n-1; i++) {
    const suN = intersectionsList[i].start_up_actual!;
    const euN = intersectionsList[i].end_up_actual!;
    const sdN = intersectionsList[i].start_down_actual!;
    const edN = intersectionsList[i].end_down_actual!;

    const su_next_raw = intersectionsList[i+1].start_up_raw;
    const du_next     = intersectionsList[i+1].duration_up;
    const sd_next_raw = intersectionsList[i+1].start_down_raw;
    const dd_next     = intersectionsList[i+1].duration_down;
    const off_next    = offsets[i+1];

    const [t_up, t_down] = travelTimes[i];

    const [cost_pair, metrics_pair, corr_up_new, corr_down_new] = computePairMetrics(
      suN, euN, sdN, edN,
      su_next_raw, du_next,
      sd_next_raw, dd_next,
      off_next, t_up, t_down,
      corridor_up_range, corridor_down_range,
      weights
    );

    objective_value += cost_pair;

    pair_bandwidth_up.push( metrics_pair["pair_overlap_up"] );
    pair_bandwidth_down.push( metrics_pair["pair_overlap_down"] );
    avg_delay_up.push( metrics_pair["avg_delay_up"] );
    max_delay_up.push( metrics_pair["max_delay_up"] );
    avg_delay_down.push( metrics_pair["avg_delay_down"] );
    max_delay_down.push( metrics_pair["max_delay_down"] );

    corridor_up_range   = corr_up_new;
    corridor_down_range = corr_down_new;
  }

  const corridor_bw_up = Math.max(0, corridor_up_range[1]   - corridor_up_range[0]);
  const corridor_bw_down = Math.max(0, corridor_down_range[1] - corridor_down_range[0]);

  const diag_up   = computeDiagonalPointsUp(intersectionsList, offsets, travelTimes);
  const diag_down = computeDiagonalPointsDown(intersectionsList, offsets, travelTimes);

  return {
    status: "Optimal",
    offsets,
    objective_value,
    pair_bandwidth_up,
    avg_delay_up,
    max_delay_up,
    pair_bandwidth_down,
    avg_delay_down,
    max_delay_down,
    diagonal_points: [...diag_up, ...diag_down],
    corridor_bandwidth_up: corridor_bw_up,
    corridor_bandwidth_down: corridor_bw_down
  };
}

/**
 * פונקציה לעשיית mod cycle
 */
function applyOffsetModulo(off: number, cycle: number): number {
  return ((off % cycle) + cycle) % cycle;
}

/**
 * bruteForceOptimize
 * חיפוש גס (Brute Force) על offsets של כל צומת חוץ מהראשון (שהוא 0)
 */
function bruteForceOptimize(
  intersectionsList: IntersectionItem[],
  travelTimes: [number, number][],
  weights: Record<string, number>
): number[] {
  const n = intersectionsList.length;
  let bestOffsets = new Array(n).fill(0);
  let bestCost = Number.POSITIVE_INFINITY;

  function dfs(i: number, currentOffsets: number[]) {
    if (i === n) {
      const sol = computeSolutionMetrics(intersectionsList, currentOffsets, travelTimes, weights);
      const cst = sol.objective_value;
      if (cst < bestCost) {
        bestCost = cst;
        bestOffsets = [...currentOffsets];
      }
      return;
    }

    if (i === 0) {
      dfs(i+1, currentOffsets);
    } else {
      const cyc = intersectionsList[i].cycle;
      for (let offCandidate = -cyc; offCandidate <= 2*cyc; offCandidate++) {
        currentOffsets[i] = offCandidate;
        dfs(i+1, currentOffsets);
      }
      currentOffsets[i] = 0;
    }
  }

  const currentOffsets = new Array(n).fill(0);
  dfs(0, currentOffsets);

  const finalOffsets: number[] = [];
  for (let i=0; i<n; i++) {
    const cyc = intersectionsList[i].cycle;
    finalOffsets.push(applyOffsetModulo(bestOffsets[i], cyc));
  }
  return finalOffsets;
}

/**
 * solveGreenWave - פונקציה ראשית
 */
export function solveGreenWave(inputData: InputData): SolveGreenWaveOutput {
  const mode = inputData.mode ?? "optimization";
  const data = inputData.data;
  const weights = inputData.weights;
  const interDef = data.intersections;

  const intersectionsList: IntersectionItem[] = interDef.map(c => {
    const gup = c.green_up[0];
    const gdn = c.green_down[0];
    return {
      id: c.id,
      distance: c.distance,
      cycle: c.cycle,
      start_up_raw:   gup.start,
      duration_up:    gup.duration,
      speed_up:       gup.speed,
      start_down_raw: gdn.start,
      duration_down:  gdn.duration,
      speed_down:     gdn.speed
    };
  });

  const travelTimes: [number, number][] = [];
  for (let i=0; i<intersectionsList.length-1; i++) {
    const dist = Math.abs(intersectionsList[i+1].distance - intersectionsList[i].distance);

    let sp_up_m_s = intersectionsList[i].speed_up / 3.6;
    if (sp_up_m_s <= 0) { sp_up_m_s = 1; }

    let sp_down_m_s = intersectionsList[i].speed_down / 3.6;
    if (sp_down_m_s <= 0) { sp_down_m_s = 1; }

    const t_up   = dist / sp_up_m_s;
    const t_down = dist / sp_down_m_s;
    travelTimes.push([t_up, t_down]);
  }

  const baselineOffsets = new Array(intersectionsList.length).fill(0);
  const baselineSol = computeSolutionMetrics(intersectionsList, baselineOffsets, travelTimes, weights);
  baselineSol.status = "Optimal";

  let optSol: ResultStructure;
  if (mode === "manual") {
    const manualOffsetsIn = inputData.manual_offsets ?? new Array(intersectionsList.length).fill(0);
    const finalManual: number[] = [];
    for (let i=0; i<intersectionsList.length; i++) {
      const cyc = intersectionsList[i].cycle;
      finalManual.push(applyOffsetModulo(manualOffsetsIn[i], cyc));
    }
    optSol = computeSolutionMetrics(intersectionsList, finalManual, travelTimes, weights);
    optSol.status = "Optimal";
  } else {
    const bestOffs = bruteForceOptimize(intersectionsList, travelTimes, weights);
    optSol = computeSolutionMetrics(intersectionsList, bestOffs, travelTimes, weights);
    optSol.status = "Optimal";
  }

  return {
    baseline_results: baselineSol,
    optimization_results: optSol
  };
}

