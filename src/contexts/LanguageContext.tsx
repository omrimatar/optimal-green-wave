import React, { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'he' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  he: {
    "app_title": {
      he: "מחשבון גל ירוק",
      en: "Green Wave Calculator"
    },
    "app_subtitle": {
      he: "כלי לתכנון אופטימלי של תזמוני רמזורים",
      en: "A tool for optimal traffic light timing planning"
    },
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
      he: "מופעים ירוקים",
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
      he: "מופע ירוק במעלה הזרם",
      en: "Upstream Green Phase"
    },
    "downstream_phase": {
      he: "מופע ירוק במורד הזרם",
      en: "Downstream Green Phase"
    },
    "secondary_upstream_phase": {
      he: "מופע ירוק משני במעלה הזרם",
      en: "Secondary Upstream Green Phase"
    },
    "secondary_downstream_phase": {
      he: "מופע ירוק משני במורד הזרם",
      en: "Secondary Downstream Green Phase"
    },
    "start_time": {
      he: "זמן התחלה",
      en: "Start Time"
    },
    "duration": {
      he: "משך",
      en: "Duration"
    },
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
    "manual_offsets": {
      he: "הזנת היסטים ידנית",
      en: "Manual Offset Input"
    },
    "offsets_description": {
      he: "הזן את ערכי ה-offset עבור כל צומת (בשניות). שים לב שה-offset של הצומת הראשון תמיד יהיה 0.",
      en: "Enter the offset values for each intersection (in seconds). Note that the offset of the first intersection will always be 0."
    },
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
    "language": {
      he: "English",
      en: "עברית"
    },
    "must_not_exceed": {
      he: "לא יכול לעבור את",
      en: "must not exceed"
    },
    "phase_starts_after_half_cycle": {
      he: "יש מופע שמתחיל אחרי חצי זמן המחזור",
      en: "there's a phase that starts after half cycle time"
    },
    "phase_extends_beyond_half_cycle": {
      he: "יש מופע שחורג מחצי זמן המחזור",
      en: "there's a phase that extends beyond half cycle time"
    },
    "cannot_enable_half_cycle": {
      he: "לא ניתן להפעיל חצי זמן מחזור",
      en: "Cannot enable half cycle time"
    },
    "debug": {
      he: "דיבאג",
      en: "Debug"
    },
    "contact_us": 'Contact Us',
    "import_data": {
      he: "ייבוא נתונים",
      en: "Import Data"
    },
    "export_data": {
      he: "ייצוא נתונים",
      en: "Export Data"
    },
    "admin_login": {
      he: "כניסת אדמין",
      en: "Admin Login"
    },
    "green_wave_chart": {
      he: "תרשים גל ירוק",
      en: "Green Wave Chart"
    }
  },
  en: {
    "app_title": {
      he: "מחשבון גל ירוק",
      en: "Green Wave Calculator"
    },
    "app_subtitle": {
      he: "כלי לתכנון אופטימלי של תזמוני רמזורים",
      en: "A tool for optimal traffic light timing planning"
    },
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
      he: "מופעים ירוקים",
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
      he: "מופע ירוק במעלה הזרם",
      en: "Upstream Green Phase"
    },
    "downstream_phase": {
      he: "מופע ירוק במורד הזרם",
      en: "Downstream Green Phase"
    },
    "secondary_upstream_phase": {
      he: "מופע ירוק משני במעלה הזרם",
      en: "Secondary Upstream Green Phase"
    },
    "secondary_downstream_phase": {
      he: "מופע ירוק משני במורד הזרם",
      en: "Secondary Downstream Green Phase"
    },
    "start_time": {
      he: "זמן התחלה",
      en: "Start Time"
    },
    "duration": {
      he: "משך",
      en: "Duration"
    },
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
    "manual_offsets": {
      he: "הזנת היסטים ידנית",
      en: "Manual Offset Input"
    },
    "offsets_description": {
      he: "הזן את ערכי ה-offset עבור כל צומת (בשניות). שים לב שה-offset של הצומת הראשון תמיד יהיה 0.",
      en: "Enter the offset values for each intersection (in seconds). Note that the offset of the first intersection will always be 0."
    },
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
    "language": {
      he: "English",
      en: "עברית"
    },
    "must_not_exceed": {
      he: "לא יכול לעבור את",
      en: "must not exceed"
    },
    "phase_starts_after_half_cycle": {
      he: "יש מופע שמתחיל אחרי חצי זמן המחזור",
      en: "there's a phase that starts after half cycle time"
    },
    "phase_extends_beyond_half_cycle": {
      he: "יש מופע שחורג מחצי זמן המחזור",
      en: "there's a phase that extends beyond half cycle time"
    },
    "cannot_enable_half_cycle": {
      he: "לא ניתן להפעיל חצי זמן מחזור",
      en: "Cannot enable half cycle time"
    },
    "debug": {
      he: "דיבאג",
      en: "Debug"
    },
    "contact_us": 'Contact Us',
    "import_data": {
      he: "ייבוא נתונים",
      en: "Import Data"
    },
    "export_data": {
      he: "ייצוא נתונים",
      en: "Export Data"
    },
    "admin_login": {
      he: "כניסת אדמין",
      en: "Admin Login"
    },
    "green_wave_chart": {
      he: "תרשים גל ירוק",
      en: "Green Wave Chart"
    }
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
