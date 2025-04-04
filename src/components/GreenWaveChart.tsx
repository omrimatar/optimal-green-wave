
import React, { useEffect, useRef, useState } from 'react';
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GreenPhaseBar } from './GreenPhaseBar';
import { GreenWaveTooltip } from './GreenWaveTooltip';
import { Intersection } from '@/types/optimization';
import { useIsMobile } from '@/hooks/use-mobile'; // Use the primary export name
import { useLanguage } from '@/contexts/LanguageContext';
import { PairBandPoint } from '@/types/traffic';

interface GreenWaveChartProps {
  intersections: Intersection[];
  mode: 'display' | 'calculate' | 'manual';
  calculationResults?: any;
  speed: number;
  directionMode?: 'corridor' | 'pair';
  maxTime?: number;
  initialChartSettings?: {
    zoomLevel?: number;
    scrollPosition?: number;
  };
  pairBandPoints?: PairBandPoint[]; 
  calculationPerformed?: boolean;
  comparisonResults?: any;
}

export const GreenWaveChart = ({ 
  intersections, 
  mode,
  calculationResults, 
  speed, 
  directionMode = 'corridor', 
  maxTime = 120,
  initialChartSettings,
  pairBandPoints,
  calculationPerformed,
  comparisonResults
}: GreenWaveChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [tooltipContent, setTooltipContent] = useState<{
    x: number;
    y: number;
    content: React.ReactNode;
    visible: boolean;
  }>({ x: 0, y: 0, content: null, visible: false });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(initialChartSettings?.zoomLevel || 1);
  const [scrollPosition, setScrollPosition] = useState(initialChartSettings?.scrollPosition || 0);
  const isMobile = useIsMobile(); // Consistently use useIsMobile
  const { t } = useLanguage();

  useEffect(() => {
    const calculateDimensions = () => {
      if (chartRef.current) {
        const width = chartRef.current.offsetWidth;
        const height = chartRef.current.offsetHeight;
        setDimensions({ width, height });
      }
    };

    calculateDimensions();
    window.addEventListener('resize', calculateDimensions);

    return () => {
      window.removeEventListener('resize', calculateDimensions);
    };
  }, []);

  useEffect(() => {
    if (chartRef.current && initialChartSettings) {
      chartRef.current.scrollLeft = initialChartSettings.scrollPosition || 0;
    }
  }, [chartRef.current, initialChartSettings]);

  const maxDistance = Math.max(...intersections.map(i => i.distance));
  const chartWidth = maxDistance > 0 ? maxDistance * 4 : dimensions.width;

  const timeToX = (time: number, dims: { width: number; height: number }) => {
    const effectiveMaxTime = maxTime * zoomLevel;
    return (time / effectiveMaxTime) * dims.width;
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'display') return;

    const chartArea = chartRef.current?.getBoundingClientRect();
    if (!chartArea) return;

    const mouseX = e.clientX - chartArea.left;
    const mouseY = e.clientY - chartArea.top;

    const time = (mouseX / dimensions.width) * maxTime * zoomLevel;

    setTooltipContent({
      x: mouseX,
      y: mouseY,
      content: <p>{t('time')}: {time.toFixed(2)}s</p>,
      visible: true,
    });
  };

  const handleMouseLeave = () => {
    setTooltipContent(prev => ({ ...prev, visible: false }));
  };

  const handleScroll = () => {
    if (chartRef.current) {
      setScrollPosition(chartRef.current.scrollLeft);
    }
  };

  const renderGreenPhaseBars = () => {
    return intersections.map((intersection, index) => {
      const y = 50 + index * 80;
      return intersection.greenPhases.map((phase, phaseIndex) => (
        <GreenPhaseBar
          key={`phase-${intersection.id}-${phaseIndex}`}
          x={timeToX(phase.startTime, dimensions) + (intersection.distance / maxDistance) * chartWidth}
          startTime={phase.startTime}
          endTime={phase.startTime + phase.duration}
          cycleTime={intersection.cycleTime || 90}
          direction={phase.direction}
          barWidth={20}
          yScale={(time) => time}
          chartHeight={dimensions.height}
          onMouseEnter={(e, info) => {
            setTooltipContent({
              x: e.clientX,
              y: e.clientY,
              content: (
                <div>
                  <p>{t('direction')}: {info?.direction}</p>
                  <p>{t('start_time')}: {info?.startTime}s</p>
                  <p>{t('end_time')}: {info?.endTime}s</p>
                  <p>{t('duration')}: {info?.duration}s</p>
                  {info?.phaseNumber !== undefined && <p>{t('phase_number')}: {info.phaseNumber}</p>}
                </div>
              ),
              visible: true,
            });
          }}
          onMouseLeave={() => {
            setTooltipContent(prev => ({ ...prev, visible: false }));
          }}
          isHalfCycle={intersection.useHalfCycleTime}
          phaseNumber={phase.phaseNumber}
        />
      ));
    });
  };

  const renderIntersectionMarkers = () => {
    const isMobile = window.innerWidth < 768;
    return intersections.map((intersection, index) => {
      const x = timeToX(0, dimensions) + (intersection.distance / maxDistance) * chartWidth;
      
      return (
        <g key={`intersection-${intersection.id}`}>
          <line
            x1={x}
            y1={0}
            x2={x}
            y2={dimensions.height - 30}
            stroke="#6B7280"
            strokeWidth={1}
            strokeDasharray="4,4"
          />
          <text
            x={x}
            y={dimensions.height - 15}
            textAnchor="middle"
            fontSize={isMobile ? 9 : 11}
            fill="#4B5563"
            className="font-medium"
          >
            {intersection.distance}m
          </text>
          
          {intersection.name && (
            <text
              x={x}
              y={dimensions.height - 2}
              textAnchor="middle"
              fontSize={isMobile ? 8 : 10}
              fill="#4B5563"
            >
              {intersection.name}
            </text>
          )}
        </g>
      );
    });
  };

  return (
    <CardContent className="space-y-4">
      <div className="flex justify-between items-center">
        <CardTitle>{t('green_wave_chart')}</CardTitle>
        <div className="flex gap-2">
          <button onClick={handleZoomIn} className="px-3 py-1 bg-gray-100 rounded">+</button>
          <button onClick={handleZoomOut} className="px-3 py-1 bg-gray-100 rounded">-</button>
        </div>
      </div>
      <div
        ref={chartRef}
        className="overflow-x-auto relative"
        style={{ cursor: mode === 'display' ? 'default' : 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onScroll={handleScroll}
      >
        <svg width={chartWidth * zoomLevel} height={intersections.length * 80 + 50} style={{ overflow: 'visible' }}>
          {renderGreenPhaseBars()}
          {renderIntersectionMarkers()}
        </svg>
        {tooltipContent.visible && (
          <GreenWaveTooltip x={tooltipContent.x} y={tooltipContent.y} content={tooltipContent.content} />
        )}
      </div>
    </CardContent>
  );
};
