
import { Card } from "@/components/ui/card";

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export const GreenWaveTooltip = ({ active, payload }: TooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <Card className="p-3 bg-white shadow-md border border-gray-200">
      <div className="text-sm font-medium">{data.name}</div>
      <div className="text-xs text-gray-600">מרחק: {data.distance} מטרים</div>
      {data.offset !== undefined && (
        <div className="text-xs text-gray-600">היסט: {data.offset} שניות</div>
      )}
      {data.greenPhases && (
        <div className="mt-1 space-y-1">
          {data.greenPhases.map((phase: any, idx: number) => (
            <div key={idx} className="text-xs flex items-center">
              <div 
                className="w-3 h-3 mr-1 rounded-full" 
                style={{ 
                  backgroundColor: phase.direction === 'upstream' ? '#22c55e' : '#3b82f6',
                  opacity: 0.7
                }}
              />
              <span>
                {phase.direction === 'upstream' ? 'מעלה הזרם' : 'מורד הזרם'}: {phase.startTime}s - {(phase.startTime + phase.duration) % (data.cycleTime || 90)}s
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
