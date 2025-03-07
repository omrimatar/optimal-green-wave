
import { Card } from "@/components/ui/card";
import { MetricsTable } from "./MetricsTable";
import { OptimizationCharts } from "./OptimizationCharts";
import { GreenWaveChart } from "./GreenWaveChart";
import type { RunResult, PairBandPoint } from "@/types/traffic";
import { type Intersection, type GreenPhase } from "@/types/optimization";

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
  if (!results || !results.baseline_results || 
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
        duration: Math.floor(cycleTime / 2)
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
        startTime: Math.floor(cycleTime / 2),
        duration: Math.floor(cycleTime / 2)
      });
    }
    
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
      greenPhases,
      upstreamSpeed,
      downstreamSpeed
    });
    
    return {
      id: idx + 1,
      distance,
      cycleTime,
      offset: mode === 'display' ? 0 : offset,
      greenPhases,
      upstreamSpeed,
      downstreamSpeed
    };
  });

  const chartSpeed = speed || comparisonResults.speed || 50;
  console.log("Chart using global design speed:", chartSpeed);
  
  return (
    <div className="space-y-6">
      <Card className="p-6 w-full">
        <GreenWaveChart 
          intersections={chartIntersections}
          mode={mode}
          speed={chartSpeed}
          pairBandPoints={pairBandPoints}
          calculationPerformed={calculationPerformed}
        />
      </Card>
      
      <Card className="p-6">
        <div className="space-y-4">
          <OptimizationCharts
            baseline={results.baseline_results}
            optimized={comparisonResults}
            mode={mode}
          />
          
          <MetricsTable 
            baseline={results.baseline_results}
            optimized={comparisonResults}
            mode={mode}
          />
        </div>
      </Card>
    </div>
  );
};
