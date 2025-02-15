
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

  // הכנת נתונים לגרף רדאר - חישוב ממוצעים
  const calculateAverage = (arr: number[] = []): number => {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  };

  const radarData = [
    {
      metric: "מדדי ביצוע",
      'רוחב מסדרון למעלה - לפני': Number(baseline.corridorBW_up.toFixed(1)),
      'רוחב מסדרון למעלה - אחרי': Number(optimized.corridorBW_up.toFixed(1)),
      'רוחב מסדרון למטה - לפני': Number(baseline.corridorBW_down.toFixed(1)),
      'רוחב מסדרון למטה - אחרי': Number(optimized.corridorBW_down.toFixed(1)),
      'עיכוב ממוצע למעלה - לפני': -Number(calculateAverage(baseline.avg_delay_up).toFixed(1)),
      'עיכוב ממוצע למעלה - אחרי': -Number(calculateAverage(optimized.avg_delay_up).toFixed(1)),
      'עיכוב ממוצע למטה - לפני': -Number(calculateAverage(baseline.avg_delay_down).toFixed(1)),
      'עיכוב ממוצע למטה - אחרי': -Number(calculateAverage(optimized.avg_delay_down).toFixed(1))
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
            <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis />
              <Radar 
                name="לפני אופטימיזציה" 
                dataKey="רוחב מסדרון למעלה - לפני" 
                stroke="#1EAEDB" 
                fill="#1EAEDB" 
                fillOpacity={0.6} 
              />
              <Radar 
                name="אחרי אופטימיזציה" 
                dataKey="רוחב מסדרון למעלה - אחרי" 
                stroke="#22c55e" 
                fill="#22c55e" 
                fillOpacity={0.6} 
              />
              <Radar 
                dataKey="רוחב מסדרון למטה - לפני" 
                stroke="#1EAEDB" 
                fill="#1EAEDB" 
                fillOpacity={0.6} 
              />
              <Radar 
                dataKey="רוחב מסדרון למטה - אחרי" 
                stroke="#22c55e" 
                fill="#22c55e" 
                fillOpacity={0.6} 
              />
              <Radar 
                dataKey="עיכוב ממוצע למעלה - לפני" 
                stroke="#1EAEDB" 
                fill="#1EAEDB" 
                fillOpacity={0.6} 
              />
              <Radar 
                dataKey="עיכוב ממוצע למעלה - אחרי" 
                stroke="#22c55e" 
                fill="#22c55e" 
                fillOpacity={0.6} 
              />
              <Radar 
                dataKey="עיכוב ממוצע למטה - לפני" 
                stroke="#1EAEDB" 
                fill="#1EAEDB" 
                fillOpacity={0.6} 
              />
              <Radar 
                dataKey="עיכוב ממוצע למטה - אחרי" 
                stroke="#22c55e" 
                fill="#22c55e" 
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
