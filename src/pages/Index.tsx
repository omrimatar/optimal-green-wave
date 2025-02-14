
import { useState } from "react";
import { NetworkData, Weights, RunResult } from "@/types/traffic";
import { MetricsTable } from "@/components/MetricsTable";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('VITE_SUPABASE_URL is required');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required');
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Index() {
  const [results, setResults] = useState<{
    baseline_results: RunResult;
    optimized_results: RunResult;
  } | null>(null);

  const [networkData, setNetworkData] = useState<NetworkData>({
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
  });

  const [weights, setWeights] = useState<Weights>({
    corridor_up: 10,
    corridor_down: 10,
    overlap_up: 5,
    avg_delay_up: 5,
    max_delay_up: 5,
    overlap_down: 5,
    avg_delay_down: 5,
    max_delay_down: 5,
  });

  const handleOptimize = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('optimize-traffic', {
        body: { networkData, weights }
      });

      if (error) throw error;

      setResults(data);
      toast.success("האופטימיזציה הושלמה בהצלחה");
    } catch (error) {
      toast.error("שגיאה בביצוע האופטימיזציה");
      console.error(error);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-6xl" dir="rtl">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-blue-500 text-transparent bg-clip-text">
            אופטימיזציה של רמזורים
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            חישוב גלים ירוקים אופטימליים והשוואת מדדים לתזמון רמזורים
          </p>
        </div>

        <Card className="bg-white/50 backdrop-blur-sm border-2">
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">מהירויות נסיעה</h2>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>מהירות בכיוון למעלה (קמ"ש)</Label>
                    <Input
                      type="number"
                      value={networkData.travel.up.speed}
                      onChange={(e) => setNetworkData(prev => ({
                        ...prev,
                        travel: {
                          ...prev.travel,
                          up: { speed: Number(e.target.value) }
                        }
                      }))}
                      className="text-left"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>מהירות בכיוון למטה (קמ"ש)</Label>
                    <Input
                      type="number"
                      value={networkData.travel.down.speed}
                      onChange={(e) => setNetworkData(prev => ({
                        ...prev,
                        travel: {
                          ...prev.travel,
                          down: { speed: Number(e.target.value) }
                        }
                      }))}
                      className="text-left"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold">משקולות אופטימיזציה</h2>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>משקל מסדרון למעלה</Label>
                    <Input
                      type="number"
                      value={weights.corridor_up}
                      onChange={(e) => setWeights(prev => ({
                        ...prev,
                        corridor_up: Number(e.target.value)
                      }))}
                      className="text-left"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>משקל מסדרון למטה</Label>
                    <Input
                      type="number"
                      value={weights.corridor_down}
                      onChange={(e) => setWeights(prev => ({
                        ...prev,
                        corridor_down: Number(e.target.value)
                      }))}
                      className="text-left"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button 
            onClick={handleOptimize} 
            className="px-8 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white"
          >
            הרץ אופטימיזציה
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
