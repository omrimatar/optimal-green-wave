
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bug } from 'lucide-react';
import { calculateGreenWave } from '@/lib/calculations';
import { toast } from 'sonner';
import { FileActions } from '@/components/FileActions';
import { ResultsPanel } from '@/components/ResultsPanel';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DEFAULT_WEIGHTS,
  type Intersection,
  type OptimizationWeights,
  normalizeWeights,
  resetModifiedFlags,
  modifiedWeights
} from '@/types/optimization';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLatestLambdaDebugData } from '@/lib/traffic/optimization';
import { DebugDialog } from '@/components/DebugDialog';
import { useMaintenanceMode } from '@/contexts/MaintenanceContext';
import { AdminLoginDialog } from '@/components/AdminLoginDialog';
import { Tabs, TabsList, TabsTrigger, TabsContent, ProgramTabsList, ProgramTabsTrigger } from '@/components/ui/tabs';
import { HomeTab } from '@/components/HomeTab';
import { ProgramTab } from '@/components/ProgramTab';
import { Input } from '@/components/ui/input';

const MAX_PROGRAMS = 6;

const Index = () => {
  const { t, language } = useLanguage();
  const [intersections, setIntersections] = useState<Intersection[]>([{
    id: 1,
    name: t('intersection') + ' 1',
    distance: 0,
    cycleTime: 90,
    greenPhases: [{
      direction: 'upstream',
      startTime: 0,
      duration: 45
    }, {
      direction: 'downstream',
      startTime: 45,
      duration: 45
    }],
    upstreamSpeed: 50,
    downstreamSpeed: 50
  }, {
    id: 2,
    name: t('intersection') + ' 2',
    distance: 300,
    cycleTime: 90,
    greenPhases: [{
      direction: 'upstream',
      startTime: 0,
      duration: 45
    }, {
      direction: 'downstream',
      startTime: 45,
      duration: 45
    }],
    upstreamSpeed: 50,
    downstreamSpeed: 50
  }]);
  const [globalCycleTime, setGlobalCycleTime] = useState(90);
  const [speed, setSpeed] = useState(50);
  const [results, setResults] = useState<any>(null);
  const [mode, setMode] = useState<'display' | 'calculate' | 'manual'>('calculate');
  const [weights, setWeights] = useState<OptimizationWeights>(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);
  const [manualOffsets, setManualOffsets] = useState<number[]>([0, 0]);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [currentProgramId, setCurrentProgramId] = useState(1);
  const [calculationPerformed, setCalculationPerformed] = useState(false);
  const [showDebugDialog, setShowDebugDialog] = useState(false);
  const [debugData, setDebugData] = useState<{ request: any; response: any }>({ request: null, response: null });
  const [showAdminDialog, setShowAdminDialog] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const { isAdmin } = useMaintenanceMode();
  const [activeTab, setActiveTab] = useState("home");
  const [programCount, setProgramCount] = useState(1);

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
      toast.error("זמן מחזור חייב להיות מספר שלם בין 0 ל-300 שניות");
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
      name: `${t('intersection')} ${newId}`,
      distance: newDistance,
      cycleTime: globalCycleTime,
      greenPhases: [{
        direction: 'upstream' as const,
        startTime: 0,
        duration: Math.floor(globalCycleTime / 2)
      }, {
        direction: 'downstream' as const,
        startTime: Math.floor(globalCycleTime / 2),
        duration: Math.floor(globalCycleTime / 2)
      }],
      upstreamSpeed: speed,
      downstreamSpeed: speed
    };
    
    const newIntersections = [...intersections, newIntersection];
    setIntersections(newIntersections);
    setManualOffsets(prev => [...prev, 0]);
    clearResults();
  };

  const handleManualDialogOpen = (programId: number) => {
    setCurrentProgramId(programId);
    setShowManualDialog(true);
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

  const handleCalculate = async (programId: number) => {
    try {
      setCurrentProgramId(programId);
      
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

  const handleShowExisting = async (programId: number) => {
    try {
      setCurrentProgramId(programId);
      
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

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleProgramCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= MAX_PROGRAMS) {
      setProgramCount(value);
    }
  };

  const handleIntersectionChange = (index: number, updatedIntersection: Intersection) => {
    const newIntersections = [...intersections];
    newIntersections[index] = updatedIntersection;
    setIntersections(newIntersections);
    setCalculationPerformed(false);
    if (mode === 'display') {
      handleShowExisting(currentProgramId);
    }
  };

  const handleDeleteIntersection = (id: number) => {
    if (intersections.length > 2) {
      setIntersections(intersections.filter(i => i.id !== id));
      const index = intersections.findIndex(i => i.id === id);
      if (index !== -1) {
        setManualOffsets(prev => {
          const newOffsets = [...prev];
          newOffsets.splice(index, 1);
          return newOffsets;
        });
      }
      setCalculationPerformed(false);
      if (mode === 'display') {
        handleShowExisting(currentProgramId);
      }
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-green-50 to-blue-50" dir={language === 'he' ? 'rtl' : 'ltr'}>
      <div className="max-w-[1600px] mx-auto space-y-4 md:space-y-8 animate-fade-up">
        <div className="flex justify-end mb-4">
          <LanguageToggle />
        </div>
        
        <div className="flex flex-col items-center justify-center space-y-2 md:space-y-4">
          <img 
            alt={t('app_title')} 
            src="/lovable-uploads/efa3c3e2-c92f-42c7-8cc6-a4096430a863.png" 
            className="h-16 md:h-24 w-auto object-cover cursor-pointer" 
            onClick={handleHeaderClick}
          />
          <div className="text-center space-y-1 md:space-y-2">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">{t('app_title')}</h1>
            <p className="text-base md:text-lg text-gray-600">{t('app_subtitle')}</p>
          </div>
        </div>

        <Tabs defaultValue="home" value={activeTab} onValueChange={handleTabChange}>
          <Card className="p-3 md:p-6 glassmorphism">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="home">{t('home')}</TabsTrigger>
                <TabsTrigger value="programs">{t('programs')}</TabsTrigger>
              </TabsList>
              
              {activeTab === "programs" && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="programCount">{t('program_count')}</Label>
                  <Input
                    id="programCount"
                    type="number"
                    min={1}
                    max={MAX_PROGRAMS}
                    value={programCount}
                    onChange={handleProgramCountChange}
                    className="w-20"
                  />
                </div>
              )}
            </div>
            
            <HomeTab
              globalCycleTime={globalCycleTime}
              speed={speed}
              weights={weights}
              showWeights={showWeights}
              intersections={intersections}
              onGlobalCycleTimeChange={handleGlobalCycleTimeChange}
              onSpeedChange={handleSpeedChange}
              onToggleWeights={() => setShowWeights(!showWeights)}
              onWeightChange={updateWeight}
              onResetWeights={handleResetWeights}
              onLoadInput={handleLoadInput}
              onIntersectionChange={handleIntersectionChange}
              onAddIntersection={handleAddIntersection}
              onDeleteIntersection={handleDeleteIntersection}
            />
            
            <TabsContent value="programs">
              <Card className="p-4">
                <ProgramTabsList>
                  {Array.from({ length: programCount }).map((_, index) => (
                    <ProgramTabsTrigger key={index + 1} value={`program-${index + 1}`}>
                      {t('program')} {index + 1}
                    </ProgramTabsTrigger>
                  ))}
                </ProgramTabsList>
                
                <Tabs defaultValue="program-1">
                  {Array.from({ length: programCount }).map((_, index) => (
                    <ProgramTab
                      key={index + 1}
                      programId={index + 1}
                      speed={speed}
                      intersections={intersections}
                      weights={weights}
                      showManualDialog={handleManualDialogOpen}
                      onShowExisting={handleShowExisting}
                      onCalculate={handleCalculate}
                      onIntersectionChange={handleIntersectionChange}
                      language={language}
                      t={t}
                    />
                  ))}
                </Tabs>
              </Card>
            </TabsContent>
            
            <div className="flex justify-end mt-4">
              <Button 
                variant="debug" 
                size="sm" 
                onClick={handleShowDebugData} 
                disabled={!calculationPerformed}
                className="flex items-center gap-1"
              >
                <Bug size={14} />
                <span>Debug</span>
              </Button>
            </div>
          </Card>
        </Tabs>

        {results && (
          <ResultsPanel 
            results={results} 
            mode={mode} 
            originalIntersections={intersections} 
            speed={speed} 
            calculationPerformed={calculationPerformed}
          />
        )}
        
        <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
          <DialogContent className="max-w-[95vw] md:max-w-lg" dir={language === 'he' ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle>{t('manual_offsets')}</DialogTitle>
              <DialogDescription>
                {t('offsets_description')}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              {intersections.map((intersection, index) => (
                <div key={intersection.id} className="grid grid-cols-3 md:grid-cols-4 items-center gap-2 md:gap-4">
                  <Label htmlFor={`offset-${index}`} className={language === 'he' ? "text-right text-sm" : "text-left text-sm"}>
                    {intersection.name || `${t('intersection')} ${index + 1}`}
                  </Label>
                  <Input 
                    id={`offset-${index}`} 
                    type="number" 
                    value={manualOffsets[index] || 0} 
                    onChange={e => {
                      const newOffsets = [...manualOffsets];
                      newOffsets[index] = Number(e.target.value);
                      setManualOffsets(newOffsets);
                    }} 
                    disabled={index === 0} 
                    className="col-span-2 md:col-span-3" 
                  />
                </div>
              ))}
            </div>
            <DialogFooter className={language === 'he' ? "" : "flex-row-reverse"}>
              <Button onClick={handleManualCalculate}>{t('calculate')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <DebugDialog 
          open={showDebugDialog} 
          onOpenChange={setShowDebugDialog} 
          requestData={debugData.request} 
          responseData={debugData.response} 
        />
        
        <AdminLoginDialog
          open={showAdminDialog}
          onOpenChange={setShowAdminDialog}
        />
      </div>
    </div>
  );
};

export default Index;
