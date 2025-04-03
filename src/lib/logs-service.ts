
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface IpVisitLog {
  id: string;
  ip: string;
  user_agent: string;
  source: string;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface LogsSummary {
  total: number;
  byDate: Record<string, number>;
  bySource: Record<string, number>;
  byAction: Record<string, number>;
}

export const logsService = {
  async getLogs(): Promise<IpVisitLog[]> {
    try {
      if (!supabaseUrl || !supabaseKey) {
        console.error('Supabase configuration is missing');
        return [];
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('ip_visits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        console.error('Error fetching logs:', error);
        return [];
      }

      return data as IpVisitLog[];
    } catch (err) {
      console.error('Failed to fetch logs:', err);
      return [];
    }
  },

  async getLogsSummary(): Promise<LogsSummary> {
    const logs = await this.getLogs();
    
    const summary: LogsSummary = {
      total: logs.length,
      byDate: {},
      bySource: {},
      byAction: {}
    };

    logs.forEach(log => {
      // Group by date (YYYY-MM-DD)
      const date = new Date(log.created_at).toISOString().split('T')[0];
      summary.byDate[date] = (summary.byDate[date] || 0) + 1;
      
      // Group by source
      summary.bySource[log.source || 'unknown'] = (summary.bySource[log.source || 'unknown'] || 0) + 1;
      
      // Group by action
      summary.byAction[log.action || 'unknown'] = (summary.byAction[log.action || 'unknown'] || 0) + 1;
    });

    return summary;
  }
};
