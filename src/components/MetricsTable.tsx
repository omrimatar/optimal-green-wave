
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
    if (base === null || opt === null) return null;
    if (base === 0 && opt === 0) return "0%";
    if (base === 0) return null;
    const improvement = ((opt - base) / base) * 100;
    return (
      <span className={improvement > 0 ? "text-green-600" : "text-red-600"}>
        {improvement.toFixed(1)}%
      </span>
    );
  };

  // פונקציית עזר לבדיקה האם להציג שורה
  const shouldShowRow = (base: number | null, opt: number | null) => {
    return base !== null && opt !== null;
  };

  // פונקציית עזר להצגת ערך מספרי
  const formatNumber = (value: number | null) => {
    return value !== null ? value.toFixed(2) : "-";
  };

  if (!baseline || !optimized) {
    console.log("Missing data for MetricsTable:", { baseline, optimized });
    return null;
  }

  const offsets = Array.isArray(baseline.offsets) ? baseline.offsets : [];
  const avgDelayUp = Array.isArray(baseline.avg_delay_up) ? baseline.avg_delay_up : [];
  const avgDelayDown = Array.isArray(baseline.avg_delay_down) ? baseline.avg_delay_down : [];
  const maxDelayUp = Array.isArray(baseline.max_delay_up) ? baseline.max_delay_up : [];
  const maxDelayDown = Array.isArray(baseline.max_delay_down) ? baseline.max_delay_down : [];
  const chainUpStart = Array.isArray(baseline.chain_up_start) ? baseline.chain_up_start : [];
  const chainDownStart = Array.isArray(baseline.chain_down_start) ? baseline.chain_down_start : [];

  const optimizedOffsets = Array.isArray(optimized.offsets) ? optimized.offsets : [];
  const optimizedAvgDelayUp = Array.isArray(optimized.avg_delay_up) ? optimized.avg_delay_up : [];
  const optimizedAvgDelayDown = Array.isArray(optimized.avg_delay_down) ? optimized.avg_delay_down : [];
  const optimizedMaxDelayUp = Array.isArray(optimized.max_delay_up) ? optimized.max_delay_up : [];
  const optimizedMaxDelayDown = Array.isArray(optimized.max_delay_down) ? optimized.max_delay_down : [];
  const optimizedChainUpStart = Array.isArray(optimized.chain_up_start) ? optimized.chain_up_start : [];
  const optimizedChainDownStart = Array.isArray(optimized.chain_down_start) ? optimized.chain_down_start : [];

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
            {offsets.map((offset, index) => {
              const optOffset = optimizedOffsets[index];
              return shouldShowRow(offset, optOffset) && (
                <TableRow key={`offset-${index}`}>
                  <TableCell>היסט צומת {index + 1}</TableCell>
                  <TableCell>{formatNumber(offset)}</TableCell>
                  <TableCell>{formatNumber(optOffset)}</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              );
            })}

            {avgDelayUp.map((delay, index) => {
              const optDelay = optimizedAvgDelayUp[index];
              return shouldShowRow(delay, optDelay) && (
                <TableRow key={`delay-up-${index}`}>
                  <TableCell>עיכוב ממוצע למעלה צמתים {index + 1}-{index + 2}</TableCell>
                  <TableCell>{formatNumber(delay)}</TableCell>
                  <TableCell>{formatNumber(optDelay)}</TableCell>
                  <TableCell>{compareValues(delay, optDelay)}</TableCell>
                </TableRow>
              );
            })}

            {avgDelayDown.map((delay, index) => {
              const optDelay = optimizedAvgDelayDown[index];
              return shouldShowRow(delay, optDelay) && (
                <TableRow key={`delay-down-${index}`}>
                  <TableCell>עיכוב ממוצע למטה צמתים {index + 2}-{index + 1}</TableCell>
                  <TableCell>{formatNumber(delay)}</TableCell>
                  <TableCell>{formatNumber(optDelay)}</TableCell>
                  <TableCell>{compareValues(delay, optDelay)}</TableCell>
                </TableRow>
              );
            })}

            {maxDelayUp.map((delay, index) => {
              const optDelay = optimizedMaxDelayUp[index];
              return shouldShowRow(delay, optDelay) && (
                <TableRow key={`max-delay-up-${index}`}>
                  <TableCell>עיכוב מקסימלי למעלה צמתים {index + 1}-{index + 2}</TableCell>
                  <TableCell>{formatNumber(delay)}</TableCell>
                  <TableCell>{formatNumber(optDelay)}</TableCell>
                  <TableCell>{compareValues(delay, optDelay)}</TableCell>
                </TableRow>
              );
            })}

            {maxDelayDown.map((delay, index) => {
              const optDelay = optimizedMaxDelayDown[index];
              return shouldShowRow(delay, optDelay) && (
                <TableRow key={`max-delay-down-${index}`}>
                  <TableCell>עיכוב מקסימלי למטה צמתים {index + 2}-{index + 1}</TableCell>
                  <TableCell>{formatNumber(delay)}</TableCell>
                  <TableCell>{formatNumber(optDelay)}</TableCell>
                  <TableCell>{compareValues(delay, optDelay)}</TableCell>
                </TableRow>
              );
            })}

            {chainUpStart.map((chainValue, index) => {
              const optChainValue = optimizedChainUpStart[index];
              return shouldShowRow(chainValue, optChainValue) && (
                <TableRow key={`chain-up-${index}`}>
                  <TableCell>רוחב פס למעלה צמתים {index + 1}-{index + 2}</TableCell>
                  <TableCell>{formatNumber(chainValue)}</TableCell>
                  <TableCell>{formatNumber(optChainValue)}</TableCell>
                  <TableCell>{compareValues(chainValue, optChainValue)}</TableCell>
                </TableRow>
              );
            })}

            {chainDownStart.map((chainValue, index) => {
              const optChainValue = optimizedChainDownStart[index];
              return shouldShowRow(chainValue, optChainValue) && (
                <TableRow key={`chain-down-${index}`}>
                  <TableCell>רוחב פס למטה צמתים {index + 2}-{index + 1}</TableCell>
                  <TableCell>{formatNumber(chainValue)}</TableCell>
                  <TableCell>{formatNumber(optChainValue)}</TableCell>
                  <TableCell>{compareValues(chainValue, optChainValue)}</TableCell>
                </TableRow>
              );
            })}

            {shouldShowRow(baseline.corridorBW_up, optimized.corridorBW_up) && (
              <TableRow>
                <TableCell>רוחב פס בציר למעלה</TableCell>
                <TableCell>{formatNumber(baseline.corridorBW_up)}</TableCell>
                <TableCell>{formatNumber(optimized.corridorBW_up)}</TableCell>
                <TableCell>
                  {compareValues(baseline.corridorBW_up, optimized.corridorBW_up)}
                </TableCell>
              </TableRow>
            )}

            {shouldShowRow(baseline.corridorBW_down, optimized.corridorBW_down) && (
              <TableRow>
                <TableCell>רוחב פס בציר למטה</TableCell>
                <TableCell>{formatNumber(baseline.corridorBW_down)}</TableCell>
                <TableCell>{formatNumber(optimized.corridorBW_down)}</TableCell>
                <TableCell>
                  {compareValues(baseline.corridorBW_down, optimized.corridorBW_down)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
