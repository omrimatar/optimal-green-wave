
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
     (!results.optimized_results && !results.manual_results)) {
    console.log("No results to display in ResultsPanel:", results);
    return null;
  }

  console.log("Rendering ResultsPanel with data:", results);

  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        <OptimizationCharts
          baseline={results.baseline_results}
          optimized={mode === 'manual' && results.manual_results ? 
                    results.manual_results : 
                    results.optimized_results}
          mode={mode}
        />
        <MetricsTable 
          baseline={results.baseline_results}
          optimized={mode === 'manual' && results.manual_results ? 
                    results.manual_results : 
                    results.optimized_results}
          mode={mode}
        />
      </div>
    </Card>
  );
};
