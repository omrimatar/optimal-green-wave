
import React from 'react';
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import type { RunResult } from '@/types/traffic';
import { type Intersection } from '@/types/optimization';

interface PDFReportProps {
  results: {
    baseline_results: RunResult;
    optimized_results: RunResult;
    manual_results?: RunResult;
  } | null;
  mode: 'display' | 'calculate' | 'manual';
  originalIntersections?: Intersection[];
  speed?: number;
}

export const PDFReport: React.FC<PDFReportProps> = ({ 
  results, 
  mode 
}) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const chartRef = useRef<HTMLDivElement | null>(null);
  const tableRef = useRef<HTMLDivElement | null>(null);
  
  // Function to generate PDF with A4 format
  const generatePDF = async () => {
    if (!results || !chartRef.current || !tableRef.current) {
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור PDF, אין נתונים להצגה",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "מכין דוח...",
      description: "אנא המתן בזמן שהדוח מוכן להורדה",
    });
    
    try {
      // A4 sizes in mm
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      // Initialize PDF - A4 portrait as default
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // Cover page (Page 1) - Portrait
      createCoverPage(pdf);
      
      // Chart page (Page 2) - Landscape
      pdf.addPage('a4', 'landscape');
      await addChartPage(pdf, chartRef.current);
      
      // Table page (Page 3) - Portrait
      pdf.addPage('a4', 'portrait');
      await addTablePage(pdf, tableRef.current);
      
      // Save PDF
      const date = new Date().toISOString().split('T')[0];
      pdf.save(`GreenWaveReport_${date}.pdf`);
      
      toast({
        title: "דוח נוצר בהצלחה",
        description: "הדוח נשמר במחשב שלך",
        variant: "default",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "שגיאה ביצירת דוח",
        description: "אירעה שגיאה בעת יצירת ה-PDF",
        variant: "destructive",
      });
    }
  };
  
  // Create cover page
  const createCoverPage = (pdf: jsPDF) => {
    const currentDate = new Date().toLocaleDateString('he-IL');
    const title = t('app_title');
    const subtitle = t('app_subtitle');
    
    // Background gradient
    pdf.setFillColor(234, 242, 252);
    pdf.rect(0, 0, 210, 297, 'F');
    
    // Add decorative elements
    pdf.setFillColor(155, 135, 245); // Primary Purple
    pdf.setDrawColor(155, 135, 245);
    pdf.roundedRect(15, 15, 180, 10, 5, 5, 'F');
    pdf.roundedRect(15, 272, 180, 10, 5, 5, 'F');
    
    // Add logo - using base64 string for simplicity
    // This will be a simple placeholder since we can't easily access the actual logo
    pdf.setFillColor(155, 135, 245);
    pdf.roundedRect(75, 80, 60, 60, 5, 5, 'F');
    
    // Add title
    pdf.setTextColor(29, 31, 44); // Dark color
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(26);
    
    // RTL text handling
    const titleWidth = pdf.getStringUnitWidth(title) * 26 / pdf.internal.scaleFactor;
    pdf.text(title, 105 + (titleWidth/2), 170, { align: 'center', direction: 'rtl' });
    
    // Add subtitle
    pdf.setFontSize(14);
    const subtitleWidth = pdf.getStringUnitWidth(subtitle) * 14 / pdf.internal.scaleFactor;
    pdf.text(subtitle, 105 + (subtitleWidth/2), 185, { align: 'center', direction: 'rtl' });
    
    // Add date
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(`תאריך: ${currentDate}`, 105, 230, { align: 'center', direction: 'rtl' });
  };
  
  // Add chart page
  const addChartPage = async (pdf: jsPDF, chartElement: HTMLElement) => {
    // Capture chart element
    const canvas = await html2canvas(chartElement, {
      scale: 2, // Higher scale for better quality
      backgroundColor: '#FFFFFF'
    });
    
    // Calculate dimensions to fit A4 landscape with margins
    const imgWidth = 277; // A4 landscape width (297mm) minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add title to the page
    pdf.setTextColor(29, 31, 44);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(t('green_wave_chart'), 148, 15, { align: 'center', direction: 'rtl' });
    
    // Add chart image
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, Math.min(imgHeight, 180));
  };
  
  // Add table page
  const addTablePage = async (pdf: jsPDF, tableElement: HTMLElement) => {
    // Capture table element
    const canvas = await html2canvas(tableElement, {
      scale: 2,
      backgroundColor: '#FFFFFF'
    });
    
    // Calculate dimensions to fit A4 portrait with margins
    const imgWidth = 190; // A4 portrait width (210mm) minus margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Add title to the page
    pdf.setTextColor(29, 31, 44);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    
    // Add result type based on mode
    let resultsTitle = '';
    if (mode === 'manual') {
      resultsTitle = t('manual_results');
    } else {
      resultsTitle = t('optimization_results');
    }
    
    const titleWidth = pdf.getStringUnitWidth(resultsTitle) * 16 / pdf.internal.scaleFactor;
    pdf.text(resultsTitle, 105 + (titleWidth/2), 15, { align: 'center', direction: 'rtl' });
    
    // Add table image
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 10, 20, imgWidth, Math.min(imgHeight, 267));
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="print-button gap-2 rtl:mr-2 ltr:ml-2"
        onClick={generatePDF}
      >
        <FileText className="h-4 w-4" />
        {t('print_report')}
      </Button>
      
      {/* Hidden references to chart and table for capturing */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={chartRef} id="chart-for-pdf">
          <div id="pdf-green-wave-chart-container" />
        </div>
        <div ref={tableRef} id="table-for-pdf">
          <div id="pdf-metrics-table-container" />
        </div>
      </div>
    </>
  );
};
