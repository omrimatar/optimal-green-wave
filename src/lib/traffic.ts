
import { greenWaveOptimization } from "./traffic/index";

// מייצא את הפונקציות והטיפוסים העיקריים
export { greenWaveOptimization };
export type { GreenPhase, Intersection } from "@/types/traffic";

// מזהה האם המכשיר הוא מובייל
export const isMobileDevice = () => {
  return (
    typeof window !== "undefined" &&
    (window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ))
  );
};

// פונקציית עזר להתאמה למובייל ולמסכים שונים
export const getMobileScale = () => {
  if (typeof window === "undefined") return 1;
  const width = window.innerWidth;
  if (width <= 360) return 0.7;
  if (width <= 480) return 0.8;
  if (width <= 768) return 0.9;
  return 1;
};

// פונקציות עזר נוספות לתצוגה רספונסיבית
export const getResponsiveFontSize = (baseSize: number) => {
  const scale = getMobileScale();
  return Math.max(baseSize * scale, 9); // מינימום גודל פונט 9px
};

export const getResponsiveSpacing = (baseSpacing: number) => {
  const scale = getMobileScale();
  return Math.max(baseSpacing * scale, 2); // מינימום מרווח 2px
};
