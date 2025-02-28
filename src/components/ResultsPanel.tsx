
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
  const comparisonResults = mode === 'manual' ? results.manual_results! : results.optimized_results;
  
  // Extract the current configuration for the Gantt chart
  const currentIntersections = comparisonResults.intersections as Intersection[];
  const speed = comparisonResults.speed || 50; // Default speed if not provided

  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        <OptimizationCharts
          baseline={results.baseline_results}
          optimized={comparisonResults}
          mode={mode}
        />
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">תרשים גל ירוק</h3>
          <GanttChart 
            data={currentIntersections}
            mode={mode}
            speed={speed}
          />
        </div>
        <MetricsTable 
          baseline={results.baseline_results}
          optimized={comparisonResults}
          mode={mode}
        />
      </div>
    </Card>
  );
};
