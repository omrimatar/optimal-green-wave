
import { Card } from "@/components/ui/card";
import { MetricsTable } from "./MetricsTable";
import { OptimizationCharts } from "./OptimizationCharts";
import { GreenWaveChart } from "./GreenWaveChart";
import { PDFReport } from "./PDFReport";
import type { RunResult, PairBandPoint } from "@/types/traffic";
import { type Intersection, type GreenPhase } from "@/types/optimization";
import { useEffect, useRef } from "react";

interface ResultsPanelProps {
  results: {
    baseline_results: RunResult;
    optimized_results: RunResult;
    manual_results?: RunResult;
  } | null;
  mode: 'display' | 'calculate' | 'manual';
  originalIntersections?: Intersection[];
  speed?: number;
  calculationPerformed?: boolean;
}

export const ResultsPanel = ({ results, mode, originalIntersections, speed, calculationPerformed = false }: ResultsPanelProps) => {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  
  if (!results || 
     !results.baseline_results || 
     (mode === 'manual' && !results.manual_results) ||
     (mode !== 'manual' && !results.optimized_results)) {
    console.log("No results to display in ResultsPanel:", results);
    return null;
  }

  console.log("Rendering ResultsPanel with mode:", mode);
  console.log("Original intersections:", originalIntersections);
  console.log("Original speed:", speed);
  console.log("Calculation performed:", calculationPerformed);

  const comparisonResults = mode === 'manual' 
    ? results.manual_results! 
    : mode === 'calculate' 
      ? results.optimized_results 
      : results.baseline_results;  // In display mode, show baseline
  
  console.log("Selected comparison results:", comparisonResults);
  
  const pairBandPoints: PairBandPoint[] | undefined = 
    mode === 'display' 
      ? results.baseline_results.pairs_band_points
      : comparisonResults.pairs_band_points;
  
  console.log("Using pair band points:", pairBandPoints);
  
  if (pairBandPoints && pairBandPoints.length > 0) {
    console.log(`======= BANDWIDTH DEBUG INFORMATION =======`);
    pairBandPoints.forEach(pair => {
      const apiPairIndex = pair.from_junction - 1;
      const apiUpstreamBandwidth = comparisonResults.pair_bandwidth_up?.[apiPairIndex];
      const apiDownstreamBandwidth = comparisonResults.pair_bandwidth_down?.[apiPairIndex];
      
      console.log(`Junction pair ${pair.from_junction}-${pair.to_junction}:`);
      console.log(`  API upstream bandwidth: ${apiUpstreamBandwidth?.toFixed(2) || 'N/A'} seconds (${apiUpstreamBandwidth && apiUpstreamBandwidth > 0 ? 'DRAWING' : 'SKIPPING'})`);
      console.log(`  API downstream bandwidth: ${apiDownstreamBandwidth?.toFixed(2) || 'N/A'} seconds (${apiDownstreamBandwidth && apiDownstreamBandwidth > 0 ? 'DRAWING' : 'SKIPPING'})`);
      
      console.log(`  Upstream details: dest_high=${pair.up.dest_high.toFixed(2)}, dest_low=${pair.up.dest_low.toFixed(2)}`);
      console.log(`  Downstream details: dest_high=${pair.down.dest_high.toFixed(2)}, dest_low=${pair.down.dest_low.toFixed(2)}`);
      
      pair.apiUpstreamBandwidth = apiUpstreamBandwidth;
      pair.apiDownstreamBandwidth = apiDownstreamBandwidth;
      
      if (!apiUpstreamBandwidth || apiUpstreamBandwidth <= 0) {
        console.log(`  Warning: Zero or negative API upstream bandwidth (${apiUpstreamBandwidth?.toFixed(2) || 'N/A'}) for junction pair ${pair.from_junction}-${pair.to_junction}`);
      }
      if (!apiDownstreamBandwidth || apiDownstreamBandwidth <= 0) {
        console.log(`  Warning: Zero or negative API downstream bandwidth (${apiDownstreamBandwidth?.toFixed(2) || 'N/A'}) for junction pair ${pair.to_junction}-${pair.from_junction}`);
      }
    });
    console.log(`=========================================`);
  }
  
  const chartIntersections: Intersection[] = comparisonResults.offsets.map((offset, idx) => {
    if (originalIntersections && idx < originalIntersections.length) {
      const originalIntersection = originalIntersections[idx];
      return {
        ...originalIntersection,
        offset: mode === 'display' ? 0 : offset
      };
    }
    
    const distance = comparisonResults.distances ? 
      comparisonResults.distances[idx] : 
      idx * 300;
    
    const cycleTime = comparisonResults.cycle_times ? 
      comparisonResults.cycle_times[idx] : 
      90;
    
    const useHalfCycleTime = comparisonResults.use_half_cycle && comparisonResults.use_half_cycle[idx] !== undefined
      ? comparisonResults.use_half_cycle[idx]
      : false;
    
    const effectiveCycleTime = useHalfCycleTime ? cycleTime / 2 : cycleTime;
    
    const upstreamSpeed = originalIntersections && originalIntersections[idx] && 
                         originalIntersections[idx].upstreamSpeed !== undefined ? 
                         originalIntersections[idx].upstreamSpeed : 
                         speed;
    
    const downstreamSpeed = originalIntersections && originalIntersections[idx] && 
                            originalIntersections[idx].downstreamSpeed !== undefined ? 
                            originalIntersections[idx].downstreamSpeed : 
                            speed;
    
    console.log(`ResultsPanel created intersection ${idx+1}:`, {
      id: idx + 1,
      distance,
      cycleTime,
      offset,
      greenPhases: (comparisonResults.green_up?.[idx] || []).concat(comparisonResults.green_down?.[idx] || []),
      upstreamSpeed,
      downstreamSpeed,
      useHalfCycleTime
    });
    
    const greenPhases: GreenPhase[] = [];
    
    if (comparisonResults.green_up && comparisonResults.green_up[idx]) {
      comparisonResults.green_up[idx].forEach(phase => {
        greenPhases.push({
          direction: 'upstream',
          startTime: phase.start,
          duration: phase.duration
        });
      });
    } else {
      greenPhases.push({
        direction: 'upstream',
        startTime: 0,
        duration: Math.floor(effectiveCycleTime / 2)
      });
    }
    
    if (comparisonResults.green_down && comparisonResults.green_down[idx]) {
      comparisonResults.green_down[idx].forEach(phase => {
        greenPhases.push({
          direction: 'downstream',
          startTime: phase.start,
          duration: phase.duration
        });
      });
    } else {
      greenPhases.push({
        direction: 'downstream',
        startTime: Math.floor(effectiveCycleTime / 2),
        duration: Math.floor(effectiveCycleTime / 2)
      });
    }
    
    return {
      id: idx + 1,
      distance,
      cycleTime,
      offset: mode === 'display' ? 0 : offset,
      greenPhases,
      upstreamSpeed,
      downstreamSpeed,
      useHalfCycleTime
    };
  });

  const chartSpeed = speed || comparisonResults.speed || 50;
  
  // Use effect to update the PDF chart and table references
  useEffect(() => {
    const updatePdfElements = async () => {
      if (!chartRef.current || !tableRef.current) return;
      
      // Find the containers in the hidden PDF elements
      const pdfChartContainer = document.getElementById('pdf-green-wave-chart-container');
      const pdfTableContainer = document.getElementById('pdf-metrics-table-container');
      
      if (pdfChartContainer && chartRef.current) {
        // Clone the chart into the PDF container
        const chartClone = chartRef.current.cloneNode(true) as HTMLElement;
        pdfChartContainer.innerHTML = '';
        pdfChartContainer.appendChild(chartClone);
      }
      
      if (pdfTableContainer && tableRef.current) {
        // Clone the table into the PDF container
        const tableClone = tableRef.current.cloneNode(true) as HTMLElement;
        pdfTableContainer.innerHTML = '';
        pdfTableContainer.appendChild(tableClone);
      }
    };
    
    // Run the update when results change
    if (results) {
      updatePdfElements();
    }
  }, [results, mode]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-2">
        <PDFReport 
          results={results}
          mode={mode}
          originalIntersections={originalIntersections}
          speed={speed}
        />
      </div>
      
      <Card className="p-6 w-full">
        <div ref={chartRef}>
          <GreenWaveChart 
            intersections={chartIntersections}
            mode={mode}
            speed={chartSpeed}
            pairBandPoints={pairBandPoints}
            calculationPerformed={calculationPerformed}
            comparisonResults={comparisonResults}
          />
        </div>
      </Card>
      
      <Card className="p-6">
        <div className="space-y-4">
          <OptimizationCharts
            baseline={results.baseline_results}
            optimized={comparisonResults}
            mode={mode}
          />
          
          <div ref={tableRef}>
            <MetricsTable 
              baseline={results.baseline_results}
              optimized={comparisonResults}
              mode={mode}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
