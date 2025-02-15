
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
      metric: 'רוחב מסדרון למעלה',
      בסיס: Number(baseline.corridorBW_up.toFixed(1)),
      אופטימיזציה: Number(optimized.corridorBW_up.toFixed(1))
    },
    {
      metric: 'רוחב מסדרון למטה',
      בסיס: Number(baseline.corridorBW_down.toFixed(1)),
      אופטימיזציה: Number(optimized.corridorBW_down.toFixed(1))
    },
    ...(baseline.avg_delay_up?.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      בסיס: -Number(baseline.avg_delay_up[index].toFixed(1)),
      אופטימיזציה: -Number(optimized.avg_delay_up?.[index].toFixed(1))
    })) || []),
    ...(baseline.max_delay_up?.map((_, index) => ({
      metric: `עיכוב מקסימלי ${index + 1}-${index + 2}`,
      בסיס: -Number(baseline.max_delay_up[index].toFixed(1)),
      אופטימיזציה: -Number(optimized.max_delay_up?.[index].toFixed(1))
    })) || [])
  ];

  // הכנת נתונים להשוואת כיוונים
  const directionData = [
    {
      metric: 'רוחב מסדרון',
      'מעלה הזרם - בסיס': Number(baseline.corridorBW_up.toFixed(1)),
      'מעלה הזרם - אופטימיזציה': Number(optimized.corridorBW_up.toFixed(1)),
      'מורד הזרם - בסיס': Number(baseline.corridorBW_down.toFixed(1)),
      'מורד הזרם - אופטימיזציה': Number(optimized.corridorBW_down.toFixed(1))
    },
    ...(baseline.avg_delay_up?.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      'מעלה הזרם - בסיס': -Number(baseline.avg_delay_up[index].toFixed(1)),
      'מעלה הזרם - אופטימיזציה': -Number(optimized.avg_delay_up?.[index].toFixed(1)),
      'מורד הזרם - בסיס': -Number(baseline.avg_delay_down?.[index].toFixed(1)),
      'מורד הזרם - אופטימיזציה': -Number(optimized.avg_delay_down?.[index].toFixed(1))
    })) || [])
  ];

  // הכנת נתונים לגרף רדאר - רק עיכובים ממוצעים ורוחב מסדרון
  const radarData = [
    {
      metric: 'כללי',
      'עיכוב מעלה': -Number(baseline.avg_delay_up?.[0].toFixed(1) || 0),
      'עיכוב מטה': -Number(baseline.avg_delay_down?.[0].toFixed(1) || 0),
      'רוחב מסדרון מעלה': Number(baseline.corridorBW_up.toFixed(1)),
      'רוחב מסדרון מטה': Number(baseline.corridorBW_down.toFixed(1))
    }
  ];

  const currentData = chartType === 'radar' ? radarData : 
                     comparisonType === 'optimization' ? optimizationData : directionData;

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
                  <Bar dataKey="מעלה הזרם - בסיס" fill="#F2FCE2" />
                  <Bar dataKey="מעלה הזרם - אופטימיזציה" fill="#D3E4FD" />
                  <Bar dataKey="מורד הזרם - בסיס" fill="#FEC6A1" />
                  <Bar dataKey="מורד הזרם - אופטימיזציה" fill="#FDE1D3" />
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
              <Radar name="עיכוב מעלה" dataKey="עיכוב מעלה" stroke="#F2FCE2" fill="#F2FCE2" fillOpacity={0.6} />
              <Radar name="עיכוב מטה" dataKey="עיכוב מטה" stroke="#FEC6A1" fill="#FEC6A1" fillOpacity={0.6} />
              <Radar name="רוחב מסדרון מעלה" dataKey="רוחב מסדרון מעלה" stroke="#D3E4FD" fill="#D3E4FD" fillOpacity={0.6} />
              <Radar name="רוחב מסדרון מטה" dataKey="רוחב מסדרון מטה" stroke="#FDE1D3" fill="#FDE1D3" fillOpacity={0.6} />
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
