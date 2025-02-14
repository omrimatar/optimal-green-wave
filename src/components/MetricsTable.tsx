
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunResult } from "@/types/traffic";

interface MetricsTableProps {
  baseline: RunResult;
  optimized: RunResult;
}

export const MetricsTable = ({ baseline, optimized }: MetricsTableProps) => {
  const compareValues = (base: number, opt: number) => {
    const improvement = ((opt - base) / base) * 100;
    return (
      <span className={improvement > 0 ? "text-green-600" : "text-red-600"}>
        {improvement.toFixed(1)}%
      </span>
    );
  };

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
            <TableRow>
              <TableCell>רוחב מסדרון למעלה</TableCell>
              <TableCell>{baseline.corridorBW_up.toFixed(2)}</TableCell>
              <TableCell>{optimized.corridorBW_up.toFixed(2)}</TableCell>
              <TableCell>
                {compareValues(baseline.corridorBW_up, optimized.corridorBW_up)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>רוחב מסדרון למטה</TableCell>
              <TableCell>{baseline.corridorBW_down.toFixed(2)}</TableCell>
              <TableCell>{optimized.corridorBW_down.toFixed(2)}</TableCell>
              <TableCell>
                {compareValues(baseline.corridorBW_down, optimized.corridorBW_down)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>עיכוב ממוצע למעלה</TableCell>
              <TableCell>{baseline.avg_delay_up[0]?.toFixed(2) || "N/A"}</TableCell>
              <TableCell>{optimized.avg_delay_up[0]?.toFixed(2) || "N/A"}</TableCell>
              <TableCell>
                {baseline.avg_delay_up[0] && optimized.avg_delay_up[0]
                  ? compareValues(baseline.avg_delay_up[0], optimized.avg_delay_up[0])
                  : "N/A"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>עיכוב ממוצע למטה</TableCell>
              <TableCell>{baseline.avg_delay_down[0]?.toFixed(2) || "N/A"}</TableCell>
              <TableCell>{optimized.avg_delay_down[0]?.toFixed(2) || "N/A"}</TableCell>
              <TableCell>
                {baseline.avg_delay_down[0] && optimized.avg_delay_down[0]
                  ? compareValues(baseline.avg_delay_down[0], optimized.avg_delay_down[0])
                  : "N/A"}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
