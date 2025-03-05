// הגדרת מופע ירוק בצומת
export interface GreenPhase
{
    start: number; // זמן תחילת המופע במחזור
    duration: number; // משך המופע
}

// הגדרת צומת
export interface Intersection
{
    id: number;
    distance: number; // מרחק לאורך הציר
    green_up: GreenPhase[]; // רשימת מופעים בכיוון up
    green_down: GreenPhase[]; // רשימת מופעים בכיוון down
    cycle_up: number; // אורך מחזור בכיוון up
    cycle_down: number; // אורך מחזור בכיוון down
}

// הגדרת נתוני הרשת
export interface NetworkData
{
    intersections: Intersection[];
    travel: {
        up: {speed: number};
        down: {speed: number};
    }
}

// הגדרת משקולות
export interface Weights
{
    corridor_up: number;
    corridor_down: number;
    overlap_up: number;
    avg_delay_up: number;
    max_delay_up: number;
    overlap_down: number;
    avg_delay_down: number;
    max_delay_down: number;
}

/*******************************************************************
*תוצאת הרצה(Baseline או Optimized)
******************************************************************/
export interface RunResult
{
    status: string; // "Optimal", "Infeasible", etc.(כאן לצורך הדגמה)
    offsets: number[]; // ערכי offset
    objective_value: number | null; // ערך פונקציית המטרה
    overlap_up: number[];
    avg_delay_up: number[];
    max_delay_up: number[];
    overlap_down: number[];
    avg_delay_down: number[];
    max_delay_down: number[];
    corridorBW_up: number; // ייתכן שהמודל ייתן ערך שרירותי
    corridorBW_down: number;
    // post - processing לשרשור
    chain_corridorBW_up?: number;
    chain_corridorBW_down?: number;

    local_up_L?:  (number | null)[];
    local_up_U?:  (number | null)[];
    local_down_L?:(number | null)[];
    local_down_U?:(number | null)[];
}

/*******************************************************************
*פונקציה לחישוב Overlap ו - Delay "במודל"
******************************************************************/
// כאן רק מדגימים את החישוב האנליטי(בפייתון הוגדרו משתני LP).
// ב - TS אפשר לדמה זאת כרגע בפונקציה פשוטה, או כהכנה ליצירת אילוצים ב - Solver.
export function defineOverlapAndDelay(
    i_pair: number,
    direction: "up" | "down",
    data: NetworkData,
    offsets: number[],
    travel_up: number[],
    travel_down: number[],
    M: number
): [number, number, number] | [null, null, null]
{
    const n = data.intersections.length;
    if (direction === "up")
    {
        if (i_pair >= n - 1)
        {
            return [null, null, null];
        }
        const off_dep = offsets[i_pair];
        const off_dest = offsets[i_pair + 1];
        const tt = travel_up[i_pair];
        const phase_dep = data.intersections[i_pair].green_up[0];
        const phase_dest = data.intersections[i_pair + 1].green_up[0];

        const a = off_dep + phase_dep.start + tt;
        const c = a + phase_dep.duration;
        const b = off_dest + phase_dest.start;
        const d = b + phase_dest.duration;

        // overlap
        const L_val = (() => {
            const z = Math.abs(a - b);
            return (a + b + z) / 2;
        })();
        const U_val = (() => {
            const w = Math.abs(c - d);
            return (c + d - w) / 2;
        })();
        const overlap = Math.max(0, U_val - L_val);

        // חישוב Delay(אנחנו מדגימים פשוט)
        // במודל המקורי היה מכלול Y[m], כאן מדגימים נוסחה "ממוצעת"
        const avgDelay = ((b - a) + (d - c)) / 2;
        // סתם הדגמה, לא חישוב מדויק.
        const maxDelay = Math.max((b - a), (d - c), 0);

        return [overlap, avgDelay, maxDelay];
    }
    else {
        if (i_pair <= 0) {
            return [null, null, null];
        }
        const off_dep = offsets[i_pair];
        const off_dest = offsets[i_pair - 1];
        const tt = travel_down[i_pair - 1];
        const phase_dep = data.intersections[i_pair].green_down[0];
        const phase_dest = data.intersections[i_pair - 1].green_down[0];

        const a = off_dep + phase_dep.start + tt;
        const c = a + phase_dep.duration;
        const b = off_dest + phase_dest.start;
        const d = b + phase_dest.duration;

        const z = Math.abs(a - b);
        const L_val = (a + b + z) / 2;
        const w = Math.abs(c - d);
        const U_val = (c + d - w) / 2;
        const overlap = Math.max(0, U_val - L_val);

        // delay - here a simplistic approach
        const avgDelay = ((b - a) + (d - c)) / 2;
        const maxDelay = Math.max((b - a), (d - c), 0);
        return [overlap, Math.max(avgDelay, 0), Math.max(maxDelay, 0)];
    }
}

