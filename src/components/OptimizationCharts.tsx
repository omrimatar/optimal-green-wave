
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChartBar, Radar as RadarIcon } from "lucide-react";
import type { RunResult } from "@/types/traffic";

interface OptimizationChartsProps {
  baseline: RunResult;
  optimized: RunResult;
}

type ChartType = 'bar' | 'radar';
type ComparisonType = 'optimization' | 'direction';

export const OptimizationCharts = ({ baseline, optimized }: OptimizationChartsProps) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('optimization');

  // הכנת נתונים להשוואת אופטימיזציה
  const optimizationData = [
    {
      metric: 'רוחב פס למעלה',
      בסיס: baseline.corridorBW_up !== null ? Number(baseline.corridorBW_up.toFixed(1)) : null,
      אופטימיזציה: optimized.corridorBW_up !== null ? Number(optimized.corridorBW_up.toFixed(1)) : null
    },
    {
      metric: 'רוחב פס למטה',
      בסיס: baseline.corridorBW_down !== null ? Number(baseline.corridorBW_down.toFixed(1)) : null,
      אופטימיזציה: optimized.corridorBW_down !== null ? Number(optimized.corridorBW_down.toFixed(1)) : null
    },
    ...(baseline.avg_delay_up?.map((delay, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      בסיס: delay !== null ? -Number(delay.toFixed(1)) : null,
      אופטימיזציה: optimized.avg_delay_up?.[index] !== null ? -Number(optimized.avg_delay_up[index].toFixed(1)) : null
    })) || []),
    ...(baseline.max_delay_up?.map((delay, index) => ({
      metric: `עיכוב מקסימלי ${index + 1}-${index + 2}`,
      בסיס: delay !== null ? -Number(delay.toFixed(1)) : null,
      אופטימיזציה: optimized.max_delay_up?.[index] !== null ? -Number(optimized.max_delay_up[index].toFixed(1)) : null
    })) || [])
  ];

  // הכנת נתונים להשוואת כיוונים
  const delayData = baseline.avg_delay_up && baseline.avg_delay_down ? 
    baseline.avg_delay_up.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      'מעלה הזרם - בסיס': baseline.avg_delay_up[index] !== null ? -Number(baseline.avg_delay_up[index].toFixed(1)) : null,
      'מעלה הזרם - אופטימיזציה': optimized.avg_delay_up?.[index] !== null ? -Number(optimized.avg_delay_up[index].toFixed(1)) : null,
      'מורד הזרם - בסיס': baseline.avg_delay_down[index] !== null ? -Number(baseline.avg_delay_down[index].toFixed(1)) : null,
      'מורד הזרם - אופטימיזציה': optimized.avg_delay_down?.[index] !== null ? -Number(optimized.avg_delay_down[index].toFixed(1)) : null
    })) : [];

  const directionData = [
    {
      metric: 'רוחב פס',
      'מעלה הזרם - בסיס': baseline.corridorBW_up !== null ? Number(baseline.corridorBW_up.toFixed(1)) : null,
      'מעלה הזרם - אופטימיזציה': optimized.corridorBW_up !== null ? Number(optimized.corridorBW_up.toFixed(1)) : null,
      'מורד הזרם - בסיס': baseline.corridorBW_down !== null ? Number(baseline.corridorBW_down.toFixed(1)) : null,
      'מורד הזרם - אופטימיזציה': optimized.corridorBW_down !== null ? Number(optimized.corridorBW_down.toFixed(1)) : null
    },
    ...delayData
  ];

  // הכנת נתונים לגרף רדאר - 4 מדדים
  const calculateAverage = (arr: (number | null)[] = []): number | null => {
    const validNumbers = arr.filter((val): val is number => val !== null);
    if (validNumbers.length === 0) return null;
    return validNumbers.reduce((sum, val) => sum + val, 0) / validNumbers.length;
  };

  const formatValue = (value: number | null): number | null => {
    return value !== null ? Number(value.toFixed(1)) : null;
  };

  const negateValue = (value: number | null): number | null => {
    return value !== null ? -value : null;
  };

  const radarData = [
    {
      metric: 'רוחב פס למעלה',
      לפני: formatValue(baseline.corridorBW_up),
      אחרי: formatValue(optimized.corridorBW_up),
    },
    {
      metric: 'רוחב פס למטה',
      לפני: formatValue(baseline.corridorBW_down),
      אחרי: formatValue(optimized.corridorBW_down),
    },
    {
      metric: 'עיכוב ממוצע למעלה',
      לפני: formatValue(negateValue(calculateAverage(baseline.avg_delay_up ?? []))),
      אחרי: formatValue(negateValue(calculateAverage(optimized.avg_delay_up ?? []))),
    },
    {
      metric: 'עיכוב ממוצע למטה',
      לפני: formatValue(negateValue(calculateAverage(baseline.avg_delay_down ?? []))),
      אחרי: formatValue(negateValue(calculateAverage(optimized.avg_delay_down ?? []))),
    }
  ];

  const currentData = chartType === 'radar' ? radarData.filter(item => 
    item.לפני !== null || item.אחרי !== null
  ) : comparisonType === 'optimization' ? optimizationData.filter(item =>
    item.בסיס !== null || item.אופטימיזציה !== null
  ) : directionData.filter(item => 
    item['מעלה הזרם - בסיס'] !== null || 
    item['מעלה הזרם - אופטימיזציה'] !== null ||
    item['מורד הזרם - בסיס'] !== null ||
    item['מורד הזרם - אופטימיזציה'] !== null
  );

  const renderChart = () => {
    if (currentData.length === 0) {
      return <div className="text-center py-8 text-gray-500">אין מספיק נתונים להצגת הגרף</div>;
    }

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
                  <Bar dataKey="בסיס" fill="#8B5CF6" />
                  <Bar dataKey="אופטימיזציה" fill="#F97316" />
                </>
              ) : (
                <>
                  <Bar dataKey="מעלה הזרם - בסיס" fill="#8B5CF6" />
                  <Bar dataKey="מעלה הזרם - אופטימיזציה" fill="#C084FC" />
                  <Bar dataKey="מורד הזרם - בסיס" fill="#F97316" />
                  <Bar dataKey="מורד הזרם - אופטימיזציה" fill="#FB923C" />
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
              <PolarRadiusAxis angle={90} domain={[-50, 50]} />
              <Radar 
                name="לפני אופטימיזציה" 
                dataKey="לפני"
                stroke="#8B5CF6" 
                fill="#8B5CF6" 
                fillOpacity={0.6} 
              />
              <Radar 
                name="אחרי אופטימיזציה" 
                dataKey="אחרי"
                stroke="#F97316" 
                fill="#F97316" 
                fillOpacity={0.6} 
              />
              <Legend />
            </RadarChart>
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
                <RadarIcon className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            {chartType !== 'radar' && (
              <ToggleGroup type="single" value={comparisonType} onValueChange={(value) => value && setComparisonType(value as ComparisonType)}>
                <ToggleGroupItem value="optimization" aria-label="השוואת אופטימיזציה">
                  אופטימיזציה
                </ToggleGroupItem>
                <ToggleGroupItem value="direction" aria-label="השוואת כיוונים">
                  כיוונים
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};
