
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LineChart, Line
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChartBar, LineChart as LineChartIcon, Radar as RadarIcon } from "lucide-react";
import type { RunResult } from "@/types/traffic";

interface OptimizationChartsProps {
  baseline: RunResult;
  optimized: RunResult;
}

type ChartType = 'bar' | 'radar' | 'line';

export const OptimizationCharts = ({ baseline, optimized }: OptimizationChartsProps) => {
  const [chartType, setChartType] = useState<ChartType>('bar');

  // הכנת נתונים לרוחב פס
  const bandwidthData = [{
    metric: 'רוחב מסדרון',
    'מעלה הזרם - בסיס': Number(baseline.corridorBW_up.toFixed(1)),
    'מעלה הזרם - אופטימיזציה': Number(optimized.corridorBW_up.toFixed(1)),
    'מורד הזרם - בסיס': Number(baseline.corridorBW_down.toFixed(1)),
    'מורד הזרם - אופטימיזציה': Number(optimized.corridorBW_down.toFixed(1))
  }];

  // הכנת נתונים לעיכובים
  const delaysData = baseline.avg_delay_up?.map((_, index) => ({
    metric: `צמתים ${index + 1}-${index + 2}`,
    'עיכוב ממוצע מעלה - בסיס': Number(baseline.avg_delay_up[index].toFixed(1)),
    'עיכוב ממוצע מעלה - אופטימיזציה': Number(optimized.avg_delay_up?.[index].toFixed(1)),
    'עיכוב ממוצע מורד - בסיס': Number(baseline.avg_delay_down?.[index].toFixed(1)),
    'עיכוב ממוצע מורד - אופטימיזציה': Number(optimized.avg_delay_down?.[index].toFixed(1)),
    'עיכוב מקסימלי מעלה - בסיס': Number(baseline.max_delay_up[index].toFixed(1)),
    'עיכוב מקסימלי מעלה - אופטימיזציה': Number(optimized.max_delay_up?.[index].toFixed(1)),
    'עיכוב מקסימלי מורד - בסיס': Number(baseline.max_delay_down?.[index].toFixed(1)),
    'עיכוב מקסימלי מורד - אופטימיזציה': Number(optimized.max_delay_down?.[index].toFixed(1))
  })) || [];

  const renderChart = (data: any[], title: string) => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(data[0] || {}).filter(key => key !== 'metric').map((key, index) => (
                <Bar 
                  key={key} 
                  dataKey={key} 
                  fill={key.includes('מעלה') ? 
                    (key.includes('בסיס') ? '#93c5fd' : '#22c55e') : 
                    (key.includes('בסיס') ? '#bfdbfe' : '#86efac')}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              {Object.keys(data[0] || {}).filter(key => key !== 'metric').map((key, index) => (
                <Radar 
                  key={key}
                  name={key}
                  dataKey={key}
                  stroke={key.includes('מעלה') ? 
                    (key.includes('בסיס') ? '#93c5fd' : '#22c55e') : 
                    (key.includes('בסיס') ? '#bfdbfe' : '#86efac')}
                  fill={key.includes('מעלה') ? 
                    (key.includes('בסיס') ? '#93c5fd' : '#22c55e') : 
                    (key.includes('בסיס') ? '#bfdbfe' : '#86efac')}
                  fillOpacity={0.6}
                />
              ))}
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              {Object.keys(data[0] || {}).filter(key => key !== 'metric').map((key, index) => (
                <Line 
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={key.includes('מעלה') ? 
                    (key.includes('בסיס') ? '#93c5fd' : '#22c55e') : 
                    (key.includes('בסיס') ? '#bfdbfe' : '#86efac')}
                  dot={{ fill: key.includes('מעלה') ? 
                    (key.includes('בסיס') ? '#93c5fd' : '#22c55e') : 
                    (key.includes('בסיס') ? '#bfdbfe' : '#86efac') }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="space-y-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <CardTitle>סוג תצוגה</CardTitle>
            <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as ChartType)}>
              <ToggleGroupItem value="bar" aria-label="תרשים עמודות">
                <ChartBar className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="radar" aria-label="תרשים רדאר">
                <RadarIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="line" aria-label="תרשים קווים">
                <LineChartIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>רוחב פס מסדרון</CardTitle>
        </CardHeader>
        <CardContent>
          {renderChart(bandwidthData, 'רוחב פס מסדרון')}
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>עיכובים ממוצעים ומקסימליים</CardTitle>
        </CardHeader>
        <CardContent>
          {renderChart(delaysData, 'עיכובים')}
        </CardContent>
      </Card>
    </div>
  );
};
