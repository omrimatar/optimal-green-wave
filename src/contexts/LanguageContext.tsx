
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
  | 'continue_anyway'
  | 'show_weights'
  | 'hide_weights'
  | 'reset'
  | 'corridor_wave'
  | 'upstream'
  | 'downstream'
  | 'pair_bandwidth'
  | 'average_delay'
  | 'maximum_delay'
  | 'half_cycle_time'
  | 'effective_cycle_time'
  | 'seconds'
  | 'upstream_speed'
  | 'downstream_speed'
  | 'green_phases'
  | 'upstream_phase'
  | 'downstream_phase'
  | 'add_upstream_phase'
  | 'add_downstream_phase'
  | 'start_time'
  | 'duration'
  | 'distance'
  | 'metric'
  | 'baseline'
  | 'optimized'
  | 'improvement'
  | 'intersection_offset'
  | 'upstream_local_bandwidth'
  | 'downstream_local_bandwidth'
  | 'upstream_corridor_bandwidth'
  | 'downstream_corridor_bandwidth'
  | 'upstream_avg_delay'
  | 'downstream_avg_delay'
  | 'upstream_max_delay'
  | 'downstream_max_delay'
  | 'initial_state'
  | 'manual_state'
  | 'manual_results'
  | 'optimization_results'
  | 'optimal'
  | 'contact us';

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
    continue_anyway: 'Continue Anyway',
    show_weights: 'Show Weights',
    hide_weights: 'Hide Weights',
    reset: 'Reset',
    corridor_wave: 'Corridor Wave',
    upstream: 'Upstream',
    downstream: 'Downstream',
    pair_bandwidth: 'Pair Bandwidth',
    average_delay: 'Average Delay',
    maximum_delay: 'Maximum Delay',
    half_cycle_time: 'Half Cycle Time',
    effective_cycle_time: 'Effective Cycle Time',
    seconds: 'seconds',
    upstream_speed: 'Upstream Speed',
    downstream_speed: 'Downstream Speed',
    green_phases: 'Green Phases',
    upstream_phase: 'Upstream Phase',
    downstream_phase: 'Downstream Phase',
    add_upstream_phase: 'Add Upstream',
    add_downstream_phase: 'Add Downstream',
    start_time: 'Start Time',
    duration: 'Duration',
    distance: 'Distance',
    metric: 'Metric',
    baseline: 'Baseline',
    optimized: 'Optimized',
    improvement: 'Improvement',
    intersection_offset: 'Intersection Offset',
    upstream_local_bandwidth: 'Upstream Local Bandwidth',
    downstream_local_bandwidth: 'Downstream Local Bandwidth',
    upstream_corridor_bandwidth: 'Upstream Corridor Bandwidth',
    downstream_corridor_bandwidth: 'Downstream Corridor Bandwidth',
    upstream_avg_delay: 'Upstream Avg Delay',
    downstream_avg_delay: 'Downstream Avg Delay',
    upstream_max_delay: 'Upstream Max Delay',
    downstream_max_delay: 'Downstream Max Delay',
    initial_state: 'Initial State',
    manual_state: 'Manual State',
    manual_results: 'Manual Results',
    optimization_results: 'Optimization Results',
    optimal: 'Optimal',
    'contact us': 'Contact Us'
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
    continue_anyway: 'המשך בכל זאת',
    show_weights: 'הצג משקולות',
    hide_weights: 'הסתר משקולות',
    reset: 'איפוס',
    corridor_wave: 'גל מסדרון',
    upstream: 'במעלה הזרם',
    downstream: 'במורד הזרם',
    pair_bandwidth: 'רוחב פס צמדים',
    average_delay: 'עיכוב ממוצע',
    maximum_delay: 'עיכוב מקסימלי',
    half_cycle_time: 'חצי זמן מחזור',
    effective_cycle_time: 'זמן מחזור אפקטיבי',
    seconds: 'שניות',
    upstream_speed: 'מהירות במעלה הזרם',
    downstream_speed: 'מהירות במורד הזרם',
    green_phases: 'פאזות ירוקות',
    upstream_phase: 'פאזה במעלה הזרם',
    downstream_phase: 'פאזה במורד הזרם',
    add_upstream_phase: 'הוסף במעלה',
    add_downstream_phase: 'הוסף במורד',
    start_time: 'זמן התחלה',
    duration: 'משך',
    distance: 'מרחק',
    metric: 'מדד',
    baseline: 'בסיס',
    optimized: 'מותאם',
    improvement: 'שיפור',
    intersection_offset: 'היסט צומת',
    upstream_local_bandwidth: 'רוחב פס מקומי במעלה הזרם',
    downstream_local_bandwidth: 'רוחב פס מקומי במורד הזרם',
    upstream_corridor_bandwidth: 'רוחב פס מסדרון במעלה הזרם',
    downstream_corridor_bandwidth: 'רוחב פס מסדרון במורד הזרם',
    upstream_avg_delay: 'עיכוב ממוצע במעלה הזרם',
    downstream_avg_delay: 'עיכוב ממוצע במורד הזרם',
    upstream_max_delay: 'עיכוב מקסימלי במעלה הזרם',
    downstream_max_delay: 'עיכוב מקסימלי במורד הזרם',
    initial_state: 'מצב התחלתי',
    manual_state: 'מצב ידני',
    manual_results: 'תוצאות ידניות',
    optimization_results: 'תוצאות אופטימיזציה',
    optimal: 'אופטימלי',
    'contact us': 'צור קשר'
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
