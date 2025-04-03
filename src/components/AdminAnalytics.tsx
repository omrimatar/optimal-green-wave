
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { CalendarDays, Users, BarChart3, List } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks, subYears } from 'date-fns';
import { he } from 'date-fns/locale';

interface LogEntry {
  id: string;
  ip_address: string;
  created_at: string;
  action_type: string;
}

interface LogStats {
  date: string;
  uniqueUsers: number;
  totalClicks: number;
}

export const AdminAnalytics = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'year'>('day');
  const [stats, setStats] = useState<LogStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This would be replaced by an actual API call in a production environment
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        // Simulated data - in a real app, this would be an API call
        const today = new Date();
        const mockLogs: LogEntry[] = [];

        // Generate mock data for the last 14 days
        for (let i = 0; i < 14; i++) {
          const date = subDays(today, i);
          const formattedDate = format(date, 'yyyy-MM-dd');
          
          // Generate between 5-20 logs per day with 3-8 unique IPs
          const uniqueIps = Array.from({ length: Math.floor(Math.random() * 6) + 3 }, 
            () => `192.168.1.${Math.floor(Math.random() * 255)}`);
          
          const dailyLogCount = Math.floor(Math.random() * 16) + 5;
          
          for (let j = 0; j < dailyLogCount; j++) {
            mockLogs.push({
              id: `log-${formattedDate}-${j}`,
              ip_address: uniqueIps[Math.floor(Math.random() * uniqueIps.length)],
              created_at: `${formattedDate}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
              action_type: ['display', 'calculate', 'manual'][Math.floor(Math.random() * 3)]
            });
          }
        }

        setLogs(mockLogs);
        processLogs(mockLogs, timeRange);
      } catch (error) {
        console.error('Error fetching logs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    processLogs(logs, timeRange);
  }, [timeRange, logs]);

  const processLogs = (logs: LogEntry[], range: 'day' | 'week' | 'year') => {
    if (!logs.length) return;

    const today = new Date();
    let dateFormat = 'yyyy-MM-dd';
    let interval: Date[];
    
    // Define the interval based on the selected time range
    switch (range) {
      case 'day':
        interval = Array.from({ length: 24 }, (_, i) => {
          const date = new Date(today);
          date.setHours(i, 0, 0, 0);
          return date;
        });
        dateFormat = 'HH:00';
        break;
      case 'week':
        const startDay = startOfWeek(today, { weekStartsOn: 0 });
        const endDay = endOfWeek(today, { weekStartsOn: 0 });
        interval = eachDayOfInterval({ start: startDay, end: endDay });
        dateFormat = 'EEE';
        break;
      case 'year':
        interval = Array.from({ length: 12 }, (_, i) => {
          const date = new Date(today.getFullYear(), i, 1);
          return date;
        });
        dateFormat = 'MMM';
        break;
      default:
        interval = eachDayOfInterval({ start: subDays(today, 6), end: today });
    }

    // Initialize stats with dates from the interval
    const formattedStats: LogStats[] = interval.map(date => {
      return {
        date: format(date, dateFormat, { locale: he }),
        uniqueUsers: 0,
        totalClicks: 0
      };
    });

    // Process logs to count unique users and total clicks
    logs.forEach(log => {
      const logDate = new Date(log.created_at);
      let index: number;
      
      switch (range) {
        case 'day':
          index = logDate.getHours();
          break;
        case 'week':
          index = logDate.getDay();
          break;
        case 'year':
          index = logDate.getMonth();
          break;
        default:
          // For any other case, we'll default to day view
          index = logDate.getHours();
      }

      if (formattedStats[index]) {
        formattedStats[index].totalClicks++;
        
        // We'll count unique IPs as unique users
        const uniqueIps = new Set(
          logs
            .filter(l => {
              const lDate = new Date(l.created_at);
              if (range === 'day') return lDate.getHours() === index;
              if (range === 'week') return lDate.getDay() === index;
              if (range === 'year') return lDate.getMonth() === index;
              return false;
            })
            .map(l => l.ip_address)
        );
        formattedStats[index].uniqueUsers = uniqueIps.size;
      }
    });

    setStats(formattedStats);
  };

  const getTimeRangeTitle = () => {
    switch (timeRange) {
      case 'day':
        return 'היום';
      case 'week':
        return 'השבוע';
      case 'year':
        return 'השנה';
      default:
        return 'היום';
    }
  };

  return (
    <div className="p-4 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">דשבורד אנליטיקה</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="mr-2 h-4 w-4" />
              משתמשים ייחודיים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(logs.map(log => log.ip_address)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              סה"כ משתמשים ייחודיים
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              סה"כ פעולות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length}
            </div>
            <p className="text-xs text-muted-foreground">
              כל הפעולות שבוצעו במערכת
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <CalendarDays className="mr-2 h-4 w-4" />
              תאריך אחרון
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length > 0 
                ? format(new Date(logs.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )[0].created_at), 'dd/MM/yyyy')
                : 'אין נתונים'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              תאריך הפעולה האחרונה
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>סטטיסטיקות {getTimeRangeTitle()}</span>
            <div className="flex">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="day" onClick={() => setTimeRange('day')} className={timeRange === 'day' ? 'bg-primary text-white' : ''}>יום</TabsTrigger>
                <TabsTrigger value="week" onClick={() => setTimeRange('week')} className={timeRange === 'week' ? 'bg-primary text-white' : ''}>שבוע</TabsTrigger>
                <TabsTrigger value="year" onClick={() => setTimeRange('year')} className={timeRange === 'year' ? 'bg-primary text-white' : ''}>שנה</TabsTrigger>
              </TabsList>
            </div>
          </CardTitle>
          <CardDescription>
            נתוני משתמשים ייחודיים ופעולות במערכת
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[300px] w-full p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <p>טוען נתונים...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    content={(props) => {
                      if (!props.active || !props.payload) return null;
                      const data = props.payload[0]?.payload as LogStats;
                      return (
                        <div className="bg-white p-2 border rounded shadow-md">
                          <p className="font-bold">{data.date}</p>
                          <p>משתמשים ייחודיים: {data.uniqueUsers}</p>
                          <p>סה"כ פעולות: {data.totalClicks}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="uniqueUsers" name="משתמשים ייחודיים" fill="#4ADE80" />
                  <Bar dataKey="totalClicks" name="סה"כ פעולות" fill="#60A5FA" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <List className="mr-2 h-5 w-5" />
            פעולות אחרונות
          </CardTitle>
          <CardDescription>
            רשימת 10 הפעולות האחרונות במערכת
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>כתובת IP</TableHead>
                  <TableHead>סוג פעולה</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 10)
                  .map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{log.ip_address}</TableCell>
                      <TableCell>
                        {log.action_type === 'display' && 'הצגת נתונים'}
                        {log.action_type === 'calculate' && 'חישוב'}
                        {log.action_type === 'manual' && 'הגדרה ידנית'}
                      </TableCell>
                    </TableRow>
                  ))}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-4">
                      אין נתונים להצגה
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
