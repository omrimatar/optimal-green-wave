
import { Card } from "@/components/ui/card";
import { MetricsTable } from "./MetricsTable";
import { OptimizationCharts } from "./OptimizationCharts";
import { GreenWaveChart } from "./GreenWaveChart";
import type { RunResult } from "@/types/traffic";
import { type Intersection, type GreenPhase } from "@/types/optimization";

interface ResultsPanelProps {
  results: {
    baseline_results: RunResult;
    optimized_results: RunResult;
    manual_results?: RunResult;
  } | null;
  mode: 'display' | 'calculate' | 'manual';
}

export const ResultsPanel = ({ results, mode }: ResultsPanelProps) => {
  if (!results || !results.baseline_results || 
     (mode === 'manual' && !results.manual_results) ||
     (mode !== 'manual' && !results.optimized_results)) {
    console.log("No results to display in ResultsPanel:", results);
    return null;
  }

  console.log("Rendering ResultsPanel with mode:", mode);

  // Select the appropriate results based on mode
  const comparisonResults = mode === 'manual' 
    ? results.manual_results! 
    : mode === 'calculate' 
      ? results.optimized_results 
      : results.baseline_results;  // In display mode, show baseline
  
  console.log("Selected comparison results:", comparisonResults);
  
  // Create intersections for the green wave chart
  const chartIntersections: Intersection[] = comparisonResults.offsets.map((offset, idx) => {
    // Get distance from the results
    const distance = comparisonResults.distances ? 
      comparisonResults.distances[idx] : 
      idx * 300;
    
    // Get cycle time from the results or use a default
    const cycleTime = comparisonResults.cycle_times ? 
      comparisonResults.cycle_times[idx] : 
      90;
    
    // Get green phases from the results, if available
    const greenPhases: GreenPhase[] = [];
    
    // Add upstream phases if available
    if (comparisonResults.green_up && comparisonResults.green_up[idx]) {
      comparisonResults.green_up[idx].forEach(phase => {
        greenPhases.push({
          direction: 'upstream',
          startTime: phase.start,
          duration: phase.duration
        });
      });
    } else {
      // Default upstream phase
      greenPhases.push({
        direction: 'upstream',
        startTime: 0,
        duration: Math.floor(cycleTime / 2)
      });
    }
    
    // Add downstream phases if available
    if (comparisonResults.green_down && comparisonResults.green_down[idx]) {
      comparisonResults.green_down[idx].forEach(phase => {
        greenPhases.push({
          direction: 'downstream',
          startTime: phase.start,
          duration: phase.duration
        });
      });
    } else {
      // Default downstream phase
      greenPhases.push({
        direction: 'downstream',
        startTime: Math.floor(cycleTime / 2),
        duration: Math.floor(cycleTime / 2)
      });
    }
    
    console.log(`ResultsPanel created intersection ${idx+1}:`, {
      id: idx + 1,
      distance,
      cycleTime,
      offset,
      greenPhases
    });
    
    return {
      id: idx + 1,
      distance,
      cycleTime,
      offset: mode === 'display' ? 0 : offset,
      greenPhases
    };
  });

  // Get speed from results or use default
  const speed = comparisonResults.speed || 50;
  console.log("Chart using speed:", speed);
  
  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        {/* Display green wave diagram */}
        <GreenWaveChart 
          intersections={chartIntersections}
          mode={mode}
          speed={speed}
        />
        
        {/* Display graphical comparison */}
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
  );
};
