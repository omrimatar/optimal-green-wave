
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";

export const LanguageToggle = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <div className="fixed top-4 left-4 z-50">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={toggleLanguage}
        className="flex items-center gap-1"
      >
        <Globe size={16} />
        <span>{t('language')}</span>
      </Button>
    </div>
  );
};
