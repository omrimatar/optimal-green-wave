
import { useState } from "react";
import { NetworkData, Weights, RunResult } from "@/types/traffic";
import { MetricsTable } from "@/components/MetricsTable";
import { greenWaveOptimization } from "@/lib/traffic";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Index() {
  const [results, setResults] = useState<{
    baseline_results: RunResult;
    optimized_results: RunResult;
  } | null>(null);

  const handleOptimize = () => {
    const dataExample: NetworkData = {
      intersections: [
        {
          id: 1,
          distance: 0,
          green_up: [{ start: 0, duration: 45 }],
          green_down: [{ start: 45, duration: 45 }],
          cycle_up: 90,
          cycle_down: 90,
        },
        {
          id: 2,
          distance: 300,
          green_up: [{ start: 0, duration: 45 }],
          green_down: [{ start: 45, duration: 45 }],
          cycle_up: 90,
          cycle_down: 90,
        },
        {
          id: 3,
          distance: 500,
          green_up: [{ start: 0, duration: 45 }],
          green_down: [{ start: 45, duration: 45 }],
          cycle_up: 90,
          cycle_down: 90,
        },
      ],
      travel: {
        up: { speed: 50 },
        down: { speed: 50 },
      },
    };

    const userWeights: Weights = {
      corridor_up: 10,
      corridor_down: 10,
      overlap_up: 5,
      avg_delay_up: 5,
      max_delay_up: 5,
      overlap_down: 5,
      avg_delay_down: 5,
      max_delay_down: 5,
    };

    try {
      const results = greenWaveOptimization(dataExample, userWeights);
      setResults(results);
      toast.success("Optimization completed successfully");
    } catch (error) {
      toast.error("Failed to optimize traffic signals");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Traffic Signal Optimization</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Calculate optimal green waves and generate comparative metrics for traffic signal timing.
          </p>
        </div>

        <div className="flex justify-center">
          <Button onClick={handleOptimize} className="px-8">
            Run Optimization
          </Button>
        </div>

        {results && (
          <div className="space-y-6 metric-fade-in">
            <MetricsTable
              baseline={results.baseline_results}
              optimized={results.optimized_results}
            />
          </div>
        )}
      </div>
    </div>
  );
}
