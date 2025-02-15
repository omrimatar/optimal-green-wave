
import { Card } from "@/components/ui/card";
import { MetricsTable } from "./MetricsTable";
import { OptimizationCharts } from "./OptimizationCharts";
import type { RunResult } from "@/types/traffic";

interface ResultsPanelProps {
  results: {
    baseline_results: RunResult;
    optimized_results: RunResult;
  } | null;
  mode: 'display' | 'calculate';
}

export const ResultsPanel = ({ results, mode }: ResultsPanelProps) => {
  if (!results || !results.baseline_results || !results.optimized_results) {
    console.log("No results to display in ResultsPanel:", results);
    return null;
  }

  console.log("Rendering ResultsPanel with data:", results);

  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        <MetricsTable 
          baseline={results.baseline_results}
          optimized={results.optimized_results}
        />
        <OptimizationCharts
          baseline={results.baseline_results}
          optimized={results.optimized_results}
        />
      </div>
    </Card>
  );
};
