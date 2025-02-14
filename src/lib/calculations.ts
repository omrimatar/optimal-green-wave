
import type { Intersection } from "@/types/optimization";

export const calculateGreenWave = (
  intersections: Intersection[],
  speed: number,
  weights?: any
) => {
  // כרגע מחזיר אובייקט ריק - יש להשלים את הלוגיקה
  return {
    cycleTime: intersections[0].cycleTime,
    speed,
    intersections,
    metrics: {
      corridorBandwidth: {
        upstream: 0,
        downstream: 0
      },
      adjacentBandwidths: {
        upstream: [],
        downstream: []
      },
      delays: {
        maximum: 0,
        average: 0
      }
    }
  };
};
