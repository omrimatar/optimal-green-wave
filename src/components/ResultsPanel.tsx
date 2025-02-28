
import { Card } from "@/components/ui/card";
import { MetricsTable } from "./MetricsTable";
import { OptimizationCharts } from "./OptimizationCharts";
import { GanttChart } from "./GanttChart";
import type { RunResult } from "@/types/traffic";
import { type Intersection } from "@/types/optimization";

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
  console.log("Results data:", results);

  // Select the appropriate results based on mode
  const comparisonResults = mode === 'manual' 
    ? results.manual_results! 
    : mode === 'calculate' 
      ? results.optimized_results 
      : results.baseline_results;  // In display mode, show baseline
  
  // Extract the current configuration for the Gantt chart
  // Since 'intersections' doesn't exist on RunResult, we need to map the offsets to create
  // the intersection data structure needed by GanttChart
  const baseIntersections = results.baseline_results.offsets.map((offset, idx) => ({
    id: idx + 1,
    distance: idx * 500, // Default distance if not provided
    cycleTime: 90, // Default cycle time
    offset: mode === 'display' ? 0 : offset, // Use 0 offsets for baseline in display mode
    greenPhases: []  // This will be populated if available
  }));

  // Use optimized offsets for calculate mode or manual offsets for manual mode
  const currentIntersections = baseIntersections.map((intersection, idx) => ({
    ...intersection,
    offset: mode === 'display' 
      ? 0  // Baseline always has 0 offset in display mode
      : comparisonResults.offsets[idx] || 0
  }));

  // Default speed if not provided
  const speed = 50;

  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        {/* הצגת תרשים גל ירוק ראשון - לפני ההשוואה הגרפית */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">תרשים גל ירוק</h3>
          <GanttChart 
            data={currentIntersections}
            mode={mode}
            speed={speed}
          />
        </div>
        
        {/* הצגת ההשוואה הגרפית אחרי תרשים הגל */}
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
