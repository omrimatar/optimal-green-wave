
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Visit } from '@/types/analytics';
import { useLanguage } from '@/contexts/LanguageContext';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const VisitsTable: React.FC = () => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { t, language } = useLanguage();

  // Define fallback translations for missing keys
  const fallbackTranslations: Record<string, Record<string, string>> = {
    en: {
      raw_visit_data: "Raw Visit Data",
      view_raw_data: "View raw data from all visits",
      refresh: "Refresh",
      time: "Time",
      path: "Page Path",
      visitor: "Visitor ID",
      language_label: "Language",
      no_visits_found: "No visits found",
      visits_refreshed: "Visits data refreshed",
      loading_visits: "Loading visits data...",
      error_loading_visits: "Error loading visits",
    },
    he: {
      raw_visit_data: "נתוני ביקור גולמיים",
      view_raw_data: "צפה בנתונים גולמיים מכל הביקורים",
      refresh: "רענן",
      time: "זמן",
      path: "נתיב דף",
      visitor: "מזהה מבקר",
      language_label: "שפה",
      no_visits_found: "לא נמצאו ביקורים",
      visits_refreshed: "נתוני ביקורים רועננו",
      loading_visits: "טוען נתוני ביקורים...",
      error_loading_visits: "שגיאה בטעינת ביקורים",
    }
  };

  // Enhanced translation function with fallback
  const translate = (key: string): string => {
    // Try to use the regular translation function first
    const regularTranslation = t(key);
    
    // If the returned value is the same as the key, it means translation is missing
    if (regularTranslation === key && fallbackTranslations[language] && fallbackTranslations[language][key]) {
      return fallbackTranslations[language][key];
    }
    
    return regularTranslation;
  };

  const fetchVisits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching raw visits data...');
      
      const { data, error } = await supabase
        .from('visits')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
        
      if (error) {
        throw new Error(error.message);
      }
      
      console.log(`Fetched ${data.length} visits`);
      setVisits(data || []);
    } catch (err: any) {
      console.error('Error fetching visits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  const handleRefresh = () => {
    fetchVisits();
    toast.success(translate('visits_refreshed'));
  };

  // Format date to user-friendly format
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    } catch (e) {
      return dateString;
    }
  };

  // Format visitor ID for display
  const formatVisitorId = (id: string) => {
    return id ? id.substring(0, 8) + '...' : 'Unknown';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{translate('raw_visit_data')}</CardTitle>
            <CardDescription>{translate('view_raw_data')}</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {translate('refresh')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <div className="text-red-500 py-4 text-center">
            <p>{translate('error_loading_visits')}: {error}</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate('time')}</TableHead>
                  <TableHead>{translate('path')}</TableHead>
                  <TableHead>{translate('visitor')}</TableHead>
                  <TableHead>{translate('language_label')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      {translate('no_visits_found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  visits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(visit.created_at)}
                      </TableCell>
                      <TableCell>
                        {visit.path}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatVisitorId(visit.visitor_fingerprint)}
                      </TableCell>
                      <TableCell>
                        {visit.language || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VisitsTable;
