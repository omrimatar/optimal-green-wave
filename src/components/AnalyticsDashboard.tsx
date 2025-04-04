
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { VisitStats, YearlyTrendDataPoint, Visit } from '@/types/analytics';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Attempting to fetch analytics from Supabase...');

      // Use direct table access to get visits data
      const { data: visitsData, error: visitsError } = await supabase
        .from('visits')
        .select('*');

      if (visitsError) {
        console.error('Error fetching visits:', visitsError);
        throw new Error(visitsError.message);
      }

      console.log('Raw visits data:', visitsData);

      if (!visitsData || visitsData.length === 0) {
        console.log('No visits data found');
        // Show empty state instead of error
        setStats({
          visitsToday: 0,
          uniqueVisitorsToday: 0,
          yearlyTrend: []
        });
      } else {
        // Process the visits data to calculate stats
        const calculatedStats = processVisitsData(visitsData);
        console.log('Calculated stats:', calculatedStats);
        setStats(calculatedStats);
        
        // Also try the RPC method as a backup if available
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_visit_stats');
          
          if (rpcError) {
            console.warn('RPC fallback error:', rpcError);
          } else if (rpcData) {
            console.log("Fetched RPC stats:", rpcData);
            
            // If RPC data looks valid, use it instead
            if (
              typeof rpcData === 'object' && 
              rpcData !== null &&
              'visitsToday' in rpcData && 
              'uniqueVisitorsToday' in rpcData && 
              'yearlyTrend' in rpcData && 
              Array.isArray(rpcData.yearlyTrend)
            ) {
              // Map the yearly trend data to ensure it conforms to the type
              const mappedTrend: YearlyTrendDataPoint[] = rpcData.yearlyTrend.map((item: any) => ({
                visit_date: String(item.visit_date),
                daily_visits_count: Number(item.daily_visits_count),
                daily_unique_visitors_count: Number(item.daily_unique_visitors_count)
              }));
              
              const visitStats: VisitStats = {
                visitsToday: Number(rpcData.visitsToday),
                uniqueVisitorsToday: Number(rpcData.uniqueVisitorsToday),
                yearlyTrend: mappedTrend
              };
              
              setStats(visitStats);
            }
          }
        } catch (rpcError) {
          console.warn('Error in RPC fallback:', rpcError);
          // Continue with calculated stats
        }
      }
    } catch (err: any) {
      console.error("Error fetching analytics stats:", err);
      setError(err.message || 'An unexpected error occurred while fetching stats.');
      
      // For development, fall back to mock data if fetch fails
      if (process.env.NODE_ENV === 'development') {
        console.log('Generating mock data for development');
        const mockYearlyTrend = generateMockData();
        setStats({
          visitsToday: 12,
          uniqueVisitorsToday: 5,
          yearlyTrend: mockYearlyTrend
        });
      } else {
        setStats(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [t]);

  // Process raw visits data into statistics
  const processVisitsData = (visitsData: Visit[]) => {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Count today's visits
    const todayVisits = visitsData.filter(visit => 
      new Date(visit.created_at).toISOString().split('T')[0] === today
    );
    
    // Count unique visitors today
    const uniqueVisitorsToday = [...new Set(todayVisits.map(visit => visit.visitor_fingerprint))].length;
    
    // Generate trend data for the last 30 days
    const trendMap = new Map<string, { visits: number, uniqueVisitors: Set<string> }>();
    
    // Initialize the last 30 days with empty data
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendMap.set(dateStr, { visits: 0, uniqueVisitors: new Set() });
    }
    
    // Fill in actual data
    visitsData.forEach(visit => {
      const visitDate = new Date(visit.created_at).toISOString().split('T')[0];
      // Only process visits from the last 30 days
      if (trendMap.has(visitDate)) {
        const dayData = trendMap.get(visitDate)!;
        dayData.visits++;
        dayData.uniqueVisitors.add(visit.visitor_fingerprint);
      }
    });
    
    // Convert map to array and sort by date
    const trendArray: YearlyTrendDataPoint[] = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        visit_date: date,
        daily_visits_count: data.visits,
        daily_unique_visitors_count: data.uniqueVisitors.size
      }))
      .sort((a, b) => a.visit_date.localeCompare(b.visit_date));
    
    return {
      visitsToday: todayVisits.length,
      uniqueVisitorsToday: uniqueVisitorsToday,
      yearlyTrend: trendArray
    };
  };

  // Mock data generator for development
  const generateMockData = () => {
    const mockYearlyTrend = [];
    const today = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      mockYearlyTrend.push({
        visit_date: date.toISOString().split('T')[0],
        daily_visits_count: Math.floor(Math.random() * 20) + 5,
        daily_unique_visitors_count: Math.floor(Math.random() * 10) + 1
      });
    }
    return mockYearlyTrend;
  };

  const directionClass = language === 'he' ? 'rtl' : 'ltr';
  
  const handleRefresh = () => {
    fetchStats();
    toast.success(t('analytics_refreshed'));
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-[30px] w-full" />
        <Skeleton className="h-[100px] w-full" />
        <Skeleton className="h-[250px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>{t('error_loading_analytics')}</AlertTitle>
        <AlertDescription>
          {error} 
          <p className="mt-2">
            {t('please_check_supabase_connection')}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={handleRefresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('refresh')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!stats || (!stats.yearlyTrend.length && stats.visitsToday === 0 && stats.uniqueVisitorsToday === 0)) {
    return (
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4 mr-2" />
        <AlertTitle>{t('no_analytics_data')}</AlertTitle>
        <AlertDescription>
          {t('no_analytics_data_available')}
          <p className="mt-2">
            {t('start_browsing_to_see_analytics')}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2" 
            onClick={handleRefresh}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('refresh')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6" dir={directionClass}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('analytics_overview')}</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('refresh')}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('page_views_today')}</CardTitle>
            <CardDescription>{t('total_visits_today')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats?.visitsToday || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('unique_visitors_today')}</CardTitle>
            <CardDescription>{t('distinct_users_today')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats?.uniqueVisitorsToday || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('visitor_trends')}</CardTitle>
          <CardDescription>{t('last_30_days')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="line">
            <TabsList className="mb-4">
              <TabsTrigger value="line">{t('line_chart')}</TabsTrigger>
              <TabsTrigger value="area">{t('area_chart')}</TabsTrigger>
              <TabsTrigger value="bar">{t('bar_chart')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="line" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats?.yearlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="visit_date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="daily_visits_count"
                    name={t('page_views')}
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="daily_unique_visitors_count"
                    name={t('unique_visitors')}
                    stroke="#ef4444"
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="area" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.yearlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="visit_date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="daily_visits_count"
                    name={t('page_views')}
                    stroke="#3b82f6"
                    fill="#3b82f680"
                  />
                  <Area
                    type="monotone"
                    dataKey="daily_unique_visitors_count"
                    name={t('unique_visitors')}
                    stroke="#ef4444"
                    fill="#ef444480"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
            
            <TabsContent value="bar" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.yearlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="visit_date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="daily_visits_count"
                    name={t('page_views')}
                    fill="#3b82f6"
                  />
                  <Bar
                    dataKey="daily_unique_visitors_count"
                    name={t('unique_visitors')}
                    fill="#ef4444"
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;