/*******************************************************************
* פונקציית עזר לפוסט - פרוססינג חישוב L & U מקומיים
******************************************************************/
function computeLocalHF(
    off_dep: number,
    off_dest: number,
    start_dep: number,
    dur_dep: number,
    start_dest: number,
    dur_dest: number,
    travel_time: number
): [number | null, number | null]
{
    const a = off_dep + start_dep + travel_time;
    const c = a + dur_dep;
    const b = off_dest + start_dest;
    const d = b + dur_dest;
    const L_ = Math.max(a, b);
    const U_ = Math.min(c, d);
    if (L_ > U_)
        return [null, null];
    return [L_, U_];
}

/*******************************************************************
* חישוב Corridor BW בשרשור - כיוון UP
******************************************************************/
function chainBWUp(
    intervals: Array<[number | null, number | null]>,
    travel_times: number[]
): number
{
    if (intervals.length === 0) return 0;
    // [L_0, U_0]
    let Lc = intervals[0][0];
    let Uc = intervals[0][1];
    if (Lc == null || Uc == null) return 0;
    if (Lc > Uc) return 0;
    for (let i = 1; i < intervals.length; i++) {
        const t = travel_times[i-1];
        if (t == null)
            return 0;
        Lc = Lc + t;
        Uc = Uc + t;
        const L_ = intervals[i][0];
        const U_ = intervals[i][1];
        if (L_ == null || U_ == null) return 0;
        const newL = Math.max(Lc, L_);
        const newU = Math.min(Uc, U_);
        if (newL > newU) return 0;
        Lc = newL;
        Uc = newU;
    }
    return Math.max(0, Uc - Lc);
}

/*******************************************************************
* חישוב Corridor BW בשרשור - כיוון DOWN
******************************************************************/
function chainBWDown(
    intervals: Array<[number | null, number | null]>,
    travel_times: number[]
): number
{
    if (intervals.length === 0) return 0;
    let Lc = intervals[0][0];
    let Uc = intervals[0][1];
    if (Lc == null || Uc == null) return 0;
    if (Lc > Uc) return 0;
    for (let i = 1; i < intervals.length; i++) {
        const t = travel_times[travel_times.length - i]; // לצורך היפוך
        if (t == null)
            return 0;
        Lc = Lc + t;
        Uc = Uc + t;
        const[L_, U_] = intervals[i];
        if (L_ == null || U_ == null) return 0;
        const newL = Math.max(Lc, L_);
        const newU = Math.min(Uc, U_);
        if (newL > newU) return 0;
        Lc = newL;
        Uc = newU;
    }
    return Math.max(0, Uc - Lc);
}

