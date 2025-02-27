
import type { RunResult } from "@/types/traffic";

// נתוני מוק לתוצאות בסיסיות
export const mockBaselineResults: RunResult = {
  status: "success",
  offsets: [0, 0],
  objective_value: 45,
  corridor_bandwidth_up: 30,
  corridor_bandwidth_down: 30,
  pair_bandwidth_up: [35],
  pair_bandwidth_down: [35],
  avg_delay_up: [10],
  avg_delay_down: [10],
  max_delay_up: [20],
  max_delay_down: [20],
  diagonal_points: {
    up: [
      { junction: 0, low: 0, top: 45 },
      { junction: 1, low: 22, top: 67 }
    ],
    down: [
      { junction: 0, low: 45, top: 90 },
      { junction: 1, low: 23, top: 68 }
    ]
  }
};

// נתוני מוק לתוצאות אופטימליות
export const mockOptimizedResults: RunResult = {
  status: "success",
  offsets: [0, 22],
  objective_value: 68,
  corridor_bandwidth_up: 40,
  corridor_bandwidth_down: 40,
  pair_bandwidth_up: [42],
  pair_bandwidth_down: [42],
  avg_delay_up: [5],
  avg_delay_down: [5],
  max_delay_up: [12],
  max_delay_down: [12],
  diagonal_points: {
    up: [
      { junction: 0, low: 0, top: 45 },
      { junction: 1, low: 22, top: 67 }
    ],
    down: [
      { junction: 0, low: 45, top: 90 },
      { junction: 1, low: 45, top: 90 }
    ]
  }
};

// נתוני מוק לתוצאות ידניות
export const mockManualResults: RunResult = {
  status: "success",
  offsets: [0, 0], // יעודכן כשיש נתונים ידניים
  objective_value: 45,
  corridor_bandwidth_up: 30,
  corridor_bandwidth_down: 30,
  pair_bandwidth_up: [35],
  pair_bandwidth_down: [35],
  avg_delay_up: [10],
  avg_delay_down: [10],
  max_delay_up: [20],
  max_delay_down: [20],
  diagonal_points: {
    up: [
      { junction: 0, low: 0, top: 45 },
      { junction: 1, low: 0, top: 45 }
    ],
    down: [
      { junction: 0, low: 45, top: 90 },
      { junction: 1, low: 45, top: 90 }
    ]
  }
};
