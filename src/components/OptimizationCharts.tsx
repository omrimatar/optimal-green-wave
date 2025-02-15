
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LineChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChartBar, ChartRadar, LineChart as LineChartIcon } from "lucide-react";
import type { RunResult } from "@/types/traffic";

interface OptimizationChartsProps {
  baseline: RunResult;
  optimized: RunResult;
}

type ChartType = 'bar' | 'radar' | 'line';
type ComparisonType = 'optimization' | 'direction';

export const OptimizationCharts = ({ baseline, optimized }: OptimizationChartsProps) => {
  const [chartType, setChartType] = React.useState<ChartType>('bar');
  const [comparisonType, setComparisonType] = React.useState<ComparisonType>('optimization');

  // הכנת נתונים להשוואת אופטימיזציה
  const optimizationData = [
    {
      metric: 'רוחב מסדרון למעלה',
      בסיס: baseline.corridorBW_up,
      אופטימיזציה: optimized.corridorBW_up,
      מיקום: 0
    },
    {
      metric: 'רוחב מסדרון למטה',
      בסיס: baseline.corridorBW_down,
      אופטימיזציה: optimized.corridorBW_down,
      מיקום: 1
    },
    ...(baseline.avg_delay_up?.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      בסיס: baseline.avg_delay_up[index],
      אופטימיזציה: optimized.avg_delay_up?.[index],
      מיקום: index + 2
    })) || []),
    ...(baseline.max_delay_up?.map((_, index) => ({
      metric: `עיכוב מקסימלי ${index + 1}-${index + 2}`,
      בסיס: baseline.max_delay_up[index],
      אופטימיזציה: optimized.max_delay_up?.[index],
      מיקום: index + baseline.avg_delay_up?.length! + 2
    })) || [])
  ];

  // הכנת נתונים להשוואת כיוונים
  const directionData = [
    {
      metric: 'רוחב מסדרון',
      'מעלה הזרם - בסיס': baseline.corridorBW_up,
      'מעלה הזרם - אופטימיזציה': optimized.corridorBW_up,
      'מורד הזרם - בסיס': baseline.corridorBW_down,
      'מורד הזרם - אופטימיזציה': optimized.corridorBW_down,
      מיקום: 0
    },
    ...(baseline.avg_delay_up?.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      'מעלה הזרם - בסיס': baseline.avg_delay_up[index],
      'מעלה הזרם - אופטימיזציה': optimized.avg_delay_up?.[index],
      'מורד הזרם - בסיס': baseline.avg_delay_down?.[index],
      'מורד הזרם - אופטימיזציה': optimized.avg_delay_down?.[index],
      מיקום: index + 1
    })) || [])
  ];

  const currentData = comparisonType === 'optimization' ? optimizationData : directionData;

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              {comparisonType === 'optimization' ? (
                <>
                  <Bar dataKey="בסיס" fill="#93c5fd" />
                  <Bar dataKey="אופטימיזציה" fill="#22c55e" />
                </>
              ) : (
                <>
                  <Bar dataKey="מעלה הזרם - בסיס" fill="#93c5fd" />
                  <Bar dataKey="מעלה הזרם - אופטימיזציה" fill="#22c55e" />
                  <Bar dataKey="מורד הזרם - בסיס" fill="#bfdbfe" />
                  <Bar dataKey="מורד הזרם - אופטימיזציה" fill="#86efac" />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={currentData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              {comparisonType === 'optimization' ? (
                <>
                  <Radar name="בסיס" dataKey="בסיס" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.6} />
                  <Radar name="אופטימיזציה" dataKey="אופטימיזציה" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                </>
              ) : (
                <>
                  <Radar name="מעלה הזרם - בסיס" dataKey="מעלה הזרם - בסיס" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.6} />
                  <Radar name="מעלה הזרם - אופטימיזציה" dataKey="מעלה הזרם - אופטימיזציה" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Radar name="מורד הזרם - בסיס" dataKey="מורד הזרם - בסיס" stroke="#bfdbfe" fill="#bfdbfe" fillOpacity={0.6} />
                  <Radar name="מורד הזרם - אופטימיזציה" dataKey="מורד הזרם - אופטימיזציה" stroke="#86efac" fill="#86efac" fillOpacity={0.6} />
                </>
              )}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={currentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              {comparisonType === 'optimization' ? (
                <>
                  <Line type="monotone" dataKey="בסיס" stroke="#93c5fd" dot={{ fill: '#93c5fd' }} />
                  <Line type="monotone" dataKey="אופטימיזציה" stroke="#22c55e" dot={{ fill: '#22c55e' }} />
                </>
              ) : (
                <>
                  <Line type="monotone" dataKey="מעלה הזרם - בסיס" stroke="#93c5fd" dot={{ fill: '#93c5fd' }} />
                  <Line type="monotone" dataKey="מעלה הזרם - אופטימיזציה" stroke="#22c55e" dot={{ fill: '#22c55e' }} />
                  <Line type="monotone" dataKey="מורד הזרם - בסיס" stroke="#bfdbfe" dot={{ fill: '#bfdbfe' }} />
                  <Line type="monotone" dataKey="מורד הזרם - אופטימיזציה" stroke="#86efac" dot={{ fill: '#86efac' }} />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <CardTitle>השוואה גרפית</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as ChartType)}>
              <ToggleGroupItem value="bar" aria-label="תרשים עמודות">
                <ChartBar className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="radar" aria-label="תרשים רדאר">
                <ChartRadar className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="line" aria-label="תרשים קווים">
                <LineChartIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="single" value={comparisonType} onValueChange={(value) => value && setComparisonType(value as ComparisonType)}>
              <ToggleGroupItem value="optimization" aria-label="השוואת אופטימיזציה">
                אופטימיזציה
              </ToggleGroupItem>
              <ToggleGroupItem value="direction" aria-label="השוואת כיוונים">
                כיוונים
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};
