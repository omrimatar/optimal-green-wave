import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IntersectionInput } from '@/components/IntersectionInput';
import { calculateGreenWave } from '@/lib/calculations';
import { toast } from 'sonner';
import { ArrowRight, Hand, Play, Plus, Bug } from 'lucide-react';
import { WeightsPanel } from '@/components/WeightsPanel';
import { FileActions } from '@/components/FileActions';
import { ResultsPanel } from '@/components/ResultsPanel';
import { useLanguage } from '@/contexts/LanguageContext';
import { DEFAULT_WEIGHTS, type Intersection, type OptimizationWeights, normalizeWeights, resetModifiedFlags, modifiedWeights } from '@/types/optimization';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getLatestLambdaDebugData } from '@/lib/traffic/optimization';
import { DebugDialog } from '@/components/DebugDialog';
import { useMaintenanceMode } from '@/contexts/MaintenanceContext';
import { AdminLoginDialog } from '@/components/AdminLoginDialog';
import { ContactButton } from '@/components/ContactButton';

const Index = () => {
  const {
    t,
    language
  } = useLanguage();

  const [intersections, setIntersections] = useState<Intersection[]>([{
    id: 1,
    distance: 0,
    cycleTime: 100,
    greenPhases: [{
      direction: 'upstream',
      startTime: 0,
      duration: 40
    }, {
      direction: 'downstream',
      startTime: 40,
      duration: 40
    }],
    upstreamSpeed: 50,
    downstreamSpeed: 50
  }, {
    id: 2,
    distance: 300,
    cycleTime: 100,
    greenPhases: [{
      direction: 'upstream',
      startTime: 0,
      duration: 40
    }, {
      direction: 'downstream',
      startTime: 40,
      duration: 40
    }],
    upstreamSpeed: 50,
    downstreamSpeed: 50
  }]);
  const [globalCycleTime, setGlobalCycleTime] = useState(100);
  const [speed, setSpeed] = useState(50);
  const [results, setResults] = useState<any>(null);
  const [mode, setMode] = useState<'display' | 'calculate' | 'manual'>('calculate');
  const [weights, setWeights] = useState<OptimizationWeights>(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);
  const [manualOffsets, setManualOffsets] = useState<number[]>([0, 0]);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [calculationPerformed, setCalculationPerformed] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [debugData, setDebugData] = useState<{
    request: any;
    response: any;
  }>({
    request: null,
    response: null
  });
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const {
    isAdmin
  } = useMaintenanceMode();

  useEffect(() => {
    if (intersections.length > 0) {
      const updatedIntersections = intersections.map(intersection => ({
        ...intersection,
        cycleTime: globalCycleTime
      }));
      setIntersections(updatedIntersections);
    }
  }, [globalCycleTime]);

  const clearResults = () => {
    setResults(null);
    setMode('calculate');
    setCalculationPerformed(false);
  };

  const handleGlobalCycleTimeChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 300 || !Number.isInteger(numValue)) {
      toast.error("זמן מחז��ר חייב להיות מספר שלם בין 0 ל-300 שניות");
      return;
    }
    setGlobalCycleTime(numValue);
    clearResults();
  };

  const handleSpeedChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 120 || !Number.isInteger(numValue)) {
      toast.error("מהירות תכן חייבת להיות מספר שלם בין 0 ל-120 קמ\"ש");
      return;
    }
    setSpeed(numValue);
    const updatedIntersections = intersections.map(intersection => ({
      ...intersection,
      upstreamSpeed: numValue,
      downstreamSpeed: numValue
    }));
    setIntersections(updatedIntersections);
    setCalculationPerformed(false);
  };

  const handleAddIntersection = () => {
    const newId = Math.max(...intersections.map(i => i.id)) + 1;
    const lastIntersection = intersections[intersections.length - 1];
    const newDistance = lastIntersection.distance + 200;
    const newIntersection: Intersection = {
      id: newId,
      distance: newDistance,
      cycleTime: globalCycleTime,
      greenPhases: [{
        direction: 'upstream' as const,
        startTime: 0,
        duration: 40
      }, {
        direction: 'downstream' as const,
        startTime: 40,
        duration: 40
      }],
      upstreamSpeed: speed,
      downstreamSpeed: speed
    };
    const newIntersections = [...intersections, newIntersection];
    setIntersections(newIntersections);
    setManualOffsets(prev => [...prev, 0]);
    clearResults();
  };

  const handleManualCalculate = async () => {
    try {
      const currentOffsets = [...manualOffsets];
      while (currentOffsets.length < intersections.length) {
        currentOffsets.push(0);
      }
      while (currentOffsets.length > intersections.length) {
        currentOffsets.pop();
      }
      currentOffsets[0] = 0;
      const calculationResults = await calculateGreenWave(intersections, speed, weights, currentOffsets);
      console.log("Manual calculation results received:", calculationResults);
      if (!calculationResults.manual_results) {
        throw new Error("No manual results received from calculation");
      }
      setResults(calculationResults);
      setMode('manual');
      setShowManualDialog(false);
      setCalculationPerformed(true);
      toast.success("חישוב הגל הירוק במצב ידני הושלם בהצלחה");
    } catch (error) {
      console.error("Error in manual calculation:", error);
      toast.error("שגיאה בחישוב הגל הירוק במצב ידני");
      setCalculationPerformed(true);
    }
  };

  const handleCalculate = async () => {
    try {
      if (speed < 0 || speed > 120 || !Number.isInteger(speed)) {
        toast.error("מהירות תכן חייבת להיות מספר שלם בין 0 ל-120 קמ\"ש");
        return;
      }
      for (const intersection of intersections) {
        if (intersection.distance < 0 || intersection.distance > 10000 || !Number.isInteger(intersection.distance)) {
          toast.error(`צומת ${intersection.id}: מרחק חייב להיות מספר שלם בין 0 ל-10000 מטר`);
          return;
        }
        if (intersection.cycleTime < 0 || intersection.cycleTime > 300 || !Number.isInteger(intersection.cycleTime)) {
          toast.error(`צומת ${intersection.id}: זמן מחזור חייב להיות מספר שלם בין 0 ל-300 שניות`);
          return;
        }
        if (intersection.upstreamSpeed !== undefined && (intersection.upstreamSpeed < 0 || intersection.upstreamSpeed > 120 || !Number.isInteger(intersection.upstreamSpeed))) {
          toast.error(`צומת ${intersection.id}: מהירות במעלה הזרם חייבת להיות מספר שלם בין 0 ל-120 קמ"ש`);
          return;
        }
        if (intersection.downstreamSpeed !== undefined && (intersection.downstreamSpeed < 0 || intersection.downstreamSpeed > 120 || !Number.isInteger(intersection.downstreamSpeed))) {
          toast.error(`צומת ${intersection.id}: מהירות במורד הזרם חייבת להיות מספר שלם בין 0 ל-120 קמ"ש`);
          return;
        }
        for (const phase of intersection.greenPhases) {
          if (phase.startTime < 0 || phase.startTime > intersection.cycleTime || !Number.isInteger(phase.startTime)) {
            toast.error(`צומת ${intersection.id}: זמן התחלה חייב להיות מספר שלם בין 0 ל-${intersection.cycleTime}`);
            return;
          }
          if (phase.duration < 1 || phase.duration > intersection.cycleTime || !Number.isInteger(phase.duration)) {
            toast.error(`צומת ${intersection.id}: משך חייב להיות מספר שלם בין 1 ל-${intersection.cycleTime}`);
            return;
          }
        }
      }
      const baseIntersections = intersections.map(intersection => ({
        ...intersection,
        offset: 0
      }));
      const calculationResults = await calculateGreenWave(intersections, speed, weights);
      console.log("Calculation results received:", calculationResults);
      setResults(calculationResults);
      setMode('calculate');
      setCalculationPerformed(true);
      toast.success("חישוב הגל הירוק הושלם בהצלחה");
    } catch (error) {
      console.error("Error in calculation:", error);
      toast.error("שגיאה בחישוב הגל הירוק");
      setCalculationPerformed(true);
    }
  };

  const handleShowExisting = async () => {
    try {
      if (speed < 0 || speed > 120 || !Number.isInteger(speed)) {
        toast.error("מהירות תכן חייבת להיות מספר שלם בין 0 ל-120 קמ\"ש");
        return;
      }
      for (const intersection of intersections) {
        if (intersection.distance < 0 || intersection.distance > 10000 || !Number.isInteger(intersection.distance)) {
          toast.error(`צומת ${intersection.id}: מרחק חייב להיות מספר שלם בין 0 ל-10000 מטר`);
          return;
        }
        if (intersection.cycleTime < 0 || intersection.cycleTime > 300 || !Number.isInteger(intersection.cycleTime)) {
          toast.error(`צומת ${intersection.id}: זמן מחזור חייב להיות מספר שלם בין 0 ל-300 שניות`);
          return;
        }
        if (intersection.upstreamSpeed !== undefined && (intersection.upstreamSpeed < 0 || intersection.upstreamSpeed > 120 || !Number.isInteger(intersection.upstreamSpeed))) {
          toast.error(`צומת ${intersection.id}: מהירות במעלה הזרם חייבת להיות מספר שלם בין 0 ל-120 קמ"ש`);
          return;
        }
        if (intersection.downstreamSpeed !== undefined && (intersection.downstreamSpeed < 0 || intersection.downstreamSpeed > 120 || !Number.isInteger(intersection.downstreamSpeed))) {
          toast.error(`צומת ${intersection.id}: מהירות במורד הזרם חייבת להיות מספר שלם בין 0 ל-120 קמ"ש`);
          return;
        }
      }
      const currentIntersections = intersections.map(intersection => ({
        ...intersection,
        offset: 0
      }));
      const currentResults = await calculateGreenWave(currentIntersections, speed);
      console.log("Show existing results received:", currentResults);
      setResults(currentResults);
      setMode('display');
      setCalculationPerformed(true);
      toast.success("הצגת הגל הירוק הקיים הושלמה בהצלחה");
    } catch (error) {
      console.error("Error displaying existing green wave:", error);
      toast.error("שגיאה בהצגת הגל הירוק הקיים");
      setCalculationPerformed(true);
    }
  };

  const updateWeight = (category: keyof OptimizationWeights, value: number) => {
    const updatedWeights = normalizeWeights(weights, category, value);
    setWeights(updatedWeights);
    clearResults();
  };

  const handleLoadInput = (data: {
    speed: number;
    intersections: Intersection[];
    weights?: OptimizationWeights;
  }) => {
    if (data.speed < 0 || data.speed > 120 || !Number.isInteger(data.speed)) {
      toast.error("הקובץ שנטען מכיל מהירות תכן שאינה חוקית. מהירות תכן חייבת להיות מספר שלם בין 0 ל-120 קמ\"ש");
      return;
    }
    for (const intersection of data.intersections) {
      if (intersection.distance < 0 || intersection.distance > 10000 || !Number.isInteger(intersection.distance)) {
        toast.error(`הקובץ שנטען מכיל צומת עם מרחק לא חוקי. מרחק חייב להיות מספר שלם בין 0 ל-10000 מטר`);
        return;
      }
      if (intersection.cycleTime < 0 || intersection.cycleTime > 300 || !Number.isInteger(intersection.cycleTime)) {
        toast.error(`הקובץ שנטען מכיל צומת עם זמן מחזור לא חוקי. זמן מחזור חייב להיות מספר שלם בין 0 ל-300 שניות`);
        return;
      }
      for (const phase of intersection.greenPhases) {
        if (phase.startTime < 0 || phase.startTime > intersection.cycleTime || !Number.isInteger(phase.startTime)) {
          toast.error(`הקובץ שנטען מכיל צומת עם זמן התחלת פאזה לא חוקי. זמן התחלה חייב להיות מספר שלם בין 0 ל-${intersection.cycleTime}`);
          return;
        }
        if (phase.duration < 1 || phase.duration > intersection.cycleTime || !Number.isInteger(phase.duration)) {
          toast.error(`הקובץ שנטען מכיל צומת עם משך פאזה לא חוקי. משך חייב להיות מספר שלם בין 1 ל-${intersection.cycleTime}`);
          return;
        }
      }
    }
    for (const intersection of data.intersections) {
      if (intersection.upstreamSpeed !== undefined && (intersection.upstreamSpeed < 0 || intersection.upstreamSpeed > 120 || !Number.isInteger(intersection.upstreamSpeed))) {
        toast.error(`הקובץ שנטען מכיל צומת עם מהירות במעלה הזרם לא חוקית. מהירות חייבת להיות מספר שלם בין 0 ל-120 קמ"ש`);
        return;
      }
      if (intersection.downstreamSpeed !== undefined && (intersection.downstreamSpeed < 0 || intersection.downstreamSpeed > 120 || !Number.isInteger(intersection.downstreamSpeed))) {
        toast.error(`הקובץ שנטען מכיל צומת עם מהירות במורד הזרם לא חוקית. מהירות חייבת להיות מספר שלם בין 0 ל-120 קמ"ש`);
        return;
      }
    }
    setSpeed(data.speed);
    setIntersections(data.intersections);
    setManualOffsets(new Array(data.intersections.length).fill(0));
    if (data.weights) {
      setWeights(data.weights);
      Object.keys(data.weights).forEach(key => {
        const weightKey = key as keyof OptimizationWeights;
        if (data.weights && data.weights[weightKey] !== DEFAULT_WEIGHTS[weightKey]) {
          modifiedWeights[weightKey] = true;
        }
      });
    }
    if (data.intersections.length > 0) {
      setGlobalCycleTime(data.intersections[0].cycleTime);
    }
    clearResults();
    toast.success("הקובץ נטען בהצלחה");
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    resetModifiedFlags();
    clearResults();
    toast.success("המשקולות אופסו לברירת המחדל");
  };

  const handleShowDebugData = () => {
    const latestData = getLatestLambdaDebugData();
    setDebugData(latestData);
    setShowDebugDialog(true);
  };

  const afterApiCallAttempt = () => {
    setCalculationPerformed(true);
  };

  const handleHeaderClick = () => {
    setClickCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 4) {
        setShowAdminDialog(true);
        return 0;
      }
      setTimeout(() => setClickCount(0), 2000);
      return newCount;
    });
  };

  console.log("Current results state:", results);
  return <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-green-50 to-blue-50" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-8 animate-fade-up">
        <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4">
          <img alt={t('app_title')} src="/lovable-uploads/efa3c3e2-c92f-42c7-8cc6-a4096430a863.png" className="h-16 md:h-24 w-auto object-cover cursor-pointer" onClick={handleHeaderClick} />
          <div className="text-center space-y-1 md:space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">
              {t('app_title')}
              <span className="beta-badge mx-[5px]">{t('beta_version')}</span>
            </h1>
            <p className="text-base md:text-lg text-gray-600">{t('app_subtitle')}</p>
          </div>
        </div>

        <Card className="p-3 md:p-6 glassmorphism">
          <div className="space-y-4 md:space-y-6">
            <FileActions speed={speed} intersections={intersections} weights={weights} onLoadInput={handleLoadInput} />

            <div>
              <Label htmlFor="globalCycleTime">{t('cycle_time')}</Label>
              <Input id="globalCycleTime" type="number" value={globalCycleTime} min={0} max={300} onChange={e => handleGlobalCycleTimeChange(e.target.value)} className="w-full" />
            </div>

            <div>
              <Label htmlFor="speed">{t('default_speed')}</Label>
              <Input id="speed" type="number" value={speed} min={0} max={120} onChange={e => handleSpeedChange(e.target.value)} className="w-full" />
            </div>

            <WeightsPanel weights={weights} showWeights={showWeights} onWeightChange={updateWeight} onToggleWeights={() => setShowWeights(!showWeights)} onResetWeights={handleResetWeights} />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>{t('intersections')}</Label>
                <Button variant="outline" size="sm" onClick={handleAddIntersection} className="flex items-center gap-2">
                  <Plus size={16} />
                  <span className="hidden sm:inline">{t('add_intersection')}</span>
                  <span className="sm:hidden">{t('add')}</span>
                </Button>
              </div>
              
              {intersections.map((intersection, index) => <IntersectionInput key={intersection.id} intersection={intersection} defaultSpeed={speed} allIntersections={intersections} onChange={updated => {
              const newIntersections = [...intersections];
              newIntersections[index] = updated;
              setIntersections(newIntersections);
              setCalculationPerformed(false);
              if (mode === 'display') {
                handleShowExisting();
              }
            }} onDelete={() => {
              if (intersections.length > 2) {
                setIntersections(intersections.filter(i => i.id !== intersection.id));
                setManualOffsets(prev => {
                  const newOffsets = [...prev];
                  newOffsets.splice(index, 1);
                  return newOffsets;
                });
                setCalculationPerformed(false);
                if (mode === 'display') {
                  handleShowExisting();
                }
              }
            }} />)}
            </div>

            <div className="flex flex-wrap gap-2 md:gap-4">
              <Button variant="outline" onClick={handleShowExisting} className="flex items-center gap-1 md:gap-2 bg-orange-500 hover:bg-orange-600 text-white text-xs md:text-sm">
                <Play size={14} className="md:w-4 md:h-4" />
                <span className="hidden sm:inline">{t('draw_existing')}</span>
                <span className="sm:hidden">{t('draw_existing')}</span>
              </Button>

              <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-1 md:gap-2 bg-purple-500 hover:bg-purple-600 text-white text-xs md:text-sm">
                    <Hand size={14} className="md:w-4 md:h-4" />
                    <span className="hidden sm:inline">{t('manual_calculation')}</span>
                    <span className="sm:hidden">{t('manual')}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] md:max-w-lg" dir={language === 'he' ? 'rtl' : 'ltr'}>
                  <DialogHeader>
                    <DialogTitle>{t('manual_offsets')}</DialogTitle>
                    <DialogDescription>
                      {t('offsets_description')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                    {intersections.map((intersection, index) => <div key={intersection.id} className="grid grid-cols-3 md:grid-cols-4 items-center gap-2 md:gap-4">
                        <Label htmlFor={`offset-${index}`} className={language === 'he' ? "text-right text-sm" : "text-left text-sm"}>
                          {t('intersection')} {index + 1}
                        </Label>
                        <Input id={`offset-${index}`} type="number" value={manualOffsets[index] || 0} onChange={e => {
                      const newOffsets = [...manualOffsets];
                      newOffsets[index] = Number(e.target.value);
                      setManualOffsets(newOffsets);
                    }} disabled={index === 0} className="col-span-2 md:col-span-3" />
                      </div>)}
                  </div>
                  <DialogFooter className={language === 'he' ? "" : "flex-row-reverse"}>
                    <Button onClick={handleManualCalculate}>{t('calculate')}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button onClick={handleCalculate} className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-xs md:text-sm">
                <span className="sm:hidden">{t('calculate')}</span>
                <span className="hidden sm:inline">{t('calculate_green_wave')}</span>
                <ArrowRight className={`${language === 'he' ? "mr-2" : "ml-2"} w-3 h-3 md:w-4 md:h-4`} size={16} />
              </Button>
            </div>
            
            <div className="flex justify-end">
              <Button variant="debug" size="sm" onClick={handleShowDebugData} disabled={!calculationPerformed} className="flex items-center gap-1">
                <Bug size={14} />
                <span>Debug</span>
              </Button>
            </div>
          </div>
        </Card>

        {results && <ResultsPanel results={results} mode={mode} originalIntersections={intersections} speed={speed} calculationPerformed={calculationPerformed} />}
        
        <DebugDialog open={showDebugDialog} onOpenChange={setShowDebugDialog} requestData={debugData.request} responseData={debugData.response} />
        
        <AdminLoginDialog open={showAdminDialog} onOpenChange={setShowAdminDialog} />
        
        <ContactButton />
      </div>
    </div>;
};

export default Index;
