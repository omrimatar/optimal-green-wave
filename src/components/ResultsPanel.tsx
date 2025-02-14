
import { Card } from "@/components/ui/card";

interface ResultsPanelProps {
  results: any;
  mode: 'display' | 'calculate';
}

export const ResultsPanel = ({ results, mode }: ResultsPanelProps) => {
  if (!results) return null;

  return (
    <Card className="p-6 h-full">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">תוצאות</h2>
        <pre className="bg-gray-50 p-4 rounded overflow-auto">
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>
    </Card>
  );
};
