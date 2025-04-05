import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'he';

interface LanguageContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('he');

  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[key]?.[language] || key;
    if (params) {
      return Object.entries(params).reduce((acc, [paramKey, paramValue]) => {
        const regex = new RegExp(`\\{${paramKey}\\}`, 'g');
        return acc.replace(regex, String(paramValue));
      }, translation);
    }
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextProps => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Translation dictionary
const translations = {
  app_title: {
    en: 'Green Wave Optimizer',
    he: 'מטבֵּעַ גל ירוק'
  },
  app_subtitle: {
    en: 'Optimize traffic signal timings for smoother traffic flow.',
    he: 'מיטוב תזמוני רמזורים לזרימת תנועה חלקה יותר.'
  },
  cycle_time: {
    en: 'Global Cycle Time (seconds)',
    he: 'זמן מחזור גלובלי (שניות)'
  },
  default_speed: {
    en: 'Default Design Speed (km/h)',
    he: 'מהירות תכן ברירת מחדל (קמ"ש)'
  },
  intersections: {
    en: 'Intersections',
    he: 'צמתים'
  },
  add_intersection: {
    en: 'Add Intersection',
    he: 'הוסף צומת'
  },
  add: {
    en: 'Add',
    he: 'הוסף'
  },
  intersection: {
    en: 'Intersection',
    he: 'צומת'
  },
  distance: {
    en: 'Distance (meters)',
    he: 'מרחק (מטרים)'
  },
  upstream_speed: {
    en: 'Upstream Speed (km/h)',
    he: 'מהירות במעלה הזרם (קמ"ש)'
  },
  downstream_speed: {
    en: 'Downstream Speed (km/h)',
    he: 'מהירות במורד הזרם (קמ"ש)'
  },
  green_phases: {
    en: 'Green Phases',
    he: 'פאזות ירוקות'
  },
  direction: {
    en: 'Direction',
    he: 'כיוון'
  },
  start_time: {
    en: 'Start Time (seconds)',
    he: 'זמן התחלה (שניות)'
  },
  duration: {
    en: 'Duration (seconds)',
    he: 'משך (שניות)'
  },
  upstream: {
    en: 'Upstream',
    he: 'מעלה הזרם'
  },
  downstream: {
    en: 'Downstream',
    he: 'מורד הזרם'
  },
  calculate_green_wave: {
    en: 'Calculate Green Wave',
    he: 'חשב גל ירוק'
  },
  calculate: {
    en: 'Calculate',
    he: 'חשב'
  },
  draw_existing: {
    en: 'Show Existing',
    he: 'הצג מצב קיים'
  },
  optimization_results: {
    en: 'Optimization Results',
    he: 'תוצאות אופטימיזציה'
  },
  initial_state: {
    en: 'Initial State',
    he: 'מצב התחלתי'
  },
  manual_state: {
    en: 'Manual State',
    he: 'מצב ידני'
  },
  metric: {
    en: 'Metric',
    he: 'מדד'
  },
  baseline: {
    en: 'Baseline',
    he: 'בסיס'
  },
  optimized: {
    en: 'Optimized',
    he: 'ממוטב'
  },
  improvement: {
    en: 'Improvement',
    he: 'שיפור'
  },
  intersection_offset: {
    en: 'Intersection Offset',
    he: 'הסטת צומת'
  },
  upstream_local_bandwidth: {
    en: 'Upstream Local Bandwidth',
    he: 'רוחב פס מקומי במעלה הזרם'
  },
  downstream_local_bandwidth: {
    en: 'Downstream Local Bandwidth',
    he: 'רוחב פס מקומי במורד הזרם'
  },
  upstream_corridor_bandwidth: {
    en: 'Upstream Corridor Bandwidth',
    he: 'רוחב פס מסדרון במעלה הזרם'
  },
  downstream_corridor_bandwidth: {
    en: 'Downstream Corridor Bandwidth',
    he: 'רוחב פס מסדרון במורד הזרם'
  },
  upstream_avg_delay: {
    en: 'Upstream Avg. Delay',
    he: 'ממוצע עיכוב במעלה הזרם'
  },
  downstream_avg_delay: {
    en: 'Downstream Avg. Delay',
    he: 'ממוצע עיכוב במורד הזרם'
  },
  upstream_max_delay: {
    en: 'Upstream Max. Delay',
    he: 'עיכוב מקסימלי במעלה הזרם'
  },
  downstream_max_delay: {
    en: 'Downstream Max. Delay',
    he: 'עיכוב מקסימלי במורד הזרם'
  },
  optimal: {
    en: 'Optimal',
    he: 'אופטימלי'
  },
  admin_login: {
    en: 'Admin Login',
    he: 'כניסת מנהל'
  },
  maintenance_mode: {
    en: 'Maintenance Mode',
    he: 'מצב תחזוקה'
  },
  enabled: {
    en: 'Enabled',
    he: 'מאופשר'
  },
  disabled: {
    en: 'Disabled',
    he: 'מנוטרל'
  },
  save_changes: {
    en: 'Save Changes',
    he: 'שמור שינויים'
  },
  cancel: {
    en: 'Cancel',
    he: 'ביטול'
  },
  import_data: {
    en: 'Import Data',
    he: 'ייבוא נתונים'
  },
  export_data: {
    en: 'Export Data',
    he: 'ייצוא נתונים'
  },
  weights: {
    en: 'Weights',
    he: 'משקולות'
  },
  show_weights: {
    en: 'Show Weights',
    he: 'הצג משקולות'
  },
  hide_weights: {
    en: 'Hide Weights',
    he: 'הסתר משקולות'
  },
  reset_weights: {
    en: 'Reset Weights',
    he: 'אפס משקולות'
  },
  distance_weight: {
    en: 'Distance Weight',
    he: 'משקל מרחק'
  },
  delay_weight: {
    en: 'Delay Weight',
    he: 'משקל עיכוב'
  },
  stops_weight: {
    en: 'Stops Weight',
    he: 'משקל עצירות'
  },
  manual_calculation: {
    en: 'Manual Calculation',
    he: 'חישוב ידני'
  },
  manual: {
    en: 'Manual',
    he: 'ידני'
  },
  manual_offsets: {
    en: 'Manual Offsets',
    he: 'הזחות ידניות'
  },
  offsets_description: {
    en: 'Enter the offset for each intersection in seconds. The first intersection offset is fixed to 0.',
    he: 'הזן את ההסטה לכל צומת בשניות. ההסטה של הצומת הראשונה קבועה ל-0.'
  },
  use_half_cycle_time: {
    en: 'Use Half Cycle Time',
    he: 'השתמש בחצי זמן מחזור'
  },
  name: {
    en: 'Name',
    he: 'שם'
  },
  delete_intersection: {
    en: 'Delete Intersection',
    he: 'מחק צומת'
  },
  delete: {
    en: 'Delete',
    he: 'מחק'
  },
  // PDF Report translations
  generate_pdf_report: {
    en: 'Generate PDF Report',
    he: 'הפק דוח PDF'
  },
  preparing_report: {
    en: 'Preparing report...',
    he: 'מכין דוח...'
  },
  report_generated: {
    en: 'Report generated successfully',
    he: 'הדוח נוצר בהצלחה'
  },
  print_error: {
    en: 'Error generating report',
    he: 'שגיאה ביצירת הדוח'
  },
  pdf_report_preview: {
    en: 'PDF Report Preview',
    he: 'תצוגה מקדימה של דוח PDF'
  },
  print_report: {
    en: 'Print Report',
    he: 'הדפס דוח'
  },
  report_contents: {
    en: 'Report Contents',
    he: 'תוכן הדוח'
  },
  cover_page: {
    en: 'Cover Page',
    he: 'דף שער'
  },
  with_logo_and_date: {
    en: 'with logo and date',
    he: 'כולל לוגו ותאריך'
  },
  green_wave_chart: {
    en: 'Green Wave Chart',
    he: 'תרשים גל ירוק'
  },
  landscape_orientation: {
    en: 'landscape orientation',
    he: 'בתצורה לרוחב'
  },
  optimization_data_table: {
    en: 'Optimization Data Table',
    he: 'טבלת נתוני אופטימיזציה'
  },
  portrait_orientation: {
    en: 'portrait orientation',
    he: 'בתצורה לאורך'
  },
  print_dialog_note: {
    en: 'Select "Print" to open the print dialog. Choose PDF as the destination to save as PDF.',
    he: 'לחץ על "הדפס" כדי לפתוח את חלון ההדפסה. בחר PDF כיעד כדי לשמור כקובץ PDF.'
  }
};
