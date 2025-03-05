
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
  
  // Create green phases for the green wave chart
  const createGreenPhases = (): GreenPhase[] => [
    {
      direction: 'upstream',
      startTime: 0,
      duration: 45
    },
    {
      direction: 'downstream',
      startTime: 45,
      duration: 45
    }
  ];

  // Create intersections for the green wave chart
  const chartIntersections: Intersection[] = comparisonResults.offsets.map((offset, idx) => {
    // Default distance if not available
    const distance = comparisonResults.distances ? 
      comparisonResults.distances[idx] : 
      idx * 300;
    
    return {
      id: idx + 1,
      distance: distance,
      cycleTime: 90, // Default cycle time
      offset: mode === 'display' ? 0 : offset,
      greenPhases: createGreenPhases()
    };
  });

  // Default speed
  const speed = 50;
  
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
