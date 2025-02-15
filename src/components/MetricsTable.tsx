
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
            {baseline.offsets?.map((offset, index) => (
              <TableRow key={`offset-${index}`}>
                <TableCell>היסט צומת {index + 1}</TableCell>
                <TableCell>{offset.toFixed(2)}</TableCell>
                <TableCell>{optimized.offsets?.[index]?.toFixed(2) ?? "N/A"}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            ))}

            {baseline.avg_delay_up?.map((delay, index) => (
              <TableRow key={`delay-up-${index}`}>
                <TableCell>עיכוב ממוצע למעלה צמתים {index + 1}-{index + 2}</TableCell>
                <TableCell>{delay.toFixed(2)}</TableCell>
                <TableCell>{optimized.avg_delay_up?.[index]?.toFixed(2) ?? "N/A"}</TableCell>
                <TableCell>{compareValues(delay, optimized.avg_delay_up?.[index] ?? 0)}</TableCell>
              </TableRow>
            ))}

            {baseline.avg_delay_down?.map((delay, index) => (
              <TableRow key={`delay-down-${index}`}>
                <TableCell>עיכוב ממוצע למטה צמתים {index + 2}-{index + 1}</TableCell>
                <TableCell>{delay.toFixed(2)}</TableCell>
                <TableCell>{optimized.avg_delay_down?.[index]?.toFixed(2) ?? "N/A"}</TableCell>
                <TableCell>{compareValues(delay, optimized.avg_delay_down?.[index] ?? 0)}</TableCell>
              </TableRow>
            ))}

            {baseline.max_delay_up?.map((delay, index) => (
              <TableRow key={`max-delay-up-${index}`}>
                <TableCell>עיכוב מקסימלי למעלה צמתים {index + 1}-{index + 2}</TableCell>
                <TableCell>{delay.toFixed(2)}</TableCell>
                <TableCell>{optimized.max_delay_up?.[index]?.toFixed(2) ?? "N/A"}</TableCell>
                <TableCell>{compareValues(delay, optimized.max_delay_up?.[index] ?? 0)}</TableCell>
              </TableRow>
            ))}

            {baseline.max_delay_down?.map((delay, index) => (
              <TableRow key={`max-delay-down-${index}`}>
                <TableCell>עיכוב מקסימלי למטה צמתים {index + 2}-{index + 1}</TableCell>
                <TableCell>{delay.toFixed(2)}</TableCell>
                <TableCell>{optimized.max_delay_down?.[index]?.toFixed(2) ?? "N/A"}</TableCell>
                <TableCell>{compareValues(delay, optimized.max_delay_down?.[index] ?? 0)}</TableCell>
              </TableRow>
            ))}

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
