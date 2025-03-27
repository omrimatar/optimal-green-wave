
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
    
    printOptions.forEach(option => {
      if (option.checked) {
        document.body.classList.add(`print-${option.id}`);
      } else {
        document.body.classList.add(`hide-${option.id}`);
      }
    });

    // Trigger print
    window.print();

    // Clean up classes after print dialog is closed
    setTimeout(() => {
      document.body.classList.remove("is-printing");
      printOptions.forEach(option => {
        document.body.classList.remove(`print-${option.id}`);
        document.body.classList.remove(`hide-${option.id}`);
      });
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
