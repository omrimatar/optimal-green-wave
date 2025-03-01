
import { 
  ComposedChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer,
  Line,
  Legend
} from 'recharts';
import { calculateBandwidthLines } from '../utils/bandwidthCalculations';
import { GreenPhaseBar } from './chart/GreenPhaseBar';
import { ChartTooltip } from './chart/ChartTooltip';
import { type Intersection, type DiagonalPoint } from '@/types/optimization';
import { useMemo } from 'react';

interface Props {
  data: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  speed: number;
  diagonalPoints?: {
    up: DiagonalPoint[];
    down: DiagonalPoint[];
  };
  pairsBandPoints?: Array<{
    from_junction: number;
    to_junction: number;
    up: {
      origin_low: number;
      origin_high: number;
      dest_low: number;
      dest_high: number;
    };
    down: {
      origin_low: number;
      origin_high: number;
      dest_low: number;
      dest_high: number;
    };
  }>;
}

export const GanttChart = ({ data, mode, speed, diagonalPoints, pairsBandPoints }: Props) => {
  if (!data || data.length === 0) return null;
  
  // 1) חישוב זמן המחזור המקסימלי מכל הצמתים
  const maxCycleTime = Math.max(...data.map(i => i.cycleTime || 90));
  const maxTime = maxCycleTime; // משתמשים בזמן המחזור המקסימלי בלבד
  const maxDistance = Math.max(...data.map(i => i.distance));

  // 2) הרכבת המידע הבסיסי לציור - נרמול אופסטים וכד'
  const chartData = data.map((intersection: Intersection) => {
    if (!intersection.id || intersection.distance === undefined || !intersection.greenPhases) {
      console.error('Missing required data for intersection:', intersection);
      return null;
    }

    const cycle = intersection.cycleTime || 90;
    const normalizedOffset = intersection.offset % cycle;

    return {
      name: `צומת ${intersection.id}`,
      distance: intersection.distance,
      offset: normalizedOffset,
      greenPhases: intersection.greenPhases,
      value: maxCycleTime // ישתמשו בו בתוך ה-Bar כגובה מלא
    };
  }).filter(Boolean);

  if (chartData.length === 0) {
    console.error('No valid data to display');
    return null;
  }

  // 3) קווי רוחב הפס (אופציונלי אם קיימת פונקציה כזו)
  const bandwidthLinesUpstream = calculateBandwidthLines({
    intersections: data,
    speed,
    cycleTime: maxCycleTime
  }, 'upstream');
  
  const bandwidthLinesDownstream = calculateBandwidthLines({
    intersections: data,
    speed,
    cycleTime: maxCycleTime
  }, 'downstream');

  // 4) פונקציה ליצירת קווים אלכסוניים מנקודות דיאגנליות
  const createDiagonalLines = (points: DiagonalPoint[], intersections: Intersection[], cycleTime: number) => {
    if (!points || !Array.isArray(points) || points.length <= 1) {
      console.log("Not enough diagonal points to create lines:", points);
      return [];
    }

    const lines: any[] = [];
    const intersectionMap = new Map(
      intersections.map(intersection => [intersection.id, intersection])
    );

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const currentIntersection = intersectionMap.get(current.junction);
      const nextIntersection = intersectionMap.get(next.junction);
      if (!currentIntersection || !nextIntersection) {
        console.log("Cannot find intersection for junctions:", current.junction, next.junction);
        continue;
      }

      const startDistance = currentIntersection.distance;
      const endDistance = nextIntersection.distance;

      // אם אין טווח זמן הגיוני, דולגים
      if (current.low >= current.top || next.low >= next.top) {
        continue;
      }

      // קווים רגילים (low->low, top->top)
      lines.push({
        start: { distance: startDistance, time: current.low },
        end:   { distance: endDistance,   time: next.low },
        color: '#22c55e',
        opacity: 0.7
      });
      lines.push({
        start: { distance: startDistance, time: current.top },
        end:   { distance: endDistance,   time: next.top },
        color: '#22c55e',
        opacity: 0.7
      });

      // מקרה wrap-around (בדוגמה זו מצויר בנוסף; ייתכן שתרצה תנאי שימנע כפילויות)
      const intersectionXLow =
        startDistance + ((endDistance - startDistance) * (cycleTime - current.low)) / ((next.low + cycleTime) - current.low);
      if (intersectionXLow >= Math.min(startDistance, endDistance) && intersectionXLow <= Math.max(startDistance, endDistance)) {
        lines.push({
          start: { distance: startDistance, time: current.low },
          end:   { distance: intersectionXLow, time: cycleTime },
          color: '#22c55e',
          opacity: 0.7
        });
        lines.push({
          start: { distance: intersectionXLow, time: 0 },
          end:   { distance: endDistance,      time: next.low },
          color: '#22c55e',
          opacity: 0.7
        });
      }

      const intersectionXTop =
        startDistance + ((endDistance - startDistance) * (cycleTime - current.top)) / ((next.top + cycleTime) - current.top);
      if (intersectionXTop >= Math.min(startDistance, endDistance) && intersectionXTop <= Math.max(startDistance, endDistance)) {
        lines.push({
          start: { distance: startDistance, time: current.top },
          end:   { distance: intersectionXTop, time: cycleTime },
          color: '#22c55e',
          opacity: 0.7
        });
        lines.push({
          start: { distance: intersectionXTop, time: 0 },
          end:   { distance: endDistance,      time: next.top },
          color: '#22c55e',
          opacity: 0.7
        });
      }
    }

    console.log("Created diagonal lines:", lines);
    return lines;
  };

  // 5) פונקציה ליצירת קווים מנתוני pairsBandPoints
  const createPairBandLines = () => {
    if (!pairsBandPoints || !Array.isArray(pairsBandPoints) || pairsBandPoints.length === 0) {
      console.log("No pair band points data available");
      return { upLines: [], downLines: [] };
    }

    const upLines: any[] = [];
    const downLines: any[] = [];
    
    // מיפוי צמתים לפי מזהה עבור גישה מהירה
    const intersectionMap = new Map(
      data.map(intersection => [intersection.id, intersection])
    );

    pairsBandPoints.forEach(pair => {
      const fromIntersection = intersectionMap.get(pair.from_junction);
      const toIntersection = intersectionMap.get(pair.to_junction);
      
      if (!fromIntersection || !toIntersection) {
        console.log("Cannot find intersections for pair:", pair);
        return;
      }
      
      const startDistance = fromIntersection.distance;
      const endDistance = toIntersection.distance;
      
      // קווים במעלה הזרם (upstream)
      if (pair.up) {
        // קו תחתון
        upLines.push({
          start: { distance: startDistance, time: pair.up.origin_low },
          end: { distance: endDistance, time: pair.up.dest_low },
          color: '#22c55e',
          opacity: 0.7
        });
        
        // קו עליון
        upLines.push({
          start: { distance: startDistance, time: pair.up.origin_high },
          end: { distance: endDistance, time: pair.up.dest_high },
          color: '#22c55e',
          opacity: 0.7
        });
      }
      
      // קווים במורד הזרם (downstream)
      if (pair.down) {
        // קו תחתון
        downLines.push({
          start: { distance: startDistance, time: pair.down.origin_low },
          end: { distance: endDistance, time: pair.down.dest_low },
          color: '#3b82f6',
          opacity: 0.7
        });
        
        // קו עליון
        downLines.push({
          start: { distance: startDistance, time: pair.down.origin_high },
          end: { distance: endDistance, time: pair.down.dest_high },
          color: '#3b82f6',
          opacity: 0.7
        });
      }
    });

    console.log("Created pair band lines - up:", upLines, "down:", downLines);
    return { upLines, downLines };
  };

  // 6) שימוש ב-useMemo לייצר קווים / lines
  const diagonalLinesUp = useMemo(() => {
    if (diagonalPoints?.up) {
      return createDiagonalLines(diagonalPoints.up, data, maxCycleTime);
    }
    return [];
  }, [diagonalPoints?.up, data, maxCycleTime]);

  const diagonalLinesDown = useMemo(() => {
    if (diagonalPoints?.down) {
      return createDiagonalLines(diagonalPoints.down, data, maxCycleTime);
    }
    return [];
  }, [diagonalPoints?.down, data, maxCycleTime]);

  // יצירת קווים מנתוני pairs_band_points
  const { upLines: pairBandLinesUp, downLines: pairBandLinesDown } = useMemo(() => {
    if (pairsBandPoints) {
      return createPairBandLines();
    }
    return { upLines: [], downLines: [] };
  }, [pairsBandPoints, data]);

  // 7) הגדרת domain ל־Y כך שיהיה [0, maxCycleTime]
  const xDomain = [0, maxDistance || 100];
  const yDomain = [0, maxCycleTime];

  // מיון לפי מרחק
  const sortedChartData = [...chartData].sort((a, b) => a.distance - b.distance);

  // דוגמת הגדרת legendPayload
  const legendPayload = [
    { value: 'מופע במעלה הזרם', type: 'rect' as const, color: '#22c55e', id: 'phase-1' },
    { value: 'מופע במורד הזרם', type: 'rect' as const, color: '#3b82f6', id: 'phase-2' },
    { value: 'גל ירוק במעלה הזרם', type: 'line' as const, color: '#22c55e', id: 'wave-1', strokeDasharray: '5 5' },
    { value: 'גל ירוק במורד הזרם', type: 'line' as const, color: '#3b82f6', id: 'wave-2', strokeDasharray: '5 5' }
  ];

  console.log("Rendering Gantt chart with diagonal points:", diagonalPoints);
  console.log("Pairs band points:", pairsBandPoints);
  console.log("Using maxCycleTime for Y axis:", maxCycleTime);

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          margin={{ top: 20, right: 30, left: 40, bottom: 40 }}
          data={sortedChartData}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="distance"
            domain={xDomain}
            label={{ value: 'מרחק (מטרים)', position: 'bottom', offset: 20 }}
          />
          <YAxis 
            type="number"
            domain={yDomain}
            label={{ value: 'זמן (שניות)', angle: -90, position: 'left' }}
          />
          <Tooltip content={<ChartTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={60}
            payload={legendPayload}
          />
          
          <Bar
            dataKey="value"
            shape={(props: any) => (
              <GreenPhaseBar 
                x={props.x}
                y={props.y}
                width={props.width}
                height={props.height}
                payload={props.payload}
                maxTime={maxTime}
                mode={mode}
              />
            )}
            barSize={40}
            isAnimationActive={false}
          />

          {/* הוספת קווי רוחב פס */}
          {[...bandwidthLinesUpstream, ...bandwidthLinesDownstream]
            .filter(line => 
              line?.start?.distance !== undefined && 
              line?.start?.time !== undefined && 
              line?.end?.distance !== undefined && 
              line?.end?.time !== undefined
            )
            .map((line, index) => (
              <Line
                key={`bandwidth-${index}`}
                data={[
                  { distance: line.start.distance, time: line.start.time },
                  { distance: line.end.distance, time: line.end.time }
                ]}
                type="linear"
                dataKey="time"
                stroke={line.color}
                strokeOpacity={line.opacity}
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ))}

          {/* הוספת קווים אלכסוניים מלמעלה למטה (pairs_band_points) */}
          {pairBandLinesUp.map((line, index) => (
            <Line
              key={`pair-band-up-${index}`}
              data={[
                { distance: line.start.distance, time: line.start.time },
                { distance: line.end.distance, time: line.end.time }
              ]}
              type="linear"
              dataKey="time"
              stroke={line.color}
              strokeOpacity={line.opacity}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}

          {/* הוספת קווים אלכסוניים ממטה למעלה (pairs_band_points) */}
          {pairBandLinesDown.map((line, index) => (
            <Line
              key={`pair-band-down-${index}`}
              data={[
                { distance: line.start.distance, time: line.start.time },
                { distance: line.end.distance, time: line.end.time }
              ]}
              type="linear"
              dataKey="time"
              stroke="#3b82f6"  // כחול עבור קווי מורד הזרם
              strokeOpacity={0.7}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}

          {/* הוספת קווים אלכסוניים מלמעלה למטה (diagonal_points) */}
          {diagonalLinesUp.map((line, index) => (
            <Line
              key={`diagonal-up-${index}`}
              data={[
                { distance: line.start.distance, time: line.start.time },
                { distance: line.end.distance, time: line.end.time }
              ]}
              type="linear"
              dataKey="time"
              stroke={line.color}
              strokeOpacity={line.opacity}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}

          {/* הוספת קווים אלכסוניים ממטה למעלה (diagonal_points) */}
          {diagonalLinesDown.map((line, index) => (
            <Line
              key={`diagonal-down-${index}`}
              data={[
                { distance: line.start.distance, time: line.start.time },
                { distance: line.end.distance, time: line.end.time }
              ]}
              type="linear"
              dataKey="time"
              stroke="#3b82f6"  // כחול עבור קווי מורד הזרם
              strokeOpacity={0.7}
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
