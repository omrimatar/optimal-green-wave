import React, { createContext, useContext, useState, useEffect } from 'react';

interface LanguageContextProps {
  language: 'en' | 'he';
  t: (key: string) => string;
  setLanguage: (lang: 'en' | 'he') => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const translations = {
  en: {
    app_title: "Green Wave Optimizer",
    app_subtitle: "Optimize traffic signal timings for a smoother commute",
    cycle_time: "Global Cycle Time (seconds)",
    default_speed: "Default Design Speed (km/h)",
    intersections: "Intersections",
    add_intersection: "Add Intersection",
    add: "Add",
    distance: "Distance (meters)",
    upstream_duration: "Upstream Duration (seconds)",
    downstream_duration: "Downstream Duration (seconds)",
    upstream_speed: "Upstream Speed (km/h)",
    downstream_speed: "Downstream Speed (km/h)",
    delete_intersection: "Delete Intersection",
    draw_existing: "Show Existing",
    manual_calculation: "Manual Calculation",
    manual: "Manual",
    calculate_green_wave: "Calculate Green Wave",
    calculate: "Calculate",
    file_actions: "File Actions",
    load_input: "Load Input",
    save_input: "Save Input",
    save_results: "Save Results",
    optimization_weights: "Optimization Weights",
    toggle_weights: "Toggle Weights",
    reset_weights: "Reset Weights",
    delays: "Delays",
    stops: "Stops",
    fuel: "Fuel Consumption",
    emissions: "Emissions",
    travel_time: "Travel Time",
    total_score: "Total Score",
    metrics: "Metrics",
    optimization_charts: "Optimization Charts",
    delays_chart: "Delays Chart",
    stops_chart: "Stops Chart",
    fuel_chart: "Fuel Consumption Chart",
    emissions_chart: "Emissions Chart",
    travel_time_chart: "Travel Time Chart",
    baseline: "Baseline",
    optimized: "Optimized",
    manual_offsets: "Manual Offsets",
    offsets_description: "Enter the desired offsets for each intersection. The first intersection's offset is fixed at 0.",
    intersection: "Intersection",
    print: "Print",
    print_options: "Print Options",
    select_print_items: "Select the items you want to print",
    cancel: "Cancel"
  },
  he: {
    app_title: "מטבֵּחַ גל ירוק",
    app_subtitle: "מטבים את תזמוני הרמזורים לנסיעה חלקה יותר",
    cycle_time: "זמן מחזור גלובלי (שניות)",
    default_speed: "מהירות תכן ברירת מחדל (קמ\"ש)",
    intersections: "צמתים",
    add_intersection: "הוסף צומת",
    add: "הוסף",
    distance: "מרחק (מטרים)",
    upstream_duration: "משך זרם עולה (שניות)",
    downstream_duration: "משך זרם יורד (שניות)",
    upstream_speed: "מהירות זרם עולה (קמ\"ש)",
    downstream_speed: "מהירות זרם יורד (קמ\"ש)",
    delete_intersection: "מחק צומת",
    draw_existing: "הצג מצב קיים",
    manual_calculation: "חישוב ידני",
    manual: "ידני",
    calculate_green_wave: "חשב גל ירוק",
    calculate: "חשב",
    file_actions: "פעולות קובץ",
    load_input: "טען קלט",
    save_input: "שמור קלט",
    save_results: "שמור תוצאות",
    optimization_weights: "משקלי אופטימיזציה",
    toggle_weights: "הצג/הסתר משקלים",
    reset_weights: "אפס משקלים",
    delays: "עיכובים",
    stops: "עצירות",
    fuel: "צריכת דלק",
    emissions: "פליטות",
    travel_time: "זמן נסיעה",
    total_score: "ניקוד כולל",
    metrics: "מדדים",
    optimization_charts: "תרשימי אופטימיזציה",
    delays_chart: "תרשים עיכובים",
    stops_chart: "תרשים עצירות",
    fuel_chart: "תרשים צריכת דלק",
    emissions_chart: "תרשים פליטות",
    travel_time_chart: "תרשים זמן נסיעה",
    baseline: "קו בסיס",
    optimized: "מותאם",
    manual_offsets: "הזחות ידניות",
    offsets_description: "הזן את ההזחות הרצויות עבור כל צומת. ההזחה של הצומת הראשון קבועה על 0.",
    intersection: "צומת",
    print: "הדפסה",
    print_options: "אפשרויות הדפסה",
    select_print_items: "בחר את הפריטים שברצונך להדפיס",
    cancel: "ביטול"
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'he'>((localStorage.getItem('language') as 'en' | 'he') || 'he');

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  const value: LanguageContextProps = {
    language,
    t,
    setLanguage,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
