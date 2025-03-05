
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
import { type Intersection } from '@/types/optimization';
import { PhaseBar } from './chart/PhaseBar';
import { GreenWaveTooltip } from './chart/GreenWaveTooltip';

interface GreenWaveChartProps {
  data: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  speed: number;
}

export const GreenWaveChart = ({ data, mode, speed }: GreenWaveChartProps) => {
  if (!data || data.length === 0) return null;
  
  // Find the maximum cycle time and distance
  const maxCycleTime = Math.max(...data.map(i => i.cycleTime || 90));
  const maxDistance = Math.max(...data.map(i => i.distance));

  // Prepare chart data
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
      cycleTime: intersection.cycleTime,
      value: maxCycleTime // This is used for the bar height in the chart
    };
  }).filter(Boolean);

  if (chartData.length === 0) {
    console.error('No valid data to display');
    return null;
  }

  // Sort data by distance
  const sortedChartData = [...chartData].sort((a, b) => a.distance - b.distance);

  // Define legend items
  const legendPayload = [
    { value: 'מופע במעלה הזרם', type: 'rect' as const, color: '#22c55e', id: 'upstream' },
    { value: 'מופע במורד הזרם', type: 'rect' as const, color: '#3b82f6', id: 'downstream' }
  ];

  // Define axis domains
  const xDomain = [0, maxDistance || 100];
  const yDomain = [0, maxCycleTime];

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
          <Tooltip content={<GreenWaveTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            payload={legendPayload}
          />
          
          <Bar
            dataKey="value"
            shape={(props: any) => (
              <PhaseBar 
                x={props.x}
                y={props.y}
                width={props.width}
                height={props.height}
                payload={props.payload}
                maxTime={maxCycleTime}
                mode={mode}
              />
            )}
            barSize={40}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
