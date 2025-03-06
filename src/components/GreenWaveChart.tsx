
import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GreenWaveTooltip } from './GreenWaveTooltip';
import { type Intersection } from "@/types/optimization";
import { type PairBandPoint } from "@/types/traffic";
import { calculateScales, generateYGridLines, generateXGridLines, generateYAxisTicks, generateXAxisTicks } from './GreenWave/utils';
import { DiagonalLines } from './GreenWave/DiagonalLines';
import { IntersectionPhases } from './GreenWave/IntersectionPhases';
import { ChartLegend } from './GreenWave/ChartLegend';
import { ChartAxes } from './GreenWave/ChartAxes';

interface GreenWaveChartProps {
  intersections: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  speed: number;
  pairBandPoints?: PairBandPoint[];
}

export const GreenWaveChart: React.FC<GreenWaveChartProps> = ({ 
  intersections,
  mode,
  speed,
  pairBandPoints
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [tooltipInfo, setTooltipInfo] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: null
  });

  useEffect(() => {
    console.log("GreenWaveChart received intersections:", intersections);
    console.log("GreenWaveChart mode:", mode);
    console.log("GreenWaveChart speed:", speed);
    console.log("GreenWaveChart pairBandPoints:", pairBandPoints);
  }, [intersections, mode, speed, pairBandPoints]);

  const maxDistance = Math.max(...intersections.map(i => i.distance));
  const maxCycleTime = Math.max(...intersections.map(i => i.cycleTime));
  
  useEffect(() => {
    console.log("Computed maxDistance:", maxDistance);
    console.log("Computed maxCycleTime:", maxCycleTime);
  }, [maxDistance, maxCycleTime]);

  const { xScale, yScale } = calculateScales(maxDistance, maxCycleTime, dimensions);

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        const width = chartRef.current.clientWidth;
        setDimensions({
          width,
          height: 500
        });
      }
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleShowTooltip = (x: number, y: number, content: React.ReactNode) => {
    setTooltipInfo({
      visible: true,
      x,
      y,
      content
    });
  };

  const handleHideTooltip = () => {
    setTooltipInfo(prev => ({ ...prev, visible: false }));
  };

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
            {/* Grid lines */}
            {generateYGridLines(maxCycleTime, dimensions, yScale)}
            {generateXGridLines(intersections, dimensions, xScale)}
            
            {/* Chart axes */}
            <ChartAxes dimensions={dimensions} />

            {/* Diagonal lines representing vehicle trajectories */}
            <DiagonalLines 
              pairBandPoints={pairBandPoints}
              intersections={intersections}
              maxCycleTime={maxCycleTime}
              dimensions={dimensions}
              xScale={xScale}
              yScale={yScale}
              handleShowTooltip={handleShowTooltip}
              handleHideTooltip={handleHideTooltip}
            />

            {/* Green phase bars for each intersection */}
            <IntersectionPhases 
              intersections={intersections}
              mode={mode}
              xScale={xScale}
              yScale={yScale}
              dimensions={dimensions}
              handleShowTooltip={handleShowTooltip}
              handleHideTooltip={handleHideTooltip}
            />

            {/* Y-axis ticks (labels) rendered after bars */}
            {generateYAxisTicks(maxCycleTime, dimensions, yScale)}

            {/* X-axis ticks (labels) */}
            {generateXAxisTicks(intersections, dimensions, xScale)}

            {/* Chart Legend */}
            <ChartLegend x={dimensions.width - 90} y={15} />
          </svg>
          
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
