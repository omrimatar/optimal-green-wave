
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'he' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // General
  "app_title": {
    he: "מחשבון גל ירוק",
    en: "Green Wave Calculator"
  },
  "app_subtitle": {
    he: "כלי לתכנון אופטימלי של תזמוני רמזורים",
    en: "A tool for optimal traffic light timing planning"
  },
  
  // Input card
  "cycle_time": {
    he: "זמן מחזור (שניות)",
    en: "Cycle Time (seconds)"
  },
  "default_speed": {
    he: "מהירות ברירת מחדל (קמ\"ש)",
    en: "Default Speed (km/h)"
  },
  "intersections": {
    he: "צמתים",
    en: "Intersections"
  },
  "add_intersection": {
    he: "הוסף צומת",
    en: "Add Intersection"
  },
  "add": {
    he: "הוסף",
    en: "Add"
  },
  
  // Buttons
  "draw_existing": {
    he: "צייר מצב קיים",
    en: "Draw Existing State"
  },
  "manual_calculation": {
    he: "חישוב ידני",
    en: "Manual Calculation"
  },
  "manual": {
    he: "ידני",
    en: "Manual"
  },
  "calculate": {
    he: "חשב",
    en: "Calculate"
  },
  "calculate_green_wave": {
    he: "חשב גל ירוק",
    en: "Calculate Green Wave"
  },
  
  // Intersection fields
  "intersection": {
    he: "צומת",
    en: "Intersection"
  },
  "distance": {
    he: "מרחק (מטר)",
    en: "Distance (meters)"
  },
  "half_cycle_time": {
    he: "חצי זמן מחזור",
    en: "Half Cycle Time"
  },
  "effective_cycle_time": {
    he: "זמן מחזור בפועל",
    en: "Effective Cycle Time"
  },
  "seconds": {
    he: "שניות",
    en: "seconds"
  },
  "upstream_speed": {
    he: "מהירות במעלה הזרם (קמ\"ש)",
    en: "Upstream Speed (km/h)"
  },
  "downstream_speed": {
    he: "מהירות במורד הזרם (קמ\"ש)",
    en: "Downstream Speed (km/h)"
  },
  "green_phases": {
    he: "פאזות ירוקות",
    en: "Green Phases"
  },
  "add_upstream_phase": {
    he: "הוסף מופע במעלה",
    en: "Add Upstream Phase"
  },
  "add_downstream_phase": {
    he: "הוסף מופע במורד",
    en: "Add Downstream Phase"
  },
  "upstream_phase": {
    he: "פאזה ירוקה במעלה הזרם",
    en: "Upstream Green Phase"
  },
  "downstream_phase": {
    he: "פאזה ירוקה במורד הזרם",
    en: "Downstream Green Phase"
  },
  "start_time": {
    he: "זמן התחלה",
    en: "Start Time"
  },
  "duration": {
    he: "משך",
    en: "Duration"
  },
  
  // Weights
  "show_weights": {
    he: "הצג משקולות אופטימיזציה",
    en: "Show Optimization Weights"
  },
  "hide_weights": {
    he: "הסתר משקולות אופטימיזציה",
    en: "Hide Optimization Weights"
  },
  "reset": {
    he: "איפוס",
    en: "Reset"
  },
  "corridor_wave": {
    he: "גל ירוק בציר",
    en: "Corridor Green Wave"
  },
  "upstream": {
    he: "במעלה הזרם",
    en: "Upstream"
  },
  "downstream": {
    he: "במורד הזרם",
    en: "Downstream"
  },
  "pair_bandwidth": {
    he: "רוחב פס בין צמתים סמוכים",
    en: "Bandwidth Between Adjacent Intersections"
  },
  "average_delay": {
    he: "עיכוב ממוצע",
    en: "Average Delay"
  },
  "maximum_delay": {
    he: "עיכוב מקסימלי",
    en: "Maximum Delay"
  },
  
  // Manual offset dialog
  "manual_offsets": {
    he: "הזנת היסטים ידנית",
    en: "Manual Offset Input"
  },
  "offsets_description": {
    he: "הזן את ערכי ה-offset עבור כל צומת (בשניות). שים לב שה-offset של הצומת הראשון תמיד יהיה 0.",
    en: "Enter the offset values for each intersection (in seconds). Note that the offset of the first intersection will always be 0."
  },
  
  // Results card
  "optimization_results": {
    he: "תוצאות האופטימיזציה",
    en: "Optimization Results"
  },
  "manual_results": {
    he: "תוצאות החישוב הידני",
    en: "Manual Calculation Results"
  },
  "optimal": {
    he: "אופטימלי",
    en: "Optimal"
  },
  "baseline": {
    he: "בסיס",
    en: "Baseline"
  },
  "optimized": {
    he: "אופטימיזציה",
    en: "Optimized"
  },
  "initial_state": {
    he: "מצב התחלתי",
    en: "Initial State"
  },
  "manual_state": {
    he: "מצב ידני",
    en: "Manual State"
  },
  "metric": {
    he: "מדד",
    en: "Metric"
  },
  "improvement": {
    he: "שיפור",
    en: "Improvement"
  },
  
  // Table metrics
  "intersection_offset": {
    he: "היסט צומת",
    en: "Intersection Offset"
  },
  "upstream_local_bandwidth": {
    he: "רוחב פס מקומי למעלה",
    en: "Upstream Local Bandwidth"
  },
  "downstream_local_bandwidth": {
    he: "רוחב פס מקומי למטה",
    en: "Downstream Local Bandwidth"
  },
  "upstream_corridor_bandwidth": {
    he: "רוחב פס בציר למעלה",
    en: "Upstream Corridor Bandwidth"
  },
  "downstream_corridor_bandwidth": {
    he: "רוחב פס בציר למטה",
    en: "Downstream Corridor Bandwidth"
  },
  "upstream_avg_delay": {
    he: "עיכוב ממוצע למעלה צמתים",
    en: "Average Upstream Delay Intersections"
  },
  "downstream_avg_delay": {
    he: "עיכוב ממוצע למטה צמתים",
    en: "Average Downstream Delay Intersections"
  },
  "upstream_max_delay": {
    he: "עיכוב מקסימלי למעלה צמתים",
    en: "Maximum Upstream Delay Intersections"
  },
  "downstream_max_delay": {
    he: "עיכוב מקסימלי למטה צמתים",
    en: "Maximum Downstream Delay Intersections"
  },
  
  // Chart titles
  "graphic_comparison": {
    he: "השוואה גרפית",
    en: "Graphic Comparison"
  },
  "manual_graphic_comparison": {
    he: "השוואה גרפית - מצב ידני",
    en: "Graphic Comparison - Manual State"
  },
  "optimization_graphic_comparison": {
    he: "השוואה גרפית - אופטימיזציה",
    en: "Graphic Comparison - Optimization"
  },
  "existing_graphic_comparison": {
    he: "השוואה גרפית-ידני",
    en: "Graphic Comparison - Manual"
  },
  
  // Chart metrics
  "corridor_width": {
    he: "רוחב מסדרון",
    en: "Corridor Width"
  },
  "avg_delay": {
    he: "עיכוב ממוצע",
    en: "Avg Delay"
  },
  "positive_metrics": {
    he: "מדדים חיוביים",
    en: "Positive Metrics"
  },
  "negative_metrics": {
    he: "מדדים שליליים",
    en: "Negative Metrics"
  },
  
  // Chart toggle 
  "compare_directions": {
    he: "השוואה בין כיוונים",
    en: "Compare Directions"
  },
  "compare_states": {
    he: "השוואה בין מצבים",
    en: "Compare States"
  },
  "optimization": {
    he: "אופטימיזציה",
    en: "Optimization"
  },
  "directions": {
    he: "כיוונים",
    en: "Directions"
  },
  
  // Language toggle
  "language": {
    he: "English",
    en: "עברית"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('he');

  const translate = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translations[key][language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
