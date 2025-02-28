
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
}

export const GanttChart = ({ data, mode, speed, diagonalPoints }: Props) => {
  if (!data || data.length === 0) return null;
  
  // נוסיף בדיקות תקינות לנתונים
  const cycleTime = data[0].cycleTime || 90; // ברירת מחדל של 90 שניות אם לא הוגדר
  const maxTime = cycleTime;
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
      value: maxTime,
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
    cycleTime
  }, 'upstream');
  
  const bandwidthLinesDownstream = calculateBandwidthLines({
    intersections: data,
    speed,
    cycleTime
  }, 'downstream');

  // יצירת קווים אלכסוניים מהנקודות הדיאגונליות
  const createDiagonalLines = (points: DiagonalPoint[], intersections: Intersection[], cycleTime: number) => {
    if (!points || !Array.isArray(points) || points.length <= 1) {
      console.log("Not enough diagonal points to create lines:", points);
      return [];
    }

    const lines: any[] = [];
    
    // מיפוי צמתים לפי מזהה עבור גישה מהירה
    const intersectionMap = new Map(
      intersections.map(intersection => [intersection.id, intersection])
    );

    // יצירת קווים בין כל זוג נקודות עוקבות
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
      
      // בדיקה אם הקו יחצה את סוף המחזור
      if (current.low < current.top && next.low < next.top) {
        // קו רגיל ללא חציית מחזור
        lines.push({
          start: { distance: startDistance, time: current.low },
          end: { distance: endDistance, time: next.low },
          color: '#22c55e',
          opacity: 0.7
        });
        
        lines.push({
          start: { distance: startDistance, time: current.top },
          end: { distance: endDistance, time: next.top },
          color: '#22c55e',
          opacity: 0.7
        });
      } else {
        // קו שחוצה את סוף המחזור
        // חלק ראשון - עד סוף המחזור
        const intersectionX = startDistance + 
          ((endDistance - startDistance) * (cycleTime - current.low)) / 
          ((next.low + cycleTime) - current.low);

        if (intersectionX > startDistance && intersectionX < endDistance) {
          lines.push({
            start: { distance: startDistance, time: current.low },
            end: { distance: intersectionX, time: cycleTime },
            color: '#22c55e',
            opacity: 0.7
          });
          
          // חלק שני - המשך מתחילת המחזור
          lines.push({
            start: { distance: intersectionX, time: 0 },
            end: { distance: endDistance, time: next.low },
            color: '#22c55e',
            opacity: 0.7
          });
        }

        // טיפול דומה עבור הקו העליון
        const topIntersectionX = startDistance +
          ((endDistance - startDistance) * (cycleTime - current.top)) /
          ((next.top + cycleTime) - current.top);

        if (topIntersectionX > startDistance && topIntersectionX < endDistance) {
          lines.push({
            start: { distance: startDistance, time: current.top },
            end: { distance: topIntersectionX, time: cycleTime },
            color: '#22c55e',
            opacity: 0.7
          });
          
          lines.push({
            start: { distance: topIntersectionX, time: 0 },
            end: { distance: endDistance, time: next.top },
            color: '#22c55e',
            opacity: 0.7
          });
        }
      }
    }

    console.log("Created diagonal lines:", lines);
    return lines;
  };

  // יצירת קווים אלכסוניים מהנקודות הדיאגונליות
  const diagonalLinesUp = useMemo(() => {
    if (diagonalPoints?.up) {
      return createDiagonalLines(diagonalPoints.up, data, cycleTime);
    }
    return [];
  }, [diagonalPoints?.up, data, cycleTime]);

  const diagonalLinesDown = useMemo(() => {
    if (diagonalPoints?.down) {
      return createDiagonalLines(diagonalPoints.down, data, cycleTime);
    }
    return [];
  }, [diagonalPoints?.down, data, cycleTime]);

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

          {/* הוספת קווים אלכסוניים מלמעלה למטה */}
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

          {/* הוספת קווים אלכסוניים ממטה למעלה */}
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
