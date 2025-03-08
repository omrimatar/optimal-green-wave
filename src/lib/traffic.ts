
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

// פונקציית עזר להתאמה למובייל
export const getMobileScale = () => {
  if (typeof window === "undefined") return 1;
  const width = window.innerWidth;
  if (width <= 360) return 0.7;
  if (width <= 480) return 0.8;
  if (width <= 768) return 0.9;
  return 1;
};
