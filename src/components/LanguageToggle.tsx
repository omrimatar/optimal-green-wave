
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

export const LanguageToggle = () => {
  const { language, toggleLanguage, t } = useLanguage();

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleLanguage}
      className="flex items-center gap-1"
    >
      <Globe size={16} />
      <span>{t('language')}</span>
    </Button>
  );
};
