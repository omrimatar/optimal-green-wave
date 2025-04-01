
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'he';

type TranslationKey = 
  | 'app_title'
  | 'app_subtitle' 
  | 'language'
  | 'cycle_time'
  | 'default_speed'
  | 'weights'
  | 'intersections'
  | 'add_intersection'
  | 'add'
  | 'draw_existing'
  | 'manual_calculation'
  | 'manual'
  | 'manual_offsets'
  | 'offsets_description'
  | 'intersection'
  | 'calculate'
  | 'calculate_green_wave'
  | 'import_data'
  | 'export_data'
  | 'admin_login'
  | 'green_wave_chart'
  | 'graphic_comparison'
  | 'best_experience_title'
  | 'mobile_warning_message'
  | 'not_supported'
  | 'tablet'
  | 'desktop'
  | 'explore_anyway'
  | 'continue_anyway';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    app_title: 'Green Wave Calculator',
    app_subtitle: 'A tool for optimal traffic light timing planning',
    language: 'English',
    cycle_time: 'Cycle Time (seconds)',
    default_speed: 'Design Speed (km/h)',
    weights: 'Optimization Weights',
    intersections: 'Intersections',
    add_intersection: 'Add Intersection',
    add: 'Add',
    draw_existing: 'Show Existing',
    manual_calculation: 'Manual Calculation',
    manual: 'Manual',
    manual_offsets: 'Manual Offsets',
    offsets_description: 'Set offsets manually for each intersection. The first intersection offset is always 0.',
    intersection: 'Intersection',
    calculate: 'Calculate',
    calculate_green_wave: 'Calculate Green Wave',
    import_data: 'Import Data',
    export_data: 'Export Data',
    admin_login: 'Admin Login',
    green_wave_chart: 'Green Wave Chart',
    graphic_comparison: 'Graphic Comparison',
    best_experience_title: 'For the Best Experience',
    mobile_warning_message: 'Green Wave Calculator works best on larger screens. Please use a desktop computer or tablet for the full experience.',
    not_supported: 'Not Supported',
    tablet: 'Tablet',
    desktop: 'Desktop',
    explore_anyway: 'Want to explore anyway?',
    continue_anyway: 'Continue Anyway'
  },
  he: {
    app_title: 'מחשבון גל ירוק',
    app_subtitle: 'כלי לתכנון אופטימלי של תזמוני רמזורים',
    language: 'עברית',
    cycle_time: 'זמן מחזור (שניות)',
    default_speed: 'מהירות תכן (קמ"ש)',
    weights: 'משקולות אופטימיזציה',
    intersections: 'צמתים',
    add_intersection: 'הוסף צומת',
    add: 'הוסף',
    draw_existing: 'הצג קיים',
    manual_calculation: 'חישוב ידני',
    manual: 'ידני',
    manual_offsets: 'היסטים ידניים',
    offsets_description: 'קבע היסטים ידנית עבור כל צומת. ההיסט של הצומת הראשון הוא תמיד 0.',
    intersection: 'צומת',
    calculate: 'חשב',
    calculate_green_wave: 'חשב גל ירוק',
    import_data: 'ייבוא נתונים',
    export_data: 'ייצוא נתונים',
    admin_login: 'כניסת אדמין',
    green_wave_chart: 'תרשים גל ירוק',
    graphic_comparison: 'השוואה גרפית',
    best_experience_title: 'לחוויה המיטבית',
    mobile_warning_message: 'מחשבון גל ירוק עובד הכי טוב על מסכים גדולים. אנא השתמש במחשב שולחני או טאבלט לחוויה המלאה.',
    not_supported: 'לא נתמך',
    tablet: 'טאבלט',
    desktop: 'מחשב',
    explore_anyway: 'רוצה לנסות בכל זאת?',
    continue_anyway: 'המשך בכל זאת'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('he');

  const translate = (key: string): string => {
    if (!translations[language][key]) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    
    const translationEntry = translations[language][key];
    
    if (typeof translationEntry === 'object' && translationEntry !== null) {
      return translationEntry[language] || key;
    }
    
    return translationEntry || key;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'he' ? 'en' : 'he');
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