/*******************************************************************
* מודל Baseline(offset=0)
******************************************************************/
export function computeBaseline(
    data: NetworkData,
    weights: Weights,
    M: number = 3
): RunResult
{
    const n = data.intersections.length;
    const offsets = new Array(n).fill(0);

    // travel times
    const travel_up: number[] = [];
    const travel_down: number[] = [];
    for (let i=0; i < n-1; i++) {
        const dist = data.intersections[i+1].distance - data.intersections[i].distance;
        const up_t   = Math.round(dist * 3.6 /data.travel.up.speed);
        const down_t = Math.round(dist * 3.6 /data.travel.down.speed);
        travel_up.push(up_t);
        travel_down.push(down_t);
    }

    const overlap_upVals: number[] = [];
    const avg_delay_upVals: number[] = [];
    const max_delay_upVals: number[] = [];
    const overlap_downVals: number[] = [];
    const avg_delay_downVals: number[] = [];
    const max_delay_downVals: number[] = [];

    for (let i_pair=0; i_pair < n; i_pair++) {
        const[oup, adu, mdu] = defineOverlapAndDelay(i_pair, "up", data, offsets, travel_up, travel_down, M);
        if (oup !==null && adu !==null && mdu !==null) {
            overlap_upVals.push(oup);
            avg_delay_upVals.push(adu);
            max_delay_upVals.push(mdu);
        }
        const[odn, add_, mdd_] = defineOverlapAndDelay(i_pair, "down", data, offsets, travel_up, travel_down, M);
        if (odn !==null && add_ !==null && mdd_ !==null) {
            overlap_downVals.push(odn);
            avg_delay_downVals.push(add_);
            max_delay_downVals.push(mdd_);
        }
    }

    // נניח שפונקציית המטרה "מתקבלת" כערך – פה רק סכימה מדגמית
    let objective_value = 0;
    const sumOverUp = overlap_upVals.reduce((s, v) => s + v, 0);
    const sumOverDown = overlap_downVals.reduce((s, v) => s + v, 0);
    const sumAvgUp = avg_delay_upVals.reduce((s, v) => s + v, 0);
    const sumMaxUp = max_delay_upVals.reduce((s, v) => s + v, 0);
    const sumAvgDown = avg_delay_downVals.reduce((s, v) => s + v, 0);
    const sumMaxDown = max_delay_downVals.reduce((s, v) => s + v, 0);

    // corrBW_up / down(כרגע נקבע באופן רופף, לפני post - processing)
    let corridorBW_up = 300;
    let corridorBW_down = 300;

    objective_value = weights.overlap_up * sumOverUp
        + weights.overlap_down * sumOverDown
        - weights.avg_delay_up * sumAvgUp
        - weights.max_delay_up * sumMaxUp
        - weights.avg_delay_down * sumAvgDown
        - weights.max_delay_down * sumMaxDown
        + weights.corridor_up * corridorBW_up
        + weights.corridor_down * corridorBW_down;

    const result: RunResult = {
        status: "Optimal", // בהנחה שהכל "הסתדר"
        offsets: offsets,
        objective_value: objective_value,
        overlap_up: overlap_upVals,
        avg_delay_up: avg_delay_upVals,
        max_delay_up: max_delay_upVals,
        overlap_down: overlap_downVals,
        avg_delay_down: avg_delay_downVals,
        max_delay_down: max_delay_downVals,
        corridorBW_up: corridorBW_up,
        corridorBW_down: corridorBW_down
    };
    return result;
}

