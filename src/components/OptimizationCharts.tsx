
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
type ComparisonType = 'optimization' | 'direction';

export const OptimizationCharts = ({ baseline, optimized }: OptimizationChartsProps) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('optimization');

  // הכנת נתונים להשוואת אופטימיזציה
  const optimizationData = [
    {
      metric: 'רוחב מסדרון למעלה',
      בסיס: Number(baseline.corridorBW_up.toFixed(1)),
      אופטימיזציה: Number(optimized.corridorBW_up.toFixed(1)),
      מיקום: 0
    },
    {
      metric: 'רוחב מסדרון למטה',
      בסיס: Number(baseline.corridorBW_down.toFixed(1)),
      אופטימיזציה: Number(optimized.corridorBW_down.toFixed(1)),
      מיקום: 1
    },
    ...(baseline.avg_delay_up?.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      בסיס: -Number(baseline.avg_delay_up[index].toFixed(1)),
      אופטימיזציה: -Number(optimized.avg_delay_up?.[index].toFixed(1)),
      מיקום: index + 2
    })) || []),
    ...(baseline.max_delay_up?.map((_, index) => ({
      metric: `עיכוב מקסימלי ${index + 1}-${index + 2}`,
      בסיס: -Number(baseline.max_delay_up[index].toFixed(1)),
      אופטימיזציה: -Number(optimized.max_delay_up?.[index].toFixed(1)),
      מיקום: index + baseline.avg_delay_up?.length! + 2
    })) || [])
  ];

  // הכנת נתונים להשוואת כיוונים
  const directionData = [
    {
      metric: 'רוחב מסדרון',
      'מעלה הזרם - בסיס': Number(baseline.corridorBW_up.toFixed(1)),
      'מעלה הזרם - אופטימיזציה': Number(optimized.corridorBW_up.toFixed(1)),
      'מורד הזרם - בסיס': Number(baseline.corridorBW_down.toFixed(1)),
      'מורד הזרם - אופטימיזציה': Number(optimized.corridorBW_down.toFixed(1)),
      מיקום: 0
    },
    ...(baseline.avg_delay_up?.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      'מעלה הזרם - בסיס': -Number(baseline.avg_delay_up[index].toFixed(1)),
      'מעלה הזרם - אופטימיזציה': -Number(optimized.avg_delay_up?.[index].toFixed(1)),
      'מורד הזרם - בסיס': -Number(baseline.avg_delay_down?.[index].toFixed(1)),
      'מורד הזרם - אופטימיזציה': -Number(optimized.avg_delay_down?.[index].toFixed(1)),
      מיקום: index + 1
    })) || [])
  ];

  // הכנת נתונים לגרף רדאר
  const radarData = [
    ...(baseline.avg_delay_up?.map((_, index) => ({
      metric: `קטע ${index + 1}-${index + 2}`,
      'עיכוב מעלה - בסיס': -Number(baseline.avg_delay_up[index].toFixed(1)),
      'עיכוב מעלה - אופטימיזציה': -Number(optimized.avg_delay_up?.[index].toFixed(1)),
      'עיכוב מורד - בסיס': -Number(baseline.avg_delay_down?.[index].toFixed(1)),
      'עיכוב מורד - אופטימיזציה': -Number(optimized.avg_delay_down?.[index].toFixed(1)),
      'רוחב מסדרון מעלה - בסיס': Number(baseline.corridorBW_up.toFixed(1)),
      'רוחב מסדרון מעלה - אופטימיזציה': Number(optimized.corridorBW_up.toFixed(1)),
      'רוחב מסדרון מורד - בסיס': Number(baseline.corridorBW_down.toFixed(1)),
      'רוחב מסדרון מורד - אופטימיזציה': Number(optimized.corridorBW_down.toFixed(1))
    })) || [])
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
              <Radar name="עיכוב מעלה - בסיס" dataKey="עיכוב מעלה - בסיס" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.6} />
              <Radar name="עיכוב מעלה - אופטימיזציה" dataKey="עיכוב מעלה - אופטימיזציה" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
              <Radar name="עיכוב מורד - בסיס" dataKey="עיכוב מורד - בסיס" stroke="#bfdbfe" fill="#bfdbfe" fillOpacity={0.6} />
              <Radar name="עיכוב מורד - אופטימיזציה" dataKey="עיכוב מורד - אופטימיזציה" stroke="#86efac" fill="#86efac" fillOpacity={0.6} />
              <Radar name="רוחב מסדרון מעלה - בסיס" dataKey="רוחב מסדרון מעלה - בסיס" stroke="#93c5fd" fill="#93c5fd" fillOpacity={0.6} />
              <Radar name="רוחב מסדרון מעלה - אופטימיזציה" dataKey="רוחב מסדרון מעלה - אופטימיזציה" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
              <Radar name="רוחב מסדרון מורד - בסיס" dataKey="רוחב מסדרון מורד - בסיס" stroke="#bfdbfe" fill="#bfdbfe" fillOpacity={0.6} />
              <Radar name="רוחב מסדרון מורד - אופטימיזציה" dataKey="רוחב מסדרון מורד - אופטימיזציה" stroke="#86efac" fill="#86efac" fillOpacity={0.6} />
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
                <RadarIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="line" aria-label="תרשים קווים">
                <LineChartIcon className="h-4 w-4" />
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
