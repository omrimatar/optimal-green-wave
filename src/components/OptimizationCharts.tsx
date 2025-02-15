
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
    // רק אם שני הערכים קיימים
    baseline.corridorBW_up !== null && optimized.corridorBW_up !== null ? {
      metric: 'רוחב מסדרון למעלה',
      בסיס: Number(baseline.corridorBW_up.toFixed(1)),
      אופטימיזציה: Number(optimized.corridorBW_up.toFixed(1))
    } : null,
    baseline.corridorBW_down !== null && optimized.corridorBW_down !== null ? {
      metric: 'רוחב מסדרון למטה',
      בסיס: Number(baseline.corridorBW_down.toFixed(1)),
      אופטימיזציה: Number(optimized.corridorBW_down.toFixed(1))
    } : null,
    ...(baseline.avg_delay_up && optimized.avg_delay_up ? 
      baseline.avg_delay_up.map((val, index) => {
        const optVal = optimized.avg_delay_up?.[index];
        return val !== null && optVal !== null ? {
          metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
          בסיס: -Number(val.toFixed(1)),
          אופטימיזציה: -Number(optVal.toFixed(1))
        } : null;
      }).filter(Boolean) : []),
    ...(baseline.max_delay_up && optimized.max_delay_up ?
      baseline.max_delay_up.map((val, index) => {
        const optVal = optimized.max_delay_up?.[index];
        return val !== null && optVal !== null ? {
          metric: `עיכוב מקסימלי ${index + 1}-${index + 2}`,
          בסיס: -Number(val.toFixed(1)),
          אופטימיזציה: -Number(optVal.toFixed(1))
        } : null;
      }).filter(Boolean) : [])
  ].filter(Boolean);

  // הכנת נתונים להשוואת כיוונים
  const directionData = [
    (baseline.corridorBW_up !== null && optimized.corridorBW_up !== null &&
     baseline.corridorBW_down !== null && optimized.corridorBW_down !== null) ? {
      metric: 'רוחב מסדרון',
      'מעלה הזרם - בסיס': Number(baseline.corridorBW_up.toFixed(1)),
      'מעלה הזרם - אופטימיזציה': Number(optimized.corridorBW_up.toFixed(1)),
      'מורד הזרם - בסיס': Number(baseline.corridorBW_down.toFixed(1)),
      'מורד הזרם - אופטימיזציה': Number(optimized.corridorBW_down.toFixed(1))
    } : null,
    ...(baseline.avg_delay_up && optimized.avg_delay_up && 
        baseline.avg_delay_down && optimized.avg_delay_down ?
      baseline.avg_delay_up.map((val, index) => {
        const optValUp = optimized.avg_delay_up?.[index];
        const baseValDown = baseline.avg_delay_down?.[index];
        const optValDown = optimized.avg_delay_down?.[index];
        return val !== null && optValUp !== null && baseValDown !== null && optValDown !== null ? {
          metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
          'מעלה הזרם - בסיס': -Number(val.toFixed(1)),
          'מעלה הזרם - אופטימיזציה': -Number(optValUp.toFixed(1)),
          'מורד הזרם - בסיס': -Number(baseValDown.toFixed(1)),
          'מורד הזרם - אופטימיזציה': -Number(optValDown.toFixed(1))
        } : null;
      }).filter(Boolean) : [])
  ].filter(Boolean);

  // הכנת נתונים לגרף רדאר - רק אם יש ערכים בשני המקרים
  const calculateAverage = (arr: number[] = []): number | null => {
    if (!arr?.length) return null;
    const validValues = arr.filter(val => val !== null);
    if (validValues.length === 0) return null;
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  };

  const radarData = [
    baseline.corridorBW_up !== null && optimized.corridorBW_up !== null ? {
      metric: 'רוחב מסדרון למעלה',
      לפני: Number(baseline.corridorBW_up.toFixed(1)),
      אחרי: Number(optimized.corridorBW_up.toFixed(1)),
    } : null,
    baseline.corridorBW_down !== null && optimized.corridorBW_down !== null ? {
      metric: 'רוחב מסדרון למטה',
      לפני: Number(baseline.corridorBW_down.toFixed(1)),
      אחרי: Number(optimized.corridorBW_down.toFixed(1)),
    } : null
  ].filter(Boolean);

  // הוספת עיכובים ממוצעים רק אם הם קיימים
  const avgDelayUp = calculateAverage(baseline.avg_delay_up ?? []);
  const avgDelayUpOpt = calculateAverage(optimized.avg_delay_up ?? []);
  if (avgDelayUp !== null && avgDelayUpOpt !== null) {
    radarData.push({
      metric: 'עיכוב ממוצע למעלה',
      לפני: -Number(avgDelayUp.toFixed(1)),
      אחרי: -Number(avgDelayUpOpt.toFixed(1)),
    });
  }

  const avgDelayDown = calculateAverage(baseline.avg_delay_down ?? []);
  const avgDelayDownOpt = calculateAverage(optimized.avg_delay_down ?? []);
  if (avgDelayDown !== null && avgDelayDownOpt !== null) {
    radarData.push({
      metric: 'עיכוב ממוצע למטה',
      לפני: -Number(avgDelayDown.toFixed(1)),
      אחרי: -Number(avgDelayDownOpt.toFixed(1)),
    });
  }

  const currentData = chartType === 'radar' ? radarData : 
                     comparisonType === 'optimization' ? optimizationData : directionData;

  const renderChart = () => {
    if (currentData.length === 0) {
      return <div className="text-center py-8 text-gray-500">אין נתונים זמינים להצגה</div>;
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
            <RadarChart data={radarData}>
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