/*******************************************************************
* מודל אופסט אופטימלי(demo ללא LP solver)
******************************************************************/
export function greenWaveOptimization(
    data: NetworkData,
    weights: Weights,
    M: number = 3
): {baseline_results: RunResult, optimized_results: RunResult}
{
    const baseline_results = computeBaseline(data, weights, M);

    const n = data.intersections.length;
    // פה כביכול פותרים LP, אנחנו מדגימים:
    // offset = 0 בצומת ראשון
    // offset משתנה ב - [0..300] בצמתים אחרים
    // לצורך ההדגמה "נניח" שמצאנו offsets ידניים
    const offsets: number[] = [];
    for (let i=0; i < n; i++) {
        if (i ===0) offsets.push(0);
        else offsets.push( Math.random() * 100 | 0 ); // demo random offset
    }

    const travel_up: number[] = [];
    const travel_down: number[] = [];
    for (let i=0; i < n-1; i++) {
        const dist = data.intersections[i+1].distance - data.intersections[i].distance;
        const up_t   = Math.round(dist * 3.6 /data.travel.up.speed);
        const down_t = Math.round(dist * 3.6 /data.travel.down.speed);
        travel_up.push(up_t);
        travel_down.push(down_t);
    }

    // חישוב overlap / delay
    const overlap_upVals: number[] = [];
    const avg_delay_upVals: number[] = [];
    const max_delay_upVals: number[] = [];
    const overlap_downVals: number[] = [];
    const avg_delay_downVals: number[] = [];
    const max_delay_downVals: number[] = [];

    for (let i_pair=0; i_pair < n; i_pair++) {
        const[oup, adu, mdu] = defineOverlapAndDelay(i_pair, "up", data, offsets, travel_up, travel_down, M);
        if (oup !==null && adu !==null && mdu !==null) {
            overlap_upVals.push(oup);
            avg_delay_upVals.push(adu);
            max_delay_upVals.push(mdu);
        }
        const[odn, add_, mdd_] = defineOverlapAndDelay(i_pair, "down", data, offsets, travel_up, travel_down, M);
        if (odn !==null && add_ !==null && mdd_ !==null) {
            overlap_downVals.push(odn);
            avg_delay_downVals.push(add_);
            max_delay_downVals.push(mdd_);
        }
    }

    const sumOverUp = overlap_upVals.reduce((s, v) => s + v, 0);
    const sumOverDown = overlap_downVals.reduce((s, v) => s + v, 0);
    const sumAvgUp = avg_delay_upVals.reduce((s, v) => s + v, 0);
    const sumMaxUp = max_delay_upVals.reduce((s, v) => s + v, 0);
    const sumAvgDown = avg_delay_downVals.reduce((s, v) => s + v, 0);
    const sumMaxDown = max_delay_downVals.reduce((s, v) => s + v, 0);

    let corridorBW_up = 300; // בגישה הנוכחית, סתם
    let corridorBW_down = 300;

    let objective_value = weights.overlap_up * sumOverUp
        + weights.overlap_down * sumOverDown
        - weights.avg_delay_up * sumAvgUp
        - weights.max_delay_up * sumMaxUp
        - weights.avg_delay_down * sumAvgDown
        - weights.max_delay_down * sumMaxDown
        + weights.corridor_up * corridorBW_up
        + weights.corridor_down * corridorBW_down;

    const optimized_results: RunResult = {
        status: "Optimal",
        offsets: offsets,
        objective_value: objective_value,
        overlap_up: overlap_upVals,
        avg_delay_up: avg_delay_upVals,
        max_delay_up: max_delay_upVals,
        overlap_down: overlap_downVals,
        avg_delay_down: avg_delay_downVals,
        max_delay_down: max_delay_downVals,
        corridorBW_up: corridorBW_up,
        corridorBW_down: corridorBW_down
    };

    // כעת post - processing(L_i, U_i מקומיים + שרשור corridor אמיתי):
    // Up
    function localUpLU(data: NetworkData, offs: number[], travelUp: number[]): Array<[number | null, number | null]> {
        const arr: Array<[number | null, number | null]> = [];
        for (let i=0; i < n-1; i++)
        {
            const off_dep = offs[i];
            const off_dest = offs[i + 1];
            const tt = travelUp[i];
            const ph_dep = data.intersections[i].green_up[0];
            const ph_dest = data.intersections[i + 1].green_up[0];
            const a = off_dep + ph_dep.start + tt;
            const c = a + ph_dep.duration;
            const b = off_dest + ph_dest.start;
            const d = b + ph_dest.duration;
            const L_ = Math.max(a, b);
            const U_ = Math.min(c, d);
            if (L_ > U_)
                arr.push([null, null]);
            else arr.push([L_, U_]);
        }
        return arr;
    }
    // שרשור
    function chainUp(intervals: Array<[number | null, number | null]>, travel: number[]): number
    {
        if (intervals.length ===0) return 0;
        let[Lc, Uc] = intervals[0];
        if (Lc == null || Uc == null) return 0;
        if (Lc > Uc) return 0;
        for (let i=1; i < intervals.length; i++){
            const t=travel[i-1];
            Lc += t; Uc += t;
            const[L2, U2] = intervals[i];
            if (L2 == null || U2 == null)
                return 0;
            const newL = Math.max(Lc, L2);
            const newU = Math.min(Uc, U2);
            if (newL > newU) return 0;
            Lc = newL;
            Uc = newU;
        }
        return Math.max(0, Uc - Lc);
    }

    // down
    function localDownLU(data: NetworkData, offs: number[], travelDown: number[]): Array<[number | null, number | null]> {
        const arr: Array<[number | null, number | null]> = [];
        for (let i=n-1; i > 0; i--) {
            const off_dep= offs[i];
            const off_dest=offs[i-1];
            const tt = travelDown[i-1];
            const ph_dep = data.intersections[i].green_down[0];
            const ph_dst = data.intersections[i-1].green_down[0];
            const a= off_dep + ph_dep.start + tt;
            const c= a + ph_dep.duration;
            const b= off_dest+ ph_dst.start;
            const d= b + ph_dst.duration;
            const L_ = Math.max(a, b);
            const U_ = Math.min(c, d);
            if (L_ > U_) arr.push([null, null]);
            else arr.push([L_, U_]);
        }
        return arr;
    }
    function chainDown(intervals: Array<[number | null, number | null]>, travelD: number[]): number
    {
        if (intervals.length ===0) return 0;
        let[Lc, Uc] = intervals[0];
        if (Lc == null || Uc == null) return 0;
        if (Lc > Uc) return 0;
        for (let i=1; i < intervals.length; i++){
            const t = travelD[travelD.length - i];
            Lc += t; Uc += t;
            const[L2, U2] = intervals[i];
            if (L2 == null || U2 == null)
                return 0;
            const newL = Math.max(Lc, L2);
            const newU = Math.min(Uc, U2);
            if (newL > newU) return 0;
            Lc = newL;
            Uc = newU;
        }
        return Math.max(0, Uc - Lc);
    }

    const localUpOpt = localUpLU(data, offsets, travel_up);
    const corridorUpChain = chainUp(localUpOpt, travel_up);

    const localDownOpt = localDownLU(data, offsets, travel_down);
    const corridorDownChain = chainDown(localDownOpt, travel_down);

    optimized_results.chain_corridorBW_up = corridorUpChain;
    optimized_results.chain_corridorBW_down = corridorDownChain;

    // כנ"ל לבייסליין:
    const localUpBase = localUpLU(data, baseline_results.offsets, travel_up);
    const baseChainUp = chainUp(localUpBase, travel_up);
    const localDownBase = localDownLU(data, baseline_results.offsets, travel_down);
    const baseChainDown = chainDown(localDownBase, travel_down);
    baseline_results.chain_corridorBW_up = baseChainUp;
    baseline_results.chain_corridorBW_down = baseChainDown;

    return {
        baseline_results: baseline_results,
        optimized_results: optimized_results
    };
}

