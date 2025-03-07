import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IntersectionInput } from '@/components/IntersectionInput';
import { calculateGreenWave } from '@/lib/calculations';
import { toast } from 'sonner';
import { ArrowRight, Hand, Play, Plus, Settings2 } from 'lucide-react';
import { WeightsPanel } from '@/components/WeightsPanel';
import { FileActions } from '@/components/FileActions';
import { ResultsPanel } from '@/components/ResultsPanel';
import { DEFAULT_WEIGHTS, type Intersection, type OptimizationWeights, type GreenPhase } from '@/types/optimization';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Index = () => {
  const [intersections, setIntersections] = useState<Intersection[]>([{
    id: 1,
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
    }]
  }, {
    id: 2,
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
    }]
  }]);
  const [speed, setSpeed] = useState(50);
  const [results, setResults] = useState<any>(null);
  const [mode, setMode] = useState<'display' | 'calculate' | 'manual'>('calculate');
  const [weights, setWeights] = useState<OptimizationWeights>(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);
  const [manualOffsets, setManualOffsets] = useState<number[]>([0, 0]); // אתחול עם שני אפסים עבור שני הצמתים ההתחלתיים
  const [showManualDialog, setShowManualDialog] = useState(false);

  const handleSpeedChange = (value: string) => {
    const numValue = parseInt(value);
    if (isNaN(numValue) || numValue < 0 || numValue > 120 || !Number.isInteger(numValue)) {
      toast.error("מהירות תכן חייבת להיות מספר שלם בין 0 ל-120 קמ\"ש");
      return;
    }
    setSpeed(numValue);
  };

  const handleAddIntersection = () => {
    const newId = Math.max(...intersections.map(i => i.id)) + 1;
    const lastIntersection = intersections[intersections.length - 1];
    const newDistance = lastIntersection.distance + 200;
    
    const newIntersection: Intersection = {
      id: newId,
      distance: newDistance,
      cycleTime: 90,
      greenPhases: [
        {
          direction: 'upstream' as const,
          startTime: 0,
          duration: 45
        },
        {
          direction: 'downstream' as const,
          startTime: 45,
          duration: 45
        }
      ]
    };
    
    const newIntersections = [...intersections, newIntersection];
    setIntersections(newIntersections);
    
    setManualOffsets(prev => [...prev, 0]);
    
    if (mode === 'display') {
      handleShowExisting();
    } else if (mode === 'calculate') {
      handleCalculate();
    } else if (mode === 'manual') {
      handleManualCalculate();
    }
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

      const calculationResults = await calculateGreenWave(
        intersections, 
        speed, 
        weights,
        currentOffsets
      );
      
      console.log("Manual calculation results received:", calculationResults);
      
      if (!calculationResults.manual_results) {
        throw new Error("No manual results received from calculation");
      }

      setResults(calculationResults);
      setMode('manual');
      setShowManualDialog(false);
      toast.success("חישוב הגל הירוק במצב ידני הושלם בהצלחה");
    } catch (error) {
      console.error("Error in manual calculation:", error);
      toast.error("שגיאה בחישוב הגל הירוק במצב ידני");
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
      toast.success("חישוב הגל הירוק הושלם בהצלחה");
    } catch (error) {
      console.error("Error in calculation:", error);
      toast.error("שגיאה בחישוב הגל הירוק");
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
      }
      
      const currentIntersections = intersections.map(intersection => ({
        ...intersection,
        offset: 0
      }));
      
      const currentResults = await calculateGreenWave(currentIntersections, speed);
      console.log("Show existing results received:", currentResults);
      setResults(currentResults);
      setMode('display');
      toast.success("הצגת הגל הירוק הקיים הושלמה בהצלחה");
    } catch (error) {
      console.error("Error displaying existing green wave:", error);
      toast.error("שגיאה בהצגת הגל הירוק הקיים");
    }
  };

  const updateWeight = (category: keyof OptimizationWeights, value: number) => {
    const updatedWeights = { ...weights };
    updatedWeights[category] = value;
    setWeights(updatedWeights);
  };

  const handleLoadInput = (data: {
    speed: number;
    intersections: Intersection[];
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
    
    setSpeed(data.speed);
    setIntersections(data.intersections);
    setManualOffsets(new Array(data.intersections.length).fill(0));
    toast.success("הקובץ נטען בהצלחה");
    
    if (mode === 'display') {
      handleShowExisting();
    } else if (mode === 'calculate') {
      handleCalculate();
    } else if (mode === 'manual') {
      handleManualCalculate();
    }
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    setResults(null);
    setMode('calculate');
    toast.success("המשקולות אופסו לברירת המחדל");
  };

  console.log("Current results state:", results);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-[1600px] mx-auto space-y-8 animate-fade-up">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">מחשבון גל ירוק</h1>
          <p className="text-lg text-gray-600">כלי לתכנון אופטימלי של תזמוני רמזורים</p>
        </div>

        {/* Always show inputs in a single column */}
        <Card className="p-6 glassmorphism">
          <div className="space-y-6">
            <FileActions speed={speed} intersections={intersections} onLoadInput={handleLoadInput} />

            <div>
              <Label htmlFor="speed">מהירות תכן (קמ"ש)</Label>
              <Input 
                id="speed" 
                type="number" 
                value={speed} 
                min={0}
                max={120}
                onChange={e => handleSpeedChange(e.target.value)} 
                className="w-full" 
              />
            </div>

            <WeightsPanel 
              weights={weights} 
              showWeights={showWeights} 
              onWeightChange={updateWeight} 
              onToggleWeights={() => setShowWeights(!showWeights)} 
              onResetWeights={handleResetWeights} 
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>צמתים</Label>
                <Button variant="outline" size="sm" onClick={handleAddIntersection} className="flex items-center gap-2">
                  <Plus size={16} />
                  הוסף צומת
                </Button>
              </div>
              
              {intersections.map((intersection, index) => (
                <IntersectionInput 
                    key={intersection.id} 
                    intersection={intersection}
                    allIntersections={intersections} 
                    onChange={updated => {
                      const newIntersections = [...intersections];
                      newIntersections[index] = updated;
                      setIntersections(newIntersections);
                      
                      if (mode === 'display') {
                        handleShowExisting();
                      }
                    }} 
                    onDelete={() => {
                      if (intersections.length > 2) {
                        setIntersections(intersections.filter(i => i.id !== intersection.id));
                        setManualOffsets(prev => {
                          const newOffsets = [...prev];
                          newOffsets.splice(index, 1);
                          return newOffsets;
                        });
                        
                        if (mode === 'display') {
                          handleShowExisting();
                        }
                      }
                    }} 
                  />
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={handleShowExisting} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                <Play size={16} />
                צייר גל ירוק קיים
              </Button>

              <Dialog open={showManualDialog} onOpenChange={setShowManualDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white">
                    <Hand size={16} />
                    חישוב ידני
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                      <DialogTitle>הזנת היסטים ידנית</DialogTitle>
                      <DialogDescription>
                        הזן את ערכי ה-offset עבור כל צומת (בשניות).
                        שים לב שה-offset של הצומת הראשון תמיד יהיה 0.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      {intersections.map((intersection, index) => (
                        <div key={intersection.id} className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor={`offset-${index}`} className="text-right">
                            צומת {index + 1}
                          </Label>
                          <Input
                            id={`offset-${index}`}
                            type="number"
                            value={manualOffsets[index] || 0}
                            onChange={(e) => {
                              const newOffsets = [...manualOffsets];
                              newOffsets[index] = Number(e.target.value);
                              setManualOffsets(newOffsets);
                            }}
                            disabled={index === 0}
                            className="col-span-3"
                          />
                        </div>
                      ))}
                    </div>
                    <DialogFooter>
                      <Button onClick={handleManualCalculate}>חשב</Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button onClick={handleCalculate} className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white">
                חשב גל ירוק
                <ArrowRight className="mr-2" size={16} />
              </Button>
            </div>
          </div>
        </Card>

        {/* Results panel will take full width */}
        {results && (
          <ResultsPanel 
            results={results} 
            mode={mode}
            originalIntersections={intersections}
            speed={speed}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
