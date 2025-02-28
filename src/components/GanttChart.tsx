
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
import { type Intersection } from '@/types/optimization';

interface Props {
  data: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  speed: number;
}

export const GanttChart = ({ data, mode, speed }: Props) => {
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
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
