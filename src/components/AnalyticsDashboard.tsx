import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
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
import { VisitStats } from '@/types/analytics';
import { toast } from 'sonner';

const AnalyticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        // Call the actual RPC function in Supabase
        const { data, error: rpcError } = await supabase.rpc('get_visit_stats');

        if (rpcError) {
          throw new Error(rpcError.message);
        }

        if (data) {
          console.log("Fetched analytics stats:", data);
          setStats(data);
        } else {
          setStats(null);
          toast.error(t('no_analytics_data_available'));
        }
      } catch (err: any) {
        console.error("Error fetching analytics stats:", err);
        setError(err.message || 'An unexpected error occurred while fetching stats.');
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [t]);

  const directionClass = language === 'he' ? 'rtl' : 'ltr';

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
    return <div className="text-red-500 p-4 border border-red-300 rounded">{t('error_loading_analytics')}: {error}</div>;
  }

  if (!stats) {
    return <div className="p-4 text-muted-foreground">{t('no_analytics_data')}</div>;
  }

  return (
    <div className="space-y-6" dir={directionClass}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('page_views_today')}</CardTitle>
            <CardDescription>{t('total_visits_today')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.visitsToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>{t('unique_visitors_today')}</CardTitle>
            <CardDescription>{t('distinct_users_today')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.uniqueVisitorsToday}</div>
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
                <LineChart data={stats.yearlyTrend}>
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
                <AreaChart data={stats.yearlyTrend}>
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
                <BarChart data={stats.yearlyTrend}>
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
