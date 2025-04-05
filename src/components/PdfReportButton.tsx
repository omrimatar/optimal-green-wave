
import { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useReactToPrint } from 'react-to-print';
import { useLanguage } from "@/contexts/LanguageContext";
import { GreenWaveChart } from "@/components/GreenWaveChart";
import { MetricsTable } from "@/components/MetricsTable";
import type { Intersection } from "@/types/optimization";
import type { RunResult } from "@/types/traffic";

interface PdfReportButtonProps {
  results: {
    baseline_results: RunResult;
    optimized_results: RunResult;
    manual_results?: RunResult;
  } | null;
  mode: 'display' | 'calculate' | 'manual';
  originalIntersections: Intersection[];
  speed: number;
}

export const PdfReportButton = ({ results, mode, originalIntersections, speed }: PdfReportButtonProps) => {
  const { t } = useLanguage();
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!results) return null;

  const currentDate = new Date().toLocaleDateString('he-IL');
  
  const comparisonResults = mode === 'manual' 
    ? results.manual_results! 
    : mode === 'calculate' 
      ? results.optimized_results 
      : results.baseline_results;

  const chartIntersections: Intersection[] = comparisonResults.offsets.map((offset, idx) => {
    if (originalIntersections && idx < originalIntersections.length) {
      const originalIntersection = originalIntersections[idx];
      return {
        ...originalIntersection,
        offset: mode === 'display' ? 0 : offset
      };
    }
    
    const distance = comparisonResults.distances ? 
      comparisonResults.distances[idx] : 
      idx * 300;
    
    const cycleTime = comparisonResults.cycle_times ? 
      comparisonResults.cycle_times[idx] : 
      90;
    
    const useHalfCycleTime = comparisonResults.use_half_cycle && comparisonResults.use_half_cycle[idx] !== undefined
      ? comparisonResults.use_half_cycle[idx]
      : false;
    
    const effectiveCycleTime = useHalfCycleTime ? cycleTime / 2 : cycleTime;
    
    const upstreamSpeed = originalIntersections && originalIntersections[idx] && 
                         originalIntersections[idx].upstreamSpeed !== undefined ? 
                         originalIntersections[idx].upstreamSpeed : 
                         speed;
    
    const downstreamSpeed = originalIntersections && originalIntersections[idx] && 
                            originalIntersections[idx].downstreamSpeed !== undefined ? 
                            originalIntersections[idx].downstreamSpeed : 
                            speed;
    
    const greenPhases = [];
    
    if (comparisonResults.green_up && comparisonResults.green_up[idx]) {
      comparisonResults.green_up[idx].forEach(phase => {
        greenPhases.push({
          direction: 'upstream',
          startTime: phase.start,
          duration: phase.duration
        });
      });
    } else {
      greenPhases.push({
        direction: 'upstream',
        startTime: 0,
        duration: Math.floor(effectiveCycleTime / 2)
      });
    }
    
    if (comparisonResults.green_down && comparisonResults.green_down[idx]) {
      comparisonResults.green_down[idx].forEach(phase => {
        greenPhases.push({
          direction: 'downstream',
          startTime: phase.start,
          duration: phase.duration
        });
      });
    } else {
      greenPhases.push({
        direction: 'downstream',
        startTime: Math.floor(effectiveCycleTime / 2),
        duration: Math.floor(effectiveCycleTime / 2)
      });
    }
    
    return {
      id: idx + 1,
      distance,
      cycleTime,
      offset: mode === 'display' ? 0 : offset,
      greenPhases,
      upstreamSpeed,
      downstreamSpeed,
      useHalfCycleTime,
      name: originalIntersections[idx]?.name || `צומת ${idx + 1}`
    };
  });

  const handleGeneratePdf = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `גל-ירוק-דוח-${currentDate.replace(/\//g, '-')}`,
    onBeforeGetContent: () => {
      toast.info(t('preparing_report'));
      return new Promise<void>((resolve) => {
        setTimeout(resolve, 500);
      });
    },
    onAfterPrint: () => {
      toast.success(t('report_generated'));
      setShowPreviewDialog(false);
    },
    onPrintError: () => {
      toast.error(t('print_error'));
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @page:first {
        size: A4;
        margin: 0;
      }
      @page:nth(2) {
        size: A4 landscape;
      }
    `,
  });

  return (
    <>
      <Button 
        onClick={() => setShowPreviewDialog(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <FileText size={16} />
        {t('generate_pdf_report')}
      </Button>

      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-[95vw] md:max-w-[80vw] max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{t('pdf_report_preview')}</DialogTitle>
          </DialogHeader>
          
          <div className="flex justify-end mb-4">
            <Button 
              onClick={handleGeneratePdf}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Printer size={16} className="mr-2" />
              {t('print_report')}
            </Button>
          </div>
          
          <div className="hidden">
            <div ref={reportRef} className="pdf-report" dir="rtl">
              {/* Cover Page */}
              <div className="cover-page" style={{ height: '297mm', width: '210mm', position: 'relative', padding: '20mm', boxSizing: 'border-box', pageBreakAfter: 'always' }}>
                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', textAlign: 'center' }}>
                  <div style={{ marginTop: '40mm' }}>
                    <img 
                      src="/lovable-uploads/efa3c3e2-c92f-42c7-8cc6-a4096430a863.png" 
                      alt="לוגו גל ירוק" 
                      style={{ height: '80mm', marginBottom: '20mm' }} 
                    />
                    <h1 style={{ fontSize: '28pt', color: '#2e7d32', marginBottom: '5mm' }}>דוח גל ירוק</h1>
                    <h2 style={{ fontSize: '18pt', color: '#333', fontWeight: 'normal' }}>תכנון רמזורים אופטימלי לתנועה רציפה</h2>
                  </div>
                  
                  <div>
                    <p style={{ fontSize: '14pt', marginBottom: '5mm' }}>
                      {mode === 'calculate' ? 'דוח אופטימיזציה' : mode === 'manual' ? 'דוח תרחיש ידני' : 'דוח מצב קיים'}
                    </p>
                    <p style={{ fontSize: '14pt' }}>תאריך: {currentDate}</p>
                  </div>
                </div>
              </div>

              {/* Green Wave Chart Page (Landscape) */}
              <div className="chart-page" style={{ height: '210mm', width: '297mm', padding: '10mm', boxSizing: 'border-box', pageBreakAfter: 'always' }}>
                <h2 style={{ fontSize: '16pt', marginBottom: '10mm', textAlign: 'center' }}>תרשים גל ירוק</h2>
                <div style={{ height: '170mm' }}>
                  <GreenWaveChart 
                    intersections={chartIntersections}
                    mode={mode}
                    speed={speed}
                    pairBandPoints={comparisonResults.pairs_band_points}
                    calculationPerformed={true}
                    comparisonResults={comparisonResults}
                    printMode={true}
                  />
                </div>
              </div>

              {/* Metrics Table Page */}
              <div className="table-page" style={{ height: '297mm', width: '210mm', padding: '10mm', boxSizing: 'border-box' }}>
                <h2 style={{ fontSize: '16pt', marginBottom: '10mm', textAlign: 'center' }}>טבלת נתוני אופטימיזציה</h2>
                <div style={{ height: '250mm', overflowY: 'auto' }}>
                  <MetricsTable 
                    baseline={results.baseline_results}
                    optimized={comparisonResults}
                    mode={mode}
                    printMode={true}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <Card className="p-4 border-dashed">
            <div className="text-center py-8">
              <h3 className="text-xl font-medium mb-2">{t('report_contents')}</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• {t('cover_page')} - {t('with_logo_and_date')}</li>
                <li>• {t('green_wave_chart')} - {t('landscape_orientation')}</li>
                <li>• {t('optimization_data_table')} - {t('portrait_orientation')}</li>
              </ul>
              <p className="mt-4 text-sm text-gray-500">{t('print_dialog_note')}</p>
            </div>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
};
