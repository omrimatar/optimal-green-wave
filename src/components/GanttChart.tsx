
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
  
  // נוסיף בדיקות תקינות לנתונים ונחלץ את זמן המחזור המקסימלי
  const maxCycleTime = Math.max(...data.map(i => i.cycleTime || 90));
  const maxTime = maxCycleTime; // משתמשים בזמן המחזור המקסימלי בלבד, ללא תלות באופסטים
  const maxDistance = Math.max(...data.map(i => i.distance));

  // נוודא שכל הצמתים מכילים את כל הנתונים הנדרשים
  const chartData = data.map((intersection: Intersection) => {
    if (!intersection.id || intersection.distance === undefined || !intersection.greenPhases) {
      console.error('Missing required data for intersection:', intersection);
      return null;
    }
    return {
      name: `צומת ${intersection.id}`,
      distance: intersection.distance,
      offset: intersection.offset || 0,
      greenPhases: intersection.greenPhases,
      value: maxTime, // משתמשים בזמן המחזור המקסימלי עבור כל הצמתים
    };
  }).filter(Boolean);

  // אם אין מספיק נתונים תקינים, לא נציג את הגרף
  if (chartData.length === 0) {
    console.error('No valid data to display');
    return null;
  }

  // חישוב קווי רוחב הפס
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

  // יצירת קווים אלכסוניים מהנקודות הדיאגונליות
  const createDiagonalLines = (points: DiagonalPoint[], intersections: Intersection[], cycleTime: number) => {
    if (!points || !Array.isArray(points) || points.length <= 1) {
      console.log("Not enough diagonal points to create lines:", points);
      return [];
    }

    const lines: any[] = [];
    
    // הכנת מיפוי צמתים לגישה מהירה
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
      // נקבע min/max עבור בדיקות החיתוך
      const minDist = Math.min(startDistance, endDistance);
      const maxDist = Math.max(startDistance, endDistance);

      // אם אין טווח זמן (לא הגיוני) – מדלגים
      if (current.low >= current.top || next.low >= next.top) {
        continue;
      }

      // מקרה א: אין חצייה של סוף מחזור, קווים רגילים
      // --------
      // פשוט נחבר low->low ו- top->top
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

      // מקרה ב: יש חצייה של סוף מחזור (Wrap-Around)
      // --------
      // נחשב intersectionX עבור low ו-top. אם נופל בטווח [minDist,maxDist], מוסיפים שני קטעים.
      const intersectionXLow = startDistance + 
        ((endDistance - startDistance) * (cycleTime - current.low)) /
        ((next.low + cycleTime) - current.low);

      // אם intersectionXLow אכן בתוך תחום המרחק, מוסיפים 2 קטעים (עד cycleTime, ואז מ-0)
      if (intersectionXLow >= minDist && intersectionXLow <= maxDist) {
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

      // כנ"ל עבור הגבול העליון
      const intersectionXTop = startDistance +
        ((endDistance - startDistance) * (cycleTime - current.top)) /
        ((next.top + cycleTime) - current.top);

      if (intersectionXTop >= minDist && intersectionXTop <= maxDist) {
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

  // יצירת קווים אלכסוניים מנתוני pairs_band_points
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

  // יצירת קווים אלכסוניים מהנקודות הדיאגונליות
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

  const legendPayload = [
    { value: 'מופע במעלה הזרם', type: 'rect' as const, color: '#22c55e', id: 'phase-1' },
    { value: 'מופע במורד הזרם', type: 'rect' as const, color: '#3b82f6', id: 'phase-2' },
    { value: 'גל ירוק במעלה הזרם', type: 'line' as const, color: '#22c55e', id: 'wave-1', strokeDasharray: '5 5' },
    { value: 'גל ירוק במורד הזרם', type: 'line' as const, color: '#3b82f6', id: 'wave-2', strokeDasharray: '5 5' }
  ];

  // נוסיף בדיקה שהדומיין תקין עם ערכי ברירת מחדל
  const xDomain = [0, maxDistance || 100];
  const yDomain = [0, maxTime || 90];

  // נסדר את הנתונים לפי מרחק
  const sortedChartData = [...chartData].sort((a, b) => a.distance - b.distance);

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
