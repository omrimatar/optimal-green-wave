import React, { useState, useEffect } from 'react';
import { GreenPhaseBar } from '@/components/GreenPhaseBar';
import { calculateTimeline } from '@/lib/timeline';
import { trackVisit } from '@/lib/tracking';
import { DebugDialog } from '@/components/DebugDialog';
import { callLambdaOptimization, getLatestDebugData } from '@/lib/traffic/lambda-client';
import {
  DEFAULT_CYCLE_TIME,
  DEFAULT_END_TIME,
  DEFAULT_PHASES,
  DEFAULT_START_TIME,
  DEFAULT_UPSTREAM_PROBABILITY,
} from '@/lib/traffic/defaults';
import {
  Slider,
  SliderTrack,
  SliderThumb,
  SliderValue,
} from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { LogsNavLink } from '@/components/LogsNavLink';

const Index: React.FC = () => {
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [cycleTime, setCycleTime] = useState(DEFAULT_CYCLE_TIME);
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [upstreamProbability, setUpstreamProbability] = useState(DEFAULT_UPSTREAM_PROBABILITY);
  const [timeline, setTimeline] = useState(calculateTimeline(phases, cycleTime, startTime, endTime, upstreamProbability));
  const [hoveredPhase, setHoveredPhase] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [debugDialogOpen, setDebugDialogOpen] = useState(false);
  const [useHalfCycles, setUseHalfCycles] = useState(false);

  useEffect(() => {
    // Call the tracking function on component mount
    trackVisit();
  }, []);

  useEffect(() => {
    setTimeline(calculateTimeline(phases, cycleTime, startTime, endTime, upstreamProbability, useHalfCycles));
  }, [phases, cycleTime, startTime, endTime, upstreamProbability, useHalfCycles]);

  const handlePhaseChange = (index: number, newPhase: any) => {
    const newPhases = [...phases];
    newPhases[index] = newPhase;
    setPhases(newPhases);
  };

  const addPhase = () => {
    setPhases([...phases, { direction: 'upstream', duration: 30 }]);
  };

  const removePhase = (index: number) => {
    const newPhases = phases.filter((_, i) => i !== index);
    setPhases(newPhases);
  };

  const handleOptimizeClick = async () => {
    setIsOptimizing(true);
    try {
      const requestData = {
        phases,
        cycleTime,
        startTime,
        endTime,
        upstreamProbability,
        useHalfCycles
      };
      await callLambdaOptimization(requestData);
      setTimeline(calculateTimeline(phases, cycleTime, startTime, endTime, upstreamProbability, useHalfCycles));
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const { request: debugRequest, response: debugResponse } = getLatestDebugData();

  return (
    <div className="container mx-auto p-4">

      <DebugDialog
        open={debugDialogOpen}
        onOpenChange={setDebugDialogOpen}
        requestData={debugRequest}
        responseData={debugResponse}
      />

      <div className="flex items-center justify-between mb-6">
        <h1>Green Wave App</h1>
        <div className="flex gap-2">
          <LogsNavLink />
          <button onClick={() => setDebugDialogOpen(true)} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            View Debug Data
          </button>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Adjust the simulation parameters</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="cycle-time">Cycle Time (seconds)</Label>
              <Input
                type="number"
                id="cycle-time"
                value={cycleTime}
                onChange={(e) => setCycleTime(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                type="number"
                id="start-time"
                value={startTime}
                onChange={(e) => setStartTime(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                type="number"
                id="end-time"
                value={endTime}
                onChange={(e) => setEndTime(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="upstream-probability">Upstream Probability</Label>
            <Slider
              defaultValue={[upstreamProbability]}
              max={100}
              step={1}
              onValueChange={(value: SliderValue<number>) => setUpstreamProbability(value[0])}
            />
            <p className="text-sm text-muted-foreground">
              {upstreamProbability}% chance of upstream direction.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="use-half-cycles" checked={useHalfCycles} onCheckedChange={setUseHalfCycles} />
            <Label htmlFor="use-half-cycles">Use Half Cycles</Label>
          </div>
        </CardContent>
        <CardFooter>
          <button
            onClick={handleOptimizeClick}
            disabled={isOptimizing}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isOptimizing ? "Optimizing..." : "Optimize"}
          </button>
        </CardFooter>
      </Card>

      <h2 className="text-xl font-bold mb-2">Phases</h2>
      {phases.map((phase, index) => (
        <div key={index} className="mb-4 p-4 border rounded shadow-sm">
          <h3 className="text-lg font-semibold">Phase {index + 1}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`direction-${index}`}>Direction</Label>
              <select
                id={`direction-${index}`}
                className="w-full p-2 border rounded"
                value={phase.direction}
                onChange={(e) => handlePhaseChange(index, { ...phase, direction: e.target.value })}
              >
                <option value="upstream">Upstream</option>
                <option value="downstream">Downstream</option>
              </select>
            </div>
            <div>
              <Label htmlFor={`duration-${index}`}>Duration (seconds)</Label>
              <Input
                type="number"
                id={`duration-${index}`}
                value={phase.duration}
                onChange={(e) => handlePhaseChange(index, { ...phase, duration: Number(e.target.value) })}
              />
            </div>
          </div>
          <button
            onClick={() => removePhase(index)}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Remove Phase
          </button>
        </div>
      ))}
      <button
        onClick={addPhase}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Add Phase
      </button>

      <h2 className="text-xl font-bold mb-2">Timeline</h2>
      <svg width="100%" height="200">
        {timeline.map((phase, index) => (
          <GreenPhaseBar
            key={index}
            x={phase.x}
            startTime={phase.startTime}
            endTime={phase.endTime}
            cycleTime={cycleTime}
            direction={phase.direction}
            barWidth={20}
            yScale={(value: number) => (value / cycleTime) * 100}
            chartHeight={100}
            onMouseEnter={(e: React.MouseEvent, additionalInfo: any) => {
              setHoveredPhase(additionalInfo);
            }}
            onMouseLeave={() => setHoveredPhase(null)}
            isHalfCycle={phase.isHalfCycle}
            phaseNumber={index + 1}
          />
        ))}
      </svg>

      {hoveredPhase && (
        <div className="mt-4 p-4 border rounded shadow-sm">
          <h3 className="text-lg font-semibold">Phase Details</h3>
          <p>Start Time: {hoveredPhase.startTime}</p>
          <p>End Time: {hoveredPhase.endTime}</p>
          <p>Duration: {hoveredPhase.duration}</p>
          <p>Direction: {hoveredPhase.direction}</p>
          <p>Is Half Cycle: {hoveredPhase.isHalfCycle ? 'Yes' : 'No'}</p>
          <p>Height: {hoveredPhase.height}</p>
          <p>Y1: {hoveredPhase.y1}</p>
          <p>Y2: {hoveredPhase.y2}</p>
          <p>Phase Number: {hoveredPhase.phaseNumber}</p>
        </div>
      )}
    </div>
  );
};

export default Index;
