
export interface YearlyTrendDataPoint {
  visit_date: string;
  daily_visits_count: number;
  daily_unique_visitors_count: number;
}

export interface VisitStats {
  visitsToday: number;
  uniqueVisitorsToday: number;
  yearlyTrend: YearlyTrendDataPoint[];
}

export interface Visit {
  id: string;
  created_at: string;
  visitor_fingerprint: string;
  path: string;
  language?: string;
}
