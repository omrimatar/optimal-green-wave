
import { useState } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";

interface PrintOption {
  id: string;
  label: {
    en: string;
    he: string;
  };
  checked: boolean;
}

export function PrintDialog() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOption[]>([
    { id: "intersectionData", label: { en: "Intersection Data", he: "נתוני צמתים" }, checked: true },
    { id: "greenWaveChart", label: { en: "Green Wave Chart", he: "תרשים הגל הירוק" }, checked: true },
    { id: "optimizationCharts", label: { en: "Optimization Charts", he: "תרשימי אופטימיזציה" }, checked: true },
    { id: "metricsTable", label: { en: "Metrics Table", he: "טבלת מדדים" }, checked: true },
  ]);

  const handleOptionChange = (id: string, checked: boolean) => {
    setPrintOptions(
      printOptions.map((option) =>
        option.id === id ? { ...option, checked } : option
      )
    );
  };

  const handlePrint = () => {
    // Add print-only classes based on selected options
    document.body.classList.add("is-printing");
    
    // Add custom print stylesheet
    const style = document.createElement('style');
    style.id = 'print-style';
    style.innerHTML = `
      @media print {
        @page {
          size: A4;
          margin: 1cm;
        }
        
        body {
          font-family: Arial, sans-serif;
        }
        
        /* Hide UI elements */
        header, nav, button, .sidebar, .actions-row {
          display: none !important;
        }
        
        /* Format input data for better readability */
        .print-intersectionData .input-data-section {
          break-inside: avoid;
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        
        .print-intersectionData .input-data-section h3 {
          font-size: 18px;
          margin-bottom: 10px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 5px;
        }
        
        .print-intersectionData .intersection-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .print-intersectionData .intersection-table th,
        .print-intersectionData .intersection-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: ${language === 'he' ? 'right' : 'left'};
        }
        
        .print-intersectionData .intersection-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        
        /* Green Wave Chart formatting */
        .print-greenWaveChart .green-wave-chart {
          page-break-inside: avoid;
          page-break-before: always;
          margin-bottom: 20px;
          max-height: 40vh;
        }
        
        /* Optimization Charts formatting */
        .print-optimizationCharts .optimization-charts {
          page-break-inside: avoid;
          page-break-before: always;
          margin-bottom: 20px;
        }
        
        /* Metrics Table formatting */
        .print-metricsTable .metrics-table {
          page-break-inside: avoid;
          page-break-before: always;
        }
        
        /* Hide sections that shouldn't be printed */
        .hide-intersectionData .input-data-section,
        .hide-greenWaveChart .green-wave-chart,
        .hide-optimizationCharts .optimization-charts,
        .hide-metricsTable .metrics-table {
          display: none !important;
        }
        
        /* Add title on each page */
        .print-header {
          text-align: center;
          margin-bottom: 20px;
          font-size: 24px;
          font-weight: bold;
          display: block !important;
        }
        
        /* Add page numbers */
        .print-footer {
          position: fixed;
          bottom: 0;
          width: 100%;
          text-align: center;
          font-size: 10px;
          display: block !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add print header and footer
    const header = document.createElement('div');
    header.className = 'print-header';
    header.style.display = 'none';
    header.innerHTML = t('app_title');
    document.body.appendChild(header);
    
    const footer = document.createElement('div');
    footer.className = 'print-footer';
    footer.style.display = 'none';
    footer.innerHTML = new Date().toLocaleDateString();
    document.body.appendChild(footer);
    
    // Add classes for selected options
    printOptions.forEach(option => {
      if (option.checked) {
        document.body.classList.add(`print-${option.id}`);
      } else {
        document.body.classList.add(`hide-${option.id}`);
      }
    });

    // Trigger print
    window.print();

    // Clean up after print dialog is closed
    setTimeout(() => {
      document.body.classList.remove("is-printing");
      
      // Remove print-specific classes
      printOptions.forEach(option => {
        document.body.classList.remove(`print-${option.id}`);
        document.body.classList.remove(`hide-${option.id}`);
      });
      
      // Remove added elements
      const styleElement = document.getElementById('print-style');
      if (styleElement) styleElement.remove();
      
      if (header.parentNode) header.parentNode.removeChild(header);
      if (footer.parentNode) footer.parentNode.removeChild(footer);
    }, 1000);
    
    setOpen(false);
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800"
      >
        <Printer size={16} />
        <span>{t('print')}</span>
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md" dir={language === 'he' ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('print_options')}</DialogTitle>
            <DialogDescription>
              {t('select_print_items')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {printOptions.map((option) => (
              <div key={option.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                <Checkbox
                  id={option.id}
                  checked={option.checked}
                  onCheckedChange={(checked) => 
                    handleOptionChange(option.id, checked === true)
                  }
                />
                <Label htmlFor={option.id}>
                  {language === 'he' ? option.label.he : option.label.en}
                </Label>
              </div>
            ))}
          </div>
          
          <DialogFooter className={language === 'he' ? "" : "flex-row-reverse"}>
            <Button onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
              <Printer className="mr-2 h-4 w-4" />
              {t('print')}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">{t('cancel')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
