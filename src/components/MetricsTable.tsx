import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunResult } from "@/types/traffic";
import { useLanguage } from "@/contexts/LanguageContext";

interface MetricsTableProps {
  baseline: RunResult;
  optimized: RunResult;
  mode: 'display' | 'calculate' | 'manual';
}

export const MetricsTable = ({ baseline, optimized, mode }: MetricsTableProps) => {
  const { t, language } = useLanguage();

  const getLabels = () => {
    if (mode === 'manual') {
      return {
        baseline: t('initial_state'),
        optimized: t('manual_state')
      };
    }
    return {
      baseline: t('baseline'),
      optimized: t('optimized')
    };
  };

  const labels = getLabels();

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

  const offsets = Array.isArray(baseline.offsets) ? baseline.offsets : [];
  const pairBandwidthUp = Array.isArray(baseline.pair_bandwidth_up) ? baseline.pair_bandwidth_up : [];
  const pairBandwidthDown = Array.isArray(baseline.pair_bandwidth_down) ? baseline.pair_bandwidth_down : [];
  const avgDelayUp = Array.isArray(baseline.avg_delay_up) ? baseline.avg_delay_up : [];
  const avgDelayDown = Array.isArray(baseline.avg_delay_down) ? baseline.avg_delay_down : [];
  const maxDelayUp = Array.isArray(baseline.max_delay_up) ? baseline.max_delay_up : [];
  const maxDelayDown = Array.isArray(baseline.max_delay_down) ? baseline.max_delay_down : [];

  const optimizedOffsets = Array.isArray(optimized.offsets) ? optimized.offsets : [];
  const optimizedPairBandwidthUp = Array.isArray(optimized.pair_bandwidth_up) ? optimized.pair_bandwidth_up : [];
  const optimizedPairBandwidthDown = Array.isArray(optimized.pair_bandwidth_down) ? optimized.pair_bandwidth_down : [];
  const optimizedAvgDelayUp = Array.isArray(optimized.avg_delay_up) ? optimized.avg_delay_up : [];
  const optimizedAvgDelayDown = Array.isArray(optimized.avg_delay_down) ? optimized.avg_delay_down : [];
  const optimizedMaxDelayUp = Array.isArray(optimized.max_delay_up) ? optimized.max_delay_up : [];
  const optimizedMaxDelayDown = Array.isArray(optimized.max_delay_down) ? optimized.max_delay_down : [];

  const textAlign = language === 'he' ? "text-right" : "text-left";

  return (
    <Card className="w-full table-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === 'manual' ? t('manual_results') : t('optimization_results')}
          <Badge variant="outline" className="mr-2">
            {optimized.status === "Optimal" ? t('optimal') : optimized.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table dir={language === 'he' ? "rtl" : "ltr"}>
          <TableHeader>
            <TableRow>
              <TableHead className={textAlign}>{t('metric')}</TableHead>
              <TableHead className={textAlign}>{labels.baseline}</TableHead>
              <TableHead className={textAlign}>{labels.optimized}</TableHead>
              <TableHead className={textAlign}>{t('improvement')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {offsets.map((offset, index) => (
              <TableRow key={`offset-${index}`}>
                <TableCell>{t('intersection_offset')} {index + 1}</TableCell>
                <TableCell>{offset.toFixed(2)}</TableCell>
                <TableCell>{(optimizedOffsets[index] || 0).toFixed(2)}</TableCell>
                <TableCell>-</TableCell>
              </TableRow>
            ))}

            {pairBandwidthUp.map((value, index) => (
              <TableRow key={`pair-bw-up-${index}`}>
                <TableCell>{t('upstream_local_bandwidth')} {index + 1}-{index + 2}</TableCell>
                <TableCell>{value === null ? "N/A" : value.toFixed(2)}</TableCell>
                <TableCell>
                  {optimizedPairBandwidthUp[index] === null ? "N/A" : optimizedPairBandwidthUp[index].toFixed(2)}
                </TableCell>
                <TableCell>
                  {compareValues(value, optimizedPairBandwidthUp[index])}
                </TableCell>
              </TableRow>
            ))}

            {pairBandwidthDown.map((value, index) => (
              <TableRow key={`pair-bw-down-${index}`}>
                <TableCell>{t('downstream_local_bandwidth')} {index + 2}-{index + 1}</TableCell>
                <TableCell>{value === null ? "N/A" : value.toFixed(2)}</TableCell>
                <TableCell>
                  {optimizedPairBandwidthDown[index] === null ? "N/A" : optimizedPairBandwidthDown[index].toFixed(2)}
                </TableCell>
                <TableCell>
                  {compareValues(value, optimizedPairBandwidthDown[index])}
                </TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell>{t('upstream_corridor_bandwidth')}</TableCell>
              <TableCell>{baseline.corridor_bandwidth_up === null ? "N/A" : baseline.corridor_bandwidth_up.toFixed(2)}</TableCell>
              <TableCell>{optimized.corridor_bandwidth_up === null ? "N/A" : optimized.corridor_bandwidth_up.toFixed(2)}</TableCell>
              <TableCell>
                {compareValues(baseline.corridor_bandwidth_up, optimized.corridor_bandwidth_up)}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell>{t('downstream_corridor_bandwidth')}</TableCell>
              <TableCell>{baseline.corridor_bandwidth_down === null ? "N/A" : baseline.corridor_bandwidth_down.toFixed(2)}</TableCell>
              <TableCell>{optimized.corridor_bandwidth_down === null ? "N/A" : optimized.corridor_bandwidth_down.toFixed(2)}</TableCell>
              <TableCell>
                {compareValues(baseline.corridor_bandwidth_down, optimized.corridor_bandwidth_down)}
              </TableCell>
            </TableRow>

            {avgDelayUp.map((delay, index) => (
              <TableRow key={`delay-up-${index}`}>
                <TableCell>{t('upstream_avg_delay')} {index + 1}-{index + 2}</TableCell>
                <TableCell>{delay === null ? "N/A" : delay.toFixed(2)}</TableCell>
                <TableCell>
                  {optimizedAvgDelayUp[index] === null ? "N/A" : optimizedAvgDelayUp[index].toFixed(2)}
                </TableCell>
                <TableCell>
                  {compareValues(delay, optimizedAvgDelayUp[index])}
                </TableCell>
              </TableRow>
            ))}

            {avgDelayDown.map((delay, index) => (
              <TableRow key={`delay-down-${index}`}>
                <TableCell>{t('downstream_avg_delay')} {index + 2}-{index + 1}</TableCell>
                <TableCell>{delay === null ? "N/A" : delay.toFixed(2)}</TableCell>
                <TableCell>
                  {optimizedAvgDelayDown[index] === null ? "N/A" : optimizedAvgDelayDown[index].toFixed(2)}
                </TableCell>
                <TableCell>
                  {compareValues(delay, optimizedAvgDelayDown[index])}
                </TableCell>
              </TableRow>
            ))}

            {maxDelayUp.map((delay, index) => (
              <TableRow key={`max-delay-up-${index}`}>
                <TableCell>{t('upstream_max_delay')} {index + 1}-{index + 2}</TableCell>
                <TableCell>{delay === null ? "N/A" : delay.toFixed(2)}</TableCell>
                <TableCell>
                  {optimizedMaxDelayUp[index] === null ? "N/A" : optimizedMaxDelayUp[index].toFixed(2)}
                </TableCell>
                <TableCell>
                  {compareValues(delay, optimizedMaxDelayUp[index])}
                </TableCell>
              </TableRow>
            ))}

            {maxDelayDown.map((delay, index) => (
              <TableRow key={`max-delay-down-${index}`}>
                <TableCell>{t('downstream_max_delay')} {index + 2}-{index + 1}</TableCell>
                <TableCell>{delay === null ? "N/A" : delay.toFixed(2)}</TableCell>
                <TableCell>
                  {optimizedMaxDelayDown[index] === null ? "N/A" : optimizedMaxDelayDown[index].toFixed(2)}
                </TableCell>
                <TableCell>
                  {compareValues(delay, optimizedMaxDelayDown[index])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
