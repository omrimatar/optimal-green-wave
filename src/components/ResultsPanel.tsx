
import { Card } from "@/components/ui/card";
import { MetricsTable } from "./MetricsTable";
import { OptimizationCharts } from "./OptimizationCharts";
import { GanttChart } from "./GanttChart";
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
  
  // Create sample green phases for demonstration
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

  // Ensure we have the correct distances array
  if (!comparisonResults.distances || comparisonResults.distances.length < comparisonResults.offsets.length) {
    console.warn("Distances array is missing or incomplete, using default distances");
    comparisonResults.distances = comparisonResults.offsets.map((_, idx) => idx * 300);
  }

  // Extract the current configuration for the Gantt chart
  // Create intersection data structure needed by GanttChart
  const currentIntersections: Intersection[] = comparisonResults.offsets.map((offset, idx) => {
    // Get the actual distance from the distances field
    const actualDistance = comparisonResults.distances![idx];
    
    // Log to debug the actual distances being used
    console.log(`Intersection ${idx + 1} distance: ${actualDistance}`);
    
    return {
      id: idx + 1,
      // Use the actual distance that was entered by the user
      distance: actualDistance, 
      cycleTime: 90, // Default cycle time
      offset: mode === 'display' ? 0 : offset, // Use 0 offsets for baseline in display mode
      greenPhases: createGreenPhases()  // Add sample green phases
    };
  });

  console.log("Current intersections for Gantt chart:", currentIntersections);
  
  // Extract diagonal points from the results if available
  const diagonalPoints = comparisonResults.diagonal_points;
  console.log("Diagonal points for Gantt chart:", diagonalPoints);

  // Default speed if not provided
  const speed = 50;

  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        {/* Display green wave diagram first - before graphical comparison */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">תרשים גל ירוק</h3>
          <GanttChart 
            data={currentIntersections}
            mode={mode}
            speed={speed}
            diagonalPoints={diagonalPoints}
          />
        </div>
        
        {/* Display graphical comparison after the wave diagram */}
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
