
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunResult } from "@/types/traffic";

interface MetricsTableProps {
  baseline: RunResult;
  optimized: RunResult;
}

export const MetricsTable = ({ baseline, optimized }: MetricsTableProps) => {
  const compareValues = (base: number | null, opt: number | null) => {
    if (base === null || opt === null) return "N/A";
    if (base === 0 && opt === 0) return "0%";
    if (base === 0) return null;
    const improvement = ((opt - base) / base) * 100;
    return (
      <span className={improvement > 0 ? "text-green-600" : "text-red-600"}>
        {improvement.toFixed(1)}%
      </span>
    );
  };

  if (!baseline || !optimized) {
    console.log("Missing data for MetricsTable:", { baseline, optimized });
    return null;
  }

  // וידוא שכל המערכים קיימים והם באמת מערכים
  const offsets = Array.isArray(baseline.offsets) ? baseline.offsets : [];
  const avgDelayUp = Array.isArray(baseline.avg_delay_up) ? baseline.avg_delay_up : [];
  const avgDelayDown = Array.isArray(baseline.avg_delay_down) ? baseline.avg_delay_down : [];
  const maxDelayUp = Array.isArray(baseline.max_delay_up) ? baseline.max_delay_up : [];
  const maxDelayDown = Array.isArray(baseline.max_delay_down) ? baseline.max_delay_down : [];

  const optimizedOffsets = Array.isArray(optimized.offsets) ? optimized.offsets : [];
  const optimizedAvgDelayUp = Array.isArray(optimized.avg_delay_up) ? optimized.avg_delay_up : [];
  const optimizedAvgDelayDown = Array.isArray(optimized.avg_delay_down) ? optimized.avg_delay_down : [];
  const optimizedMaxDelayUp = Array.isArray(optimized.max_delay_up) ? optimized.max_delay_up : [];
  const optimizedMaxDelayDown = Array.isArray(optimized.max_delay_down) ? optimized.max_delay_down : [];

  console.log("Rendering MetricsTable with processed data:", {
    offsets,
    avgDelayUp,
    avgDelayDown,
    maxDelayUp,
    maxDelayDown,
    optimizedOffsets,
    optimizedAvgDelayUp,
    optimizedAvgDelayDown,
    optimizedMaxDelayUp,
    optimizedMaxDelayDown
  });

  return (
    <Card className="w-full table-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          תוצאות האופטימיזציה
          <Badge variant="outline" className="mr-2">
            {optimized.status === "Optimal" ? "אופטימלי" : optimized.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table dir="rtl">
          <TableHeader>
            <TableRow>
              <TableHead>מדד</TableHead>
              <TableHead>בסיס</TableHead>
              <TableHead>לאחר אופטימיזציה</TableHead>
              <TableHead>שיפור</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offsets.map((offset, index) => (
              <TableRow key={`offset-${index}`}>
                <TableCell>היסט צומת {index + 1}</TableCell>
                <TableCell>{offset.toFixed(2)}</TableCell>
                <TableCell>{(optimizedOffsets[index] || 0).toFixed(2)}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            ))}

            {avgDelayUp.map((delay, index) => (
              <TableRow key={`delay-up-${index}`}>
                <TableCell>עיכוב ממוצע למעלה צמתים {index + 1}-{index + 2}</TableCell>
                <TableCell>{delay === null ? "N/A" : delay.toFixed(2)}</TableCell>
                <TableCell>
                  {optimizedAvgDelayUp[index] === null ? "N/A" : (optimizedAvgDelayUp[index] || 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  {compareValues(delay, optimizedAvgDelayUp[index])}
                </TableCell>
              </TableRow>
            ))}

            {avgDelayDown.map((delay, index) => (
              <TableRow key={`delay-down-${index}`}>
                <TableCell>עיכוב ממוצע למטה צמתים {index + 2}-{index + 1}</TableCell>
                <TableCell>{delay === null ? "N/A" : delay.toFixed(2)}</TableCell>
                <TableCell>
                  {optimizedAvgDelayDown[index] === null ? "N/A" : (optimizedAvgDelayDown[index] || 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  {compareValues(delay, optimizedAvgDelayDown[index])}
                </TableCell>
              </TableRow>
            ))}

            {maxDelayUp.map((delay, index) => (
              <TableRow key={`max-delay-up-${index}`}>
                <TableCell>עיכוב מקסימלי למעלה צמתים {index + 1}-{index + 2}</TableCell>
                <TableCell>{delay === null ? "N/A" : delay.toFixed(2)}</TableCell>
                <TableCell>
                  {optimizedMaxDelayUp[index] === null ? "N/A" : (optimizedMaxDelayUp[index] || 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  {compareValues(delay, optimizedMaxDelayUp[index])}
                </TableCell>
              </TableRow>
            ))}

            {maxDelayDown.map((delay, index) => (
              <TableRow key={`max-delay-down-${index}`}>
                <TableCell>עיכוב מקסימלי למטה צמתים {index + 2}-{index + 1}</TableCell>
                <TableCell>{delay === null ? "N/A" : delay.toFixed(2)}</TableCell>
                <TableCell>
                  {optimizedMaxDelayDown[index] === null ? "N/A" : (optimizedMaxDelayDown[index] || 0).toFixed(2)}
                </TableCell>
                <TableCell>
                  {compareValues(delay, optimizedMaxDelayDown[index])}
                </TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell>רוחב מסדרון למעלה</TableCell>
              <TableCell>{baseline.corridorBW_up === null ? "N/A" : baseline.corridorBW_up.toFixed(2)}</TableCell>
              <TableCell>{optimized.corridorBW_up === null ? "N/A" : optimized.corridorBW_up.toFixed(2)}</TableCell>
              <TableCell>
                {compareValues(baseline.corridorBW_up, optimized.corridorBW_up)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>רוחב מסדרון למטה</TableCell>
              <TableCell>{baseline.corridorBW_down === null ? "N/A" : baseline.corridorBW_down.toFixed(2)}</TableCell>
              <TableCell>{optimized.corridorBW_down === null ? "N/A" : optimized.corridorBW_down.toFixed(2)}</TableCell>
              <TableCell>
                {compareValues(baseline.corridorBW_down, optimized.corridorBW_down)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
