
import { Card } from "@/components/ui/card";
import { MetricsTable } from "./MetricsTable";
import { OptimizationCharts } from "./OptimizationCharts";
import type { RunResult } from "@/types/traffic";

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

  // בחירת התוצאות המתאימות בהתאם למצב
  const comparisonResults = mode === 'manual' ? results.manual_results! : results.optimized_results;

  // Ensure we have the required properties for display
  if (results.baseline_results) {
    results.baseline_results.corridorBW_up = results.baseline_results.corridorBW_up || 
      results.baseline_results.corridor_bandwidth_up || 0;
    results.baseline_results.corridorBW_down = results.baseline_results.corridorBW_down || 
      results.baseline_results.corridor_bandwidth_down || 0;
    results.baseline_results.local_up = results.baseline_results.local_up || 
      results.baseline_results.pair_bandwidth_up || [];
    results.baseline_results.local_down = results.baseline_results.local_down || 
      results.baseline_results.pair_bandwidth_down || [];
  }

  if (comparisonResults) {
    comparisonResults.corridorBW_up = comparisonResults.corridorBW_up || 
      comparisonResults.corridor_bandwidth_up || 0;
    comparisonResults.corridorBW_down = comparisonResults.corridorBW_down || 
      comparisonResults.corridor_bandwidth_down || 0;
    comparisonResults.local_up = comparisonResults.local_up || 
      comparisonResults.pair_bandwidth_up || [];
    comparisonResults.local_down = comparisonResults.local_down || 
      comparisonResults.pair_bandwidth_down || [];
  }

  return (
    <Card className="p-6 h-full">
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
  );
};
