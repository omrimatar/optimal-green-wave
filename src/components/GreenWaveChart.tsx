
import React, { useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GreenWaveTooltip } from './GreenWaveTooltip';
import { type Intersection } from "@/types/optimization";
import { ChartAxis } from './chart/ChartAxis';
import { ChartLegend } from './chart/ChartLegend';
import { PhaseBars } from './chart/PhaseBars';
import { useChartDimensions } from './chart/useChartDimensions';
import { useTooltip } from './chart/useTooltip';

interface GreenWaveChartProps {
  intersections: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  speed: number;
}

export const GreenWaveChart: React.FC<GreenWaveChartProps> = ({ 
  intersections,
  mode,
  speed
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const dimensions = useChartDimensions(chartRef);
  const { tooltipInfo, handleShowTooltip, handleHideTooltip } = useTooltip();

  // Find maximum distance and cycle time
  const maxDistance = Math.max(...intersections.map(i => i.distance));
  const maxCycleTime = Math.max(...intersections.map(i => i.cycleTime));

  // Calculate scales
  const xScale = (value: number) => (value / maxDistance) * (dimensions.width - 80);
  const yScale = (value: number) => (value / maxCycleTime) * (dimensions.height - 80);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>תרשים גל ירוק - {mode === 'manual' ? 'מצב ידני' : mode === 'calculate' ? 'אופטימיזציה' : 'מצב קיים'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative" ref={chartRef}>
          <svg 
            width={dimensions.width} 
            height={dimensions.height}
            className="overflow-visible"
          >
            {/* Render axis and ticks */}
            <ChartAxis 
              dimensions={dimensions}
              maxDistance={maxDistance}
              maxCycleTime={maxCycleTime}
              intersections={intersections}
              xScale={xScale}
              yScale={yScale}
            />

            {/* Render phase bars */}
            <PhaseBars 
              intersections={intersections}
              mode={mode}
              xScale={xScale}
              yScale={yScale}
              chartHeight={dimensions.height - 40}
              onShowTooltip={handleShowTooltip}
              onHideTooltip={handleHideTooltip}
            />

            {/* Render chart legend */}
            <ChartLegend width={dimensions.width} />
          </svg>
          
          {/* Tooltip */}
          {tooltipInfo.visible && (
            <GreenWaveTooltip
              x={tooltipInfo.x}
              y={tooltipInfo.y}
              content={tooltipInfo.content}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
