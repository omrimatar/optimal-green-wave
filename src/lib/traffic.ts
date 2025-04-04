
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

/**
 * Helper function to handle diagonal lines that cross cycle time boundaries
 * Improved with boundary checks and validation
 */
export const handleCycleTimeCrossing = (
  originX: number, 
  destX: number, 
  originTime: number, 
  destTime: number, 
  cycleTime: number, 
  yScale: (value: number) => number, 
  chartHeight: number
) => {
  // Validate inputs to prevent NaN or invalid calculations
  if (isNaN(originX) || isNaN(destX) || isNaN(originTime) || 
      isNaN(destTime) || isNaN(cycleTime) || !chartHeight) {
    console.error('Invalid input to handleCycleTimeCrossing:', 
      { originX, destX, originTime, destTime, cycleTime, chartHeight });
    
    // Return safe default that won't render
    return {
      wrapsAround: false,
      full: {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0
      }
    };
  }
  
  // Ensure times are within cycle bounds
  originTime = Math.max(0, Math.min(cycleTime, originTime));
  destTime = Math.max(0, Math.min(cycleTime, destTime));
  
  if (destTime < originTime) {
    try {
      // Calculate time and position parameters
      const totalTimeDiff = cycleTime - originTime + destTime;
      const timeToCycleEnd = cycleTime - originTime;
      
      // Prevent division by zero
      const proportionToCycleEnd = totalTimeDiff === 0 ? 
        0.5 : timeToCycleEnd / totalTimeDiff;
      
      const distanceToTravel = Math.abs(destX - originX);
      const distanceToCycleEnd = distanceToTravel * proportionToCycleEnd;
      
      // Calculate X position at cycle boundary
      const xDirection = destX > originX ? 1 : -1;
      const xAtCycleEnd = originX + (xDirection * distanceToCycleEnd);
      
      // Calculate Y positions
      const originY = chartHeight - yScale(originTime);
      const destY = chartHeight - yScale(destTime);
      const cycleEndY = chartHeight - yScale(cycleTime);
      const cycleStartY = chartHeight - yScale(0);
      
      // Check if any coordinate is NaN and provide fallback
      if ([originY, destY, cycleEndY, cycleStartY].some(isNaN)) {
        console.warn('NaN value detected in Y coordinates:', 
          { originY, destY, cycleEndY, cycleStartY });
        return {
          wrapsAround: false,
          full: {
            x1: originX,
            y1: chartHeight - yScale(originTime) || 0,
            x2: destX,
            y2: chartHeight - yScale(destTime) || 0
          }
        };
      }
      
      return {
        wrapsAround: true,
        part1: {
          x1: originX,
          y1: originY,
          x2: xAtCycleEnd,
          y2: cycleEndY
        },
        part2: {
          x1: xAtCycleEnd,
          y1: cycleStartY,
          x2: destX,
          y2: destY
        }
      };
    } catch (error) {
      console.error('Error in cycle time calculation:', error);
      // Fallback to a straight line if calculation fails
      return {
        wrapsAround: false,
        full: {
          x1: originX,
          y1: chartHeight - yScale(originTime),
          x2: destX,
          y2: chartHeight - yScale(destTime)
        }
      };
    }
  }
  
  // No wrapping needed
  return {
    wrapsAround: false,
    full: {
      x1: originX,
      y1: chartHeight - yScale(originTime),
      x2: destX,
      y2: chartHeight - yScale(destTime)
    }
  };
};
