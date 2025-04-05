import React, { useState, useRef, useEffect } from 'react';
import { ChartContainer } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GreenPhaseBar } from './GreenPhaseBar';
import { Scatter, CartesianGrid, XAxis, YAxis, ReferenceLine, ResponsiveContainer, ScatterChart, ZAxis } from 'recharts';
import type { Intersection, GreenPhase } from '@/types/optimization';
import type { PairBandPoint, RunResult } from '@/types/traffic';
import { useLanguage } from '@/contexts/LanguageContext';
import { GreenWaveTooltip } from './GreenWaveTooltip';

interface BandPoint {
  dest: number;
  time: number;
}

interface GreenWaveChartProps {
  intersections: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  speed: number;
  pairBandPoints?: PairBandPoint[];
  calculationPerformed?: boolean;
  comparisonResults?: RunResult;
  printMode?: boolean;
}

export const GreenWaveChart = ({ 
  intersections, 
  mode, 
  speed, 
  pairBandPoints, 
  calculationPerformed = false,
  comparisonResults,
  printMode = false
}: GreenWaveChartProps) => {
  const { t } = useLanguage();
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const updateChartWidth = () => {
      if (chartRef.current) {
        setChartWidth(chartRef.current.offsetWidth);
      }
    };

    updateChartWidth();
    window.addEventListener('resize', updateChartWidth);

    return () => {
      window.removeEventListener('resize', updateChartWidth);
    };
  }, []);

  const calculateTimePosition = (distance: number) => {
    return distance / (speed / 3.6);
  };

  const calculateBandPosition = (bandPoint: BandPoint) => {
    const timePosition = bandPoint.time;
    const destPosition = bandPoint.dest;
    return {
      x: destPosition,
      y: timePosition
    };
  };

  const title = mode === 'display' ? t('existing_green_wave') : t('optimized_green_wave');

  // Handle print mode specific styles
  const chartHeight = printMode ? "100%" : 650;
  const chartClassName = printMode ? "" : "glassmorphism";

  return (
    <Card className={`w-full ${chartClassName} relative`}>
      {!printMode && <CardHeader className="pb-0">
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          {/* Controls UI - only show in non-print mode */}
          <div className="flex space-x-2">
            {/* Chart controls */}
          </div>
        </CardTitle>
      </CardHeader>}
      
      <CardContent className={`pt-4 ${printMode ? 'p-0' : ''}`}>
        <div style={{ height: chartHeight, width: '100%' }} className="relative" ref={chartRef}>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis 
                type="number" 
                dataKey="distance" 
                name={t('distance')} 
                unit="m" 
                domain={[0, 'dataMax']}
                label={{ value: t('distance_meters'), position: 'bottom', offset: 0 }}
              />
              <YAxis 
                type="number" 
                dataKey="time" 
                name={t('time')} 
                unit="s" 
                domain={[0, 'dataMax']}
                tickFormatter={(value: number) => value.toFixed(0)}
                label={{ value: t('time_seconds'), angle: -90, position: 'left' }}
              />
              <ZAxis type="number" range={[60, 60]} />
              
              {intersections.map((intersection, index) => (
                <ReferenceLine 
                  key={intersection.id} 
                  x={intersection.distance} 
                  stroke="green" 
                  strokeOpacity={0.3}
                  label={{ 
                    value: intersection.name || `צומת ${index + 1}`, 
                    position: 'top',
                    fontSize: 12,
                    fontWeight: 'bold',
                    fill: '#222'
                  }}
                />
              ))}
              
              {intersections.map(intersection => (
                intersection.greenPhases.map((phase: GreenPhase, index: number) => {
                  const startTime = calculateTimePosition(intersection.distance) + phase.startTime;
                  const endTime = startTime + phase.duration;
                  
                  return (
                    <GreenPhaseBar
                      key={`${intersection.id}-${phase.direction}-${index}`}
                      x={intersection.distance}
                      y={startTime}
                      width={2}
                      height={phase.duration}
                      direction={phase.direction}
                      cycleTime={intersection.cycleTime}
                    />
                  );
                })
              ))}
              
              {pairBandPoints && pairBandPoints.map((pair, index) => {
                if (!pair.apiUpstreamBandwidth || pair.apiUpstreamBandwidth <= 0 ||
                    !pair.apiDownstreamBandwidth || pair.apiDownstreamBandwidth <= 0) {
                  return null;
                }
                
                const upPoints = [
                  calculateBandPosition(pair.up.origin),
                  calculateBandPosition(pair.up.dest_high),
                  calculateBandPosition(pair.up.dest_low)
                ];
                
                const downPoints = [
                  calculateBandPosition(pair.down.origin),
                  calculateBandPosition(pair.down.dest_high),
                  calculateBandPosition(pair.down.dest_low)
                ];
                
                return (
                  <React.Fragment key={`pair-${pair.from_junction}-${pair.to_junction}`}>
                    <Scatter name={`Upstream Band ${pair.from_junction}-${pair.to_junction}`} data={[upPoints[1], upPoints[2]]} fill="#8884d8" shape="line" line={{ strokeWidth: 3, stroke: 'rgba(75, 192, 192, 0.4)' }} />
                    <Scatter name={`Downstream Band ${pair.to_junction}-${pair.from_junction}`} data={[downPoints[1], downPoints[2]]} fill="#82ca9d" shape="line" line={{ strokeWidth: 3, stroke: 'rgba(255, 99, 132, 0.4)' }} />
                  </React.Fragment>
                );
              })}
              
              <GreenWaveTooltip />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
