
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { IntersectionInput } from '@/components/IntersectionInput';
import { calculateGreenWave } from '@/lib/calculations';
import { toast } from 'sonner';
import { ArrowRight, Play, Plus, Settings2 } from 'lucide-react';
import { WeightsPanel } from '@/components/WeightsPanel';
import { FileActions } from '@/components/FileActions';
import { ResultsPanel } from '@/components/ResultsPanel';
import { DEFAULT_WEIGHTS, type Intersection, type OptimizationWeights } from '@/types/optimization';

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
  const [mode, setMode] = useState<'display' | 'calculate'>('calculate');
  const [weights, setWeights] = useState<OptimizationWeights>(DEFAULT_WEIGHTS);
  const [showWeights, setShowWeights] = useState(false);

  const handleAddIntersection = () => {
    const newId = Math.max(...intersections.map(i => i.id)) + 1;
    const lastIntersection = intersections[intersections.length - 1];
    const newDistance = lastIntersection.distance + 200;
    setIntersections([...intersections, {
      id: newId,
      distance: newDistance,
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
  };

  const handleCalculate = async () => {
    try {
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

  const updateWeight = (category: keyof OptimizationWeights, direction: 'upstream' | 'downstream', value: number) => {
    const newWeights = {
      ...weights
    };
    newWeights[category][direction] = value;
    const total = Object.values(newWeights).reduce((sum, cat) => sum + cat.upstream + cat.downstream, 0);
    if (total !== 100) {
      const scale = (100 - value) / (total - newWeights[category][direction]);
      Object.entries(newWeights).forEach(([key, val]) => {
        if (key !== category || key === category && direction === 'downstream') {
          newWeights[key as keyof OptimizationWeights].upstream *= scale;
          newWeights[key as keyof OptimizationWeights].downstream *= scale;
        }
      });
    }
    setWeights(newWeights);
  };

  const handleLoadInput = (data: {
    speed: number;
    intersections: Intersection[];
  }) => {
    setSpeed(data.speed);
    setIntersections(data.intersections);
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    setResults(null); // מנקה את תוצאות החישוב
    setMode('calculate'); // מחזיר למצב חישוב
    toast.success("המשקולות אופסו לברירת המחדל");
  };

  console.log("Current results state:", results);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-up">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">מחשבון גל ירוק</h1>
          <p className="text-lg text-gray-600">כלי לתכנון אופטימלי של תזמוני רמזורים</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <Card className="p-6 glassmorphism">
            <div className="space-y-6">
              <FileActions speed={speed} intersections={intersections} onLoadInput={handleLoadInput} />

              <div>
                <Label htmlFor="speed">מהירות תכן (קמ"ש)</Label>
                <Input id="speed" type="number" value={speed} onChange={e => setSpeed(Number(e.target.value))} className="w-full" />
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
                    onChange={updated => {
                      const newIntersections = [...intersections];
                      newIntersections[index] = updated;
                      setIntersections(newIntersections);
                    }} 
                    onDelete={() => {
                      if (intersections.length > 2) {
                        setIntersections(intersections.filter(i => i.id !== intersection.id));
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

                <Button onClick={handleCalculate} className="flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white">
                  חשב גל ירוק
                  <ArrowRight className="mr-2" size={16} />
                </Button>
              </div>
            </div>
          </Card>

          {results && <ResultsPanel results={results} mode={mode} />}
        </div>
      </div>
    </div>
  );
};

export default Index;
