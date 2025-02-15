
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
    if (!base || !opt) return null;
    const improvement = ((opt - base) / base) * 100;
    return (
      <span className={improvement > 0 ? "text-green-600" : "text-red-600"}>
        {improvement.toFixed(1)}%
      </span>
    );
  };

  const formatArray = (arr: number[] | undefined) => {
    if (!arr || arr.length === 0) return "N/A";
    return arr.map(val => val.toFixed(2)).join(", ");
  };

  if (!baseline || !optimized) {
    console.log("Missing data for MetricsTable:", { baseline, optimized });
    return null;
  }

  console.log("Rendering MetricsTable with data:", { baseline, optimized });

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
              <TableCell>היסטים</TableCell>
              <TableCell>{baseline.offsets?.join(", ") ?? "N/A"}</TableCell>
              <TableCell>{optimized.offsets?.join(", ") ?? "N/A"}</TableCell>
              <TableCell>-</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>רוחב מסדרון למעלה</TableCell>
              <TableCell>{baseline.corridorBW_up?.toFixed(2) ?? "N/A"}</TableCell>
              <TableCell>{optimized.corridorBW_up?.toFixed(2) ?? "N/A"}</TableCell>
              <TableCell>
                {baseline.corridorBW_up != null && optimized.corridorBW_up != null 
                  ? compareValues(baseline.corridorBW_up, optimized.corridorBW_up)
                  : "N/A"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>רוחב מסדרון למטה</TableCell>
              <TableCell>{baseline.corridorBW_down?.toFixed(2) ?? "N/A"}</TableCell>
              <TableCell>{optimized.corridorBW_down?.toFixed(2) ?? "N/A"}</TableCell>
              <TableCell>
                {baseline.corridorBW_down != null && optimized.corridorBW_down != null
                  ? compareValues(baseline.corridorBW_down, optimized.corridorBW_down)
                  : "N/A"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>עיכוב ממוצע למעלה</TableCell>
              <TableCell>{formatArray(baseline.avg_delay_up)}</TableCell>
              <TableCell>{formatArray(optimized.avg_delay_up)}</TableCell>
              <TableCell>
                {baseline.avg_delay_up?.[0] != null && optimized.avg_delay_up?.[0] != null
                  ? compareValues(baseline.avg_delay_up[0], optimized.avg_delay_up[0])
                  : "N/A"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>עיכוב ממוצע למטה</TableCell>
              <TableCell>{formatArray(baseline.avg_delay_down)}</TableCell>
              <TableCell>{formatArray(optimized.avg_delay_down)}</TableCell>
              <TableCell>
                {baseline.avg_delay_down?.[0] != null && optimized.avg_delay_down?.[0] != null
                  ? compareValues(baseline.avg_delay_down[0], optimized.avg_delay_down[0])
                  : "N/A"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>עיכוב מקסימלי למעלה</TableCell>
              <TableCell>{formatArray(baseline.max_delay_up)}</TableCell>
              <TableCell>{formatArray(optimized.max_delay_up)}</TableCell>
              <TableCell>
                {baseline.max_delay_up?.[0] != null && optimized.max_delay_up?.[0] != null
                  ? compareValues(baseline.max_delay_up[0], optimized.max_delay_up[0])
                  : "N/A"}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>עיכוב מקסימלי למטה</TableCell>
              <TableCell>{formatArray(baseline.max_delay_down)}</TableCell>
              <TableCell>{formatArray(optimized.max_delay_down)}</TableCell>
              <TableCell>
                {baseline.max_delay_down?.[0] != null && optimized.max_delay_down?.[0] != null
                  ? compareValues(baseline.max_delay_down[0], optimized.max_delay_down[0])
                  : "N/A"}
              </TableCell>
            </TableRow>
            {(baseline.chain_corridorBW_up != null || baseline.chain_corridorBW_down != null) && (
              <>
                <TableRow>
                  <TableCell>רוחב מסדרון מאושרר למעלה</TableCell>
                  <TableCell>{baseline.chain_corridorBW_up?.toFixed(2) ?? "N/A"}</TableCell>
                  <TableCell>{optimized.chain_corridorBW_up?.toFixed(2) ?? "N/A"}</TableCell>
                  <TableCell>
                    {baseline.chain_corridorBW_up != null && optimized.chain_corridorBW_up != null
                      ? compareValues(baseline.chain_corridorBW_up, optimized.chain_corridorBW_up)
                      : "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>רוחב מסדרון מאושרר למטה</TableCell>
                  <TableCell>{baseline.chain_corridorBW_down?.toFixed(2) ?? "N/A"}</TableCell>
                  <TableCell>{optimized.chain_corridorBW_down?.toFixed(2) ?? "N/A"}</TableCell>
                  <TableCell>
                    {baseline.chain_corridorBW_down != null && optimized.chain_corridorBW_down != null
                      ? compareValues(baseline.chain_corridorBW_down, optimized.chain_corridorBW_down)
                      : "N/A"}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
