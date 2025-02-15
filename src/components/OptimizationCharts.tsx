
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RunResult } from "@/types/traffic";

interface OptimizationChartsProps {
  baseline: RunResult;
  optimized: RunResult;
}

export const OptimizationCharts = ({ baseline, optimized }: OptimizationChartsProps) => {
  // הכנת נתונים לגרף העמודות של רוחבי המסדרון
  const bandwidthData = [
    {
      name: 'רוחב מסדרון למעלה',
      בסיס: baseline.corridorBW_up,
      אופטימיזציה: optimized.corridorBW_up
    },
    {
      name: 'רוחב מסדרון למטה',
      בסיס: baseline.corridorBW_down,
      אופטימיזציה: optimized.corridorBW_down
    }
  ];

  // הכנת נתונים לגרף העמודות של עיכובים ממוצעים
  const delaysData = baseline.avg_delay_up?.map((_, index) => ({
    name: `צמתים ${index + 1}-${index + 2}`,
    'עיכוב למעלה - בסיס': baseline.avg_delay_up?.[index],
    'עיכוב למעלה - אופטימיזציה': optimized.avg_delay_up?.[index],
    'עיכוב למטה - בסיס': baseline.avg_delay_down?.[index],
    'עיכוב למטה - אופטימיזציה': optimized.avg_delay_down?.[index],
  })) || [];

  // הכנת נתונים לגרף הרדאר
  const radarData = [
    {
      metric: 'רוחב מסדרון למעלה',
      בסיס: baseline.corridorBW_up,
      אופטימיזציה: optimized.corridorBW_up
    },
    {
      metric: 'רוחב מסדרון למטה',
      בסיס: baseline.corridorBW_down,
      אופטימיזציה: optimized.corridorBW_down
    },
    ...(baseline.avg_delay_up?.map((_, index) => ({
      metric: `עיכוב ממוצע ${index + 1}-${index + 2}`,
      בסיס: baseline.avg_delay_up[index],
      אופטימיזציה: optimized.avg_delay_up?.[index]
    })) || []),
    ...(baseline.max_delay_up?.map((_, index) => ({
      metric: `עיכוב מקסימלי ${index + 1}-${index + 2}`,
      בסיס: baseline.max_delay_up[index],
      אופטימיזציה: optimized.max_delay_up?.[index]
    })) || [])
  ];

  return (
    <div className="space-y-8 mt-8">
      <Card>
        <CardHeader>
          <CardTitle>השוואת רוחבי מסדרון</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bandwidthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="בסיס" fill="#93c5fd" />
                <Bar dataKey="אופטימיזציה" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>השוואת עיכובים ממוצעים</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={delaysData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="עיכוב למעלה - בסיס" fill="#93c5fd" />
                <Bar dataKey="עיכוב למעלה - אופטימיזציה" fill="#22c55e" />
                <Bar dataKey="עיכוב למטה - בסיס" fill="#bfdbfe" />
                <Bar dataKey="עיכוב למטה - אופטימיזציה" fill="#86efac" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>השוואה כוללת</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis />
                <Radar
                  name="בסיס"
                  dataKey="בסיס"
                  stroke="#93c5fd"
                  fill="#93c5fd"
                  fillOpacity={0.6}
                />
                <Radar
                  name="אופטימיזציה"
                  dataKey="אופטימיזציה"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
