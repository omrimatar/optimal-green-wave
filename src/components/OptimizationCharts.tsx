
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ReferenceLine
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ChartBar, Radar as RadarIcon, SplitSquareVertical } from "lucide-react";
import type { RunResult } from "@/types/traffic";

interface OptimizationChartsProps {
  baseline: RunResult;
  optimized: RunResult;
  mode: 'display' | 'calculate' | 'manual';
}

type ChartType = 'bar' | 'radar' | 'butterfly';
type ComparisonType = 'optimization' | 'direction';

export const OptimizationCharts = ({ baseline, optimized, mode }: OptimizationChartsProps) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('optimization');

  const getLabels = () => {
    if (mode === 'manual') {
      return {
        baseline: 'מצב התחלתי',
        optimized: 'מצב ידני'
      };
    }
    return {
      baseline: 'בסיס',
      optimized: 'אופטימיזציה'
    };
  };

  const labels = getLabels();

  // Define colors by metric type
  const colors = {
    positive: {
      baseline: '#0EA5E9',  // Ocean Blue for baseline
      optimized: '#33C3F0'  // Sky Blue for optimized
    },
    negative: {
      baseline: '#ea384c',  // Red for baseline
      optimized: '#F97316'  // Orange for optimized
    }
  };

  const optimizationData = [
    {
      metric: 'רוחב מסדרון למעלה',
      [labels.baseline]: Number((baseline.corridor_bandwidth_up || 0).toFixed(1)),
      [labels.optimized]: Number((optimized.corridor_bandwidth_up || 0).toFixed(1)),
      category: 'positive'
    },
    {
      metric: 'רוחב מסדרון למטה',
      [labels.baseline]: Number((baseline.corridor_bandwidth_down || 0).toFixed(1)),
      [labels.optimized]: Number((optimized.corridor_bandwidth_down || 0).toFixed(1)),
      category: 'positive'
    },
    ...(baseline.avg_delay_up?.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      [labels.baseline]: -Number(baseline.avg_delay_up[index].toFixed(1)),
      [labels.optimized]: -Number(optimized.avg_delay_up?.[index].toFixed(1)),
      category: 'negative'
    })) || []),
    ...(baseline.max_delay_up?.map((_, index) => ({
      metric: `עיכוב מקסימלי ${index + 1}-${index + 2}`,
      [labels.baseline]: -Number(baseline.max_delay_up[index].toFixed(1)),
      [labels.optimized]: -Number(optimized.max_delay_up?.[index].toFixed(1)),
      category: 'negative'
    })) || [])
  ];

  // Prepare data for butterfly chart
  const butterflyData = optimizationData.map(item => ({
    metric: item.metric,
    [labels.baseline]: typeof item[labels.baseline] === 'number' ? -Math.abs(Number(item[labels.baseline])) : 0,
    [labels.optimized]: typeof item[labels.optimized] === 'number' ? Math.abs(Number(item[labels.optimized])) : 0,
    category: item.category
  }));

  const directionData = [
    {
      metric: 'רוחב מסדרון',
      'מעלה הזרם - בסיס': Number((baseline.corridor_bandwidth_up || 0).toFixed(1)),
      'מעלה הזרם - אופטימיזציה': Number((optimized.corridor_bandwidth_up || 0).toFixed(1)),
      'מורד הזרם - בסיס': Number((baseline.corridor_bandwidth_down || 0).toFixed(1)),
      'מורד הזרם - אופטימיזציה': Number((optimized.corridor_bandwidth_down || 0).toFixed(1)),
      category: 'positive'
    },
    ...(baseline.avg_delay_up?.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      'מעלה הזרם - בסיס': -Number(baseline.avg_delay_up[index].toFixed(1)),
      'מעלה הזרם - אופטימיזציה': -Number(optimized.avg_delay_up?.[index].toFixed(1)),
      'מורד הזרם - בסיס': -Number(baseline.avg_delay_down?.[index].toFixed(1)),
      'מורד הזרם - אופטימיזציה': -Number(optimized.avg_delay_down?.[index].toFixed(1)),
      category: 'negative'
    })) || [])
  ];

  const calculateAverage = (arr: number[] = []): number => {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  };

  const radarData = [
    {
      metric: 'רוחב מסדרון למעלה',
      לפני: Number((baseline.corridor_bandwidth_up || 0).toFixed(1)),
      אחרי: Number((optimized.corridor_bandwidth_up || 0).toFixed(1)),
      category: 'positive'
    },
    {
      metric: 'רוחב מסדרון למטה',
      לפני: Number((baseline.corridor_bandwidth_down || 0).toFixed(1)),
      אחרי: Number((optimized.corridor_bandwidth_down || 0).toFixed(1)),
      category: 'positive'
    },
    {
      metric: 'עיכוב ממוצע למעלה',
      לפני: -Number(calculateAverage(baseline.avg_delay_up).toFixed(1)),
      אחרי: -Number(calculateAverage(optimized.avg_delay_up).toFixed(1)),
      category: 'negative'
    },
    {
      metric: 'עיכוב ממוצע למטה',
      לפני: -Number(calculateAverage(baseline.avg_delay_down).toFixed(1)),
      אחרי: -Number(calculateAverage(optimized.avg_delay_down).toFixed(1)),
      category: 'negative'
    }
  ];

  const currentData = 
    chartType === 'radar' ? radarData : 
    chartType === 'butterfly' ? butterflyData :
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
                  <Bar 
                    dataKey={labels.baseline} 
                    fill={colors.positive.baseline}
                    name={`${labels.baseline}`}
                  />
                  <Bar 
                    dataKey={labels.optimized} 
                    fill={colors.positive.optimized}
                    name={`${labels.optimized}`}
                  />
                </>
              ) : (
                <>
                  <Bar dataKey="מעלה הזרם - בסיס" fill={colors.positive.baseline} />
                  <Bar dataKey="מעלה הזרם - אופטימיזציה" fill={colors.positive.optimized} />
                  <Bar dataKey="מורד הזרם - בסיס" fill={colors.negative.baseline} />
                  <Bar dataKey="מורד הזרם - אופטימיזציה" fill={colors.negative.optimized} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[-50, 50]} />
              <Radar 
                name={labels.baseline}
                dataKey="לפני"
                stroke={colors.positive.baseline} 
                fill={colors.positive.baseline} 
                fillOpacity={0.6} 
              />
              <Radar 
                name={labels.optimized}
                dataKey="אחרי"
                stroke={colors.positive.optimized} 
                fill={colors.positive.optimized} 
                fillOpacity={0.6} 
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'butterfly':
        // Group metrics by their name (without the numbers) to align on the same Y axis
        const groupedMetrics = butterflyData.reduce((acc, item) => {
          const baseMetricName = item.metric.replace(/\d+-\d+$/, '').trim();
          if (!acc[baseMetricName]) {
            acc[baseMetricName] = [];
          }
          acc[baseMetricName].push(item);
          return acc;
        }, {} as Record<string, typeof butterflyData>);

        // Flatten the grouped metrics and ensure original order is preserved
        const organizedData = Object.values(groupedMetrics).flat();
        
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={organizedData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="metric" width={150} />
              <Tooltip 
                formatter={(value, name, props) => {
                  // Show absolute values in tooltip
                  const displayValue = Math.abs(Number(value));
                  return [displayValue, name];
                }}
              />
              <Legend />
              <ReferenceLine x={0} stroke="#000" />
              <Bar 
                dataKey={labels.baseline} 
                fill={colors.positive.baseline} 
                name={`${labels.baseline} (מצב נוכחי)`}
              />
              <Bar 
                dataKey={labels.optimized} 
                fill={colors.positive.optimized} 
                name={`${labels.optimized} (מצב משופר)`}
              />
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <CardTitle>השוואה גרפית - {mode === 'manual' ? 'מצב ידני' : 'אופטימיזציה'}</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row">
            <ToggleGroup type="single" value={chartType} onValueChange={(value) => value && setChartType(value as ChartType)}>
              <ToggleGroupItem value="bar" aria-label="תרשים עמודות">
                <ChartBar className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="radar" aria-label="תרשים רדאר">
                <RadarIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="butterfly" aria-label="תרשים פרפר">
                <SplitSquareVertical className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            {chartType !== 'radar' && chartType !== 'butterfly' && (
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
