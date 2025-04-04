
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

// Helper function to handle diagonal lines that cross cycle time boundaries
export const handleCycleTimeCrossing = (
  originX: number, 
  destX: number, 
  originTime: number, 
  destTime: number, 
  cycleTime: number, 
  yScale: (value: number) => number, 
  chartHeight: number,
  chartWidth: number,
  leftPadding: number,
  rightPadding: number
) => {
  // Constrain X coordinates to chart boundaries
  const minX = leftPadding;
  const maxX = chartWidth - rightPadding;
  
  const boundedOriginX = Math.max(minX, Math.min(maxX, originX));
  const boundedDestX = Math.max(minX, Math.min(maxX, destX));
  
  // If points are outside bounds and on same side, don't render
  if ((originX < minX && destX < minX) || (originX > maxX && destX > maxX)) {
    return { wrapsAround: false, outOfBounds: true };
  }
  
  if (destTime < originTime) {
    // Calculate time and position parameters
    const totalTimeDiff = cycleTime - originTime + destTime;
    const timeToCycleEnd = cycleTime - originTime;
    const proportionToCycleEnd = timeToCycleEnd / totalTimeDiff;
    
    const distanceToTravel = Math.abs(destX - originX);
    const distanceToCycleEnd = distanceToTravel * proportionToCycleEnd;
    
    // Calculate X position at cycle boundary
    const xDirection = destX > originX ? 1 : -1;
    const xAtCycleEnd = originX + (xDirection * distanceToCycleEnd);
    
    // Check if xAtCycleEnd is within chart bounds
    const boundedXAtCycleEnd = Math.max(minX, Math.min(maxX, xAtCycleEnd));
    
    // Calculate Y positions
    const originY = chartHeight - yScale(originTime);
    const destY = chartHeight - yScale(destTime);
    const cycleEndY = chartHeight - yScale(cycleTime);
    const cycleStartY = chartHeight - yScale(0);
    
    // Check if either part is completely out of bounds
    const part1OutOfBounds = (boundedOriginX === minX && boundedXAtCycleEnd === minX) || 
                            (boundedOriginX === maxX && boundedXAtCycleEnd === maxX);
                            
    const part2OutOfBounds = (boundedXAtCycleEnd === minX && boundedDestX === minX) || 
                            (boundedXAtCycleEnd === maxX && boundedDestX === maxX);
    
    if (part1OutOfBounds && part2OutOfBounds) {
      return { wrapsAround: false, outOfBounds: true };
    }
    
    return {
      wrapsAround: true,
      outOfBounds: false,
      part1: {
        x1: boundedOriginX,
        y1: originY,
        x2: boundedXAtCycleEnd,
        y2: cycleEndY,
        isClipped: boundedOriginX !== originX || boundedXAtCycleEnd !== xAtCycleEnd || part1OutOfBounds
      },
      part2: {
        x1: boundedXAtCycleEnd,
        y1: cycleStartY,
        x2: boundedDestX,
        y2: destY,
        isClipped: boundedXAtCycleEnd !== xAtCycleEnd || boundedDestX !== destX || part2OutOfBounds
      }
    };
  }
  
  // Check if line is completely out of bounds
  if ((boundedOriginX === minX && boundedDestX === minX) || 
      (boundedOriginX === maxX && boundedDestX === maxX)) {
    return { wrapsAround: false, outOfBounds: true };
  }
  
  // No wrapping needed, just constrain to bounds
  return {
    wrapsAround: false,
    outOfBounds: false,
    full: {
      x1: boundedOriginX,
      y1: chartHeight - yScale(originTime),
      x2: boundedDestX,
      y2: chartHeight - yScale(destTime),
      isClipped: boundedOriginX !== originX || boundedDestX !== destX
    }
  };
};
