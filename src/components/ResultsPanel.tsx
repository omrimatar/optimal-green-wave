
import { Card } from "@/components/ui/card";
import { MetricsTable } from "./MetricsTable";
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
    return null;
  }

  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        <MetricsTable 
          baseline={results.baseline_results}
          optimized={results.optimized_results}
        />
      </div>
    </Card>
  );
};