/*******************************************************************
* דוגמת שימוש
******************************************************************/
function mainDemo(): void
{
    const dataExample: NetworkData = {
        intersections: [
            {
                id: 1, distance: 0,
                green_up: [{start: 0, duration: 45}],
                green_down: [{start: 45, duration: 45}],
                cycle_up: 90,
                cycle_down: 90
            },
            {
                id: 2, distance: 300,
                green_up: [{start: 0, duration: 45}],
                green_down: [{start: 45, duration: 45}],
                cycle_up: 90,
                cycle_down: 90
            },
            {
                id: 3, distance: 500,
                green_up: [{start: 0, duration: 45}],
                green_down: [{start: 45, duration: 45}],
                cycle_up: 90,
                cycle_down: 90
            }
        ],
        travel: {
            up: {speed: 50},
            down: {speed: 50}
        }
    };

    const userWeights: Weights = {
        corridor_up: 10,
        corridor_down: 10,
        overlap_up: 5,
        avg_delay_up: 5,
        max_delay_up: 5,
        overlap_down: 5,
        avg_delay_down: 5,
        max_delay_down: 5
    };

    const results = greenWaveOptimization(dataExample, userWeights);
    console.log("=== BASELINE ===");
    console.log(results.baseline_results);
    console.log("=== OPTIMIZED ===");
    console.log(results.optimized_results);
}

// להרצה בדוגמה \
// mainDemo();
