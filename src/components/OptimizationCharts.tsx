import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ReferenceLine, Cell, LabelList
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { ChartBar, Radar as RadarIcon, SplitSquareVertical, ArrowLeftRight } from "lucide-react";
import type { RunResult } from "@/types/traffic";
import { useLanguage } from "@/contexts/LanguageContext";

interface OptimizationChartsProps {
  baseline: RunResult;
  optimized: RunResult;
  mode: 'display' | 'calculate' | 'manual';
}

type ChartType = 'bar' | 'radar' | 'butterfly';
type ComparisonType = 'optimization' | 'direction';
type ViewMode = 'comparison' | 'single';

export const OptimizationCharts = ({ baseline, optimized, mode }: OptimizationChartsProps) => {
  const [chartType, setChartType] = useState<ChartType>('butterfly');
  const [comparisonType, setComparisonType] = useState<ComparisonType>('optimization');
  const [viewMode, setViewMode] = useState<ViewMode>('comparison');

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

  const getChartTitle = () => {
    if (mode === 'display') {
      return 'השוואה גרפית-ידני';
    } else if (mode === 'manual') {
      return 'השוואה גרפית - מצב ידני';
    } else {
      return 'השוואה גרפית - אופטימיזציה';
    }
  };

  const colors = {
    positive: {
      baseline: '#0EA5E9',
      optimized: '#33C3F0'
    },
    negative: {
      baseline: '#ea384c',
      optimized: '#F97316'
    },
    radar: {
      baseline: '#3498DB',
      optimized: '#E67E22'
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

  const dataForSingleView = mode === 'display' ? baseline : optimized;

  const directionOnlyData = [
    {
      metric: 'רוחב מסדרון',
      'מעלה הזרם': Number((dataForSingleView).corridor_bandwidth_up || 0).toFixed(1),
      'מורד הזרם': Number((dataForSingleView).corridor_bandwidth_down || 0).toFixed(1),
      category: 'positive'
    },
    ...((dataForSingleView).avg_delay_up?.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      'מעלה הזרם': -Number((dataForSingleView).avg_delay_up?.[index].toFixed(1)),
      'מורד הזרם': -Number((dataForSingleView).avg_delay_down?.[index].toFixed(1)),
      category: 'negative'
    })) || [])
  ];

  const butterflyDirectionData = directionOnlyData.map(item => ({
    metric: item.metric,
    'מעלה הזרם': typeof item['מעלה הזרם'] === 'number' ? 
      Math.abs(Number(item['מעלה הזרם'])) : 
      Math.abs(parseFloat(String(item['מעלה הזרם']))),
    'מורד הזרם': typeof item['מורד הזרם'] === 'number' ? 
      -Math.abs(Number(item['מורד הזרם'])) : 
      -Math.abs(parseFloat(String(item['מורד הזרם']))),
    category: item.category
  }));

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
    chartType === 'butterfly' ? 
      (viewMode === 'comparison' ? butterflyData : butterflyDirectionData) : 
      viewMode === 'comparison' ? 
        (comparisonType === 'optimization' ? optimizationData : directionData) : 
        directionOnlyData;

  const renderCustomBarLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const displayValue = Math.abs(Number(value)).toFixed(1);
    return (
      <text
        x={x + width / 2}
        y={value >= 0 ? y - 10 : y + height + 15}
        fill="#000000"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={12}
        fontWeight={500}
      >
        {displayValue}
      </text>
    );
  };

  const renderCustomButterflyLabel = (props: any) => {
    const { x, y, width, height, value } = props;
    const displayValue = Math.abs(Number(value)).toFixed(1);
    const xPos = value < 0 ? x + width - 15 : x + 15;
    return (
      <text
        x={xPos}
        y={y + height / 2}
        fill="#000000"
        textAnchor={value < 0 ? "end" : "start"}
        dominantBaseline="middle"
        fontSize={12}
        fontWeight={500}
      >
        {displayValue}
      </text>
    );
  };

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
              {viewMode === 'comparison' ? (
                comparisonType === 'optimization' ? (
                  <>
                    <Bar 
                      dataKey={labels.baseline} 
                      fill={colors.positive.baseline}
                      name={`${labels.baseline}`}
                    >
                      <LabelList dataKey={labels.baseline} content={renderCustomBarLabel} />
                    </Bar>
                    <Bar 
                      dataKey={labels.optimized} 
                      fill={colors.positive.optimized}
                      name={`${labels.optimized}`}
                    >
                      <LabelList dataKey={labels.optimized} content={renderCustomBarLabel} />
                    </Bar>
                  </>
                ) : (
                  <>
                    <Bar dataKey="מעלה הזרם - בסיס" fill={colors.positive.baseline}>
                      <LabelList dataKey="מעלה הזרם - בסיס" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="מעלה הזרם - אופטימיזציה" fill={colors.positive.optimized}>
                      <LabelList dataKey="מעלה הזרם - אופטימיזציה" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="מורד הזרם - בסיס" fill={colors.negative.baseline}>
                      <LabelList dataKey="מורד הזרם - בסיס" content={renderCustomBarLabel} />
                    </Bar>
                    <Bar dataKey="מורד הזרם - אופטימיזציה" fill={colors.negative.optimized}>
                      <LabelList dataKey="מורד הזרם - אופטימיזציה" content={renderCustomBarLabel} />
                    </Bar>
                  </>
                )
              ) : (
                <>
                  <Bar dataKey="מעלה הזרם" fill={colors.positive.optimized}>
                    <LabelList dataKey="מעלה הזרם" content={renderCustomBarLabel} />
                  </Bar>
                  <Bar dataKey="מורד הזרם" fill={colors.negative.optimized}>
                    <LabelList dataKey="מורד הזרם" content={renderCustomBarLabel} />
                  </Bar>
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
                stroke={colors.radar.baseline} 
                fill={colors.radar.baseline} 
                fillOpacity={0.6} 
              />
              <Radar 
                name={labels.optimized}
                dataKey="אחרי"
                stroke={colors.radar.optimized} 
                fill={colors.radar.optimized} 
                fillOpacity={0.6} 
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );

      case 'butterfly':
        const groupedMetrics = viewMode === 'comparison' 
          ? Object.values(butterflyData.reduce<Record<string, typeof butterflyData>>((acc, item) => {
              const baseMetricName = item.metric.replace(/\d+-\d+$/, '').trim();
              if (!acc[baseMetricName]) {
                acc[baseMetricName] = [];
              }
              acc[baseMetricName].push(item);
              return acc;
            }, {})).flat()
          : butterflyDirectionData;
        
        const customLegendItems = viewMode === 'comparison' ? [
          { value: `${labels.baseline} - מדדים חיוביים`, color: colors.positive.baseline },
          { value: `${labels.baseline} - מדדים שליליים`, color: colors.negative.baseline },
          { value: `${labels.optimized} - מדדים חיוביים`, color: colors.positive.optimized },
          { value: `${labels.optimized} - מדדים שליליים`, color: colors.negative.optimized },
        ] : [
          { value: `מעלה הזרם - מדדים חיוביים`, color: colors.positive.optimized },
          { value: `מורד הזרם - מדדים שליליים`, color: colors.negative.optimized },
        ];

        const renderCustomLegend = () => (
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {customLegendItems.map((item, index) => (
              <div key={index} className="flex items-center">
                <div 
                  className="w-3 h-3 mr-1 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs">{item.value}</span>
              </div>
            ))}
          </div>
        );
        
        const { language } = useLanguage();
        
        return (
          <div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={groupedMetrics} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={['auto', 'auto']} />
                <YAxis 
                  type="category" 
                  dataKey="metric" 
                  width={150}
                  hide={language !== 'he'}
                />
                <Tooltip formatter={(value, name) => [Math.abs(Number(value)), name]} />
                <ReferenceLine x={0} stroke="#000" />
                {viewMode === 'comparison' ? (
                  <>
                    <Bar 
                      dataKey={labels.baseline} 
                      name={labels.baseline}
                      legendType="none"
                    >
                      <LabelList dataKey={labels.baseline} content={renderCustomButterflyLabel} />
                      {groupedMetrics.map((entry, index) => (
                        <Cell
                          key={`cell-baseline-${index}`}
                          fill={
                            entry.category === 'negative'
                              ? colors.negative.baseline
                              : colors.positive.baseline
                          }
                        />
                      ))}
                    </Bar>
                    <Bar 
                      dataKey={labels.optimized} 
                      name={labels.optimized}
                      legendType="none"
                    >
                      <LabelList dataKey={labels.optimized} content={renderCustomButterflyLabel} />
                      {groupedMetrics.map((entry, index) => (
                        <Cell
                          key={`cell-optimized-${index}`}
                          fill={
                            entry.category === 'negative'
                              ? colors.negative.optimized
                              : colors.positive.optimized
                          }
                        />
                      ))}
                    </Bar>
                  </>
                ) : (
                  <>
                    <Bar 
                      dataKey="מעלה הזרם" 
                      name="מעלה הזרם"
                      legendType="none"
                    >
                      <LabelList dataKey="מעלה הזרם" content={renderCustomButterflyLabel} />
                      {groupedMetrics.map((entry, index) => (
                        <Cell
                          key={`cell-upstream-${index}`}
                          fill={entry.category === 'positive' ? colors.positive.optimized : colors.negative.optimized}
                        />
                      ))}
                    </Bar>
                    <Bar 
                      dataKey="מורד הזרם" 
                      name="מורד הזרם"
                      legendType="none"
                    >
                      <LabelList dataKey="מורד הזרם" content={renderCustomButterflyLabel} />
                      {groupedMetrics.map((entry, index) => (
                        <Cell
                          key={`cell-downstream-${index}`}
                          fill={entry.category === 'positive' ? colors.positive.baseline : colors.negative.baseline}
                        />
                      ))}
                    </Bar>
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
            {renderCustomLegend()}
          </div>
        );
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <CardTitle>{getChartTitle()}</CardTitle>
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
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={() => setViewMode(viewMode === 'comparison' ? 'single' : 'comparison')}
            >
              <ArrowLeftRight className="h-4 w-4 mr-1" />
              {viewMode === 'comparison' ? 'השוואה בין כיוונים' : 'השוואה בין מצבים'}
            </Button>
            
            {chartType === 'bar' && viewMode === 'comparison' && (
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
