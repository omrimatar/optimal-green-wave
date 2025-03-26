
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Intersection } from '@/types/optimization';

interface IntersectionBaseInputProps {
  intersection: Intersection;
  defaultSpeed: number;
  onChange: (updatedIntersection: Intersection) => void;
  onDelete: () => void;
}

export const IntersectionBaseInput: React.FC<IntersectionBaseInputProps> = ({
  intersection,
  defaultSpeed,
  onChange,
  onDelete
}) => {
  const { t } = useLanguage();

  const handleChange = (field: keyof Intersection, value: number | string) => {
    if (field === 'name') {
      onChange({
        ...intersection,
        name: value as string
      });
    } else {
      const numValue = parseInt(value as string);
      if (isNaN(numValue)) return;

      const updatedIntersection = { ...intersection } as any;
      updatedIntersection[field] = numValue;
      onChange(updatedIntersection);
    }
  };

  return (
    <Card className="p-4 border-2 border-blue-100">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor={`intersection-name-${intersection.id}`}>{t('intersection_name')}</Label>
          <Input
            id={`intersection-name-${intersection.id}`}
            value={intersection.name || `${t('intersection')} ${intersection.id}`}
            onChange={e => handleChange('name', e.target.value)}
            className="w-full"
          />
        </div>

        <div>
          <Label htmlFor={`intersection-distance-${intersection.id}`}>{t('distance')}</Label>
          <Input
            id={`intersection-distance-${intersection.id}`}
            type="number"
            value={intersection.distance}
            onChange={e => handleChange('distance', e.target.value)}
            min={0}
            max={10000}
            className="w-full"
          />
        </div>

        <div>
          <Label htmlFor={`intersection-upstream-speed-${intersection.id}`}>{t('upstream_speed')}</Label>
          <Input
            id={`intersection-upstream-speed-${intersection.id}`}
            type="number"
            value={intersection.upstreamSpeed || defaultSpeed}
            onChange={e => handleChange('upstreamSpeed', e.target.value)}
            min={0}
            max={120}
            className="w-full"
          />
        </div>

        <div>
          <Label htmlFor={`intersection-downstream-speed-${intersection.id}`}>{t('downstream_speed')}</Label>
          <Input
            id={`intersection-downstream-speed-${intersection.id}`}
            type="number"
            value={intersection.downstreamSpeed || defaultSpeed}
            onChange={e => handleChange('downstreamSpeed', e.target.value)}
            min={0}
            max={120}
            className="w-full"
          />
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex items-center gap-2"
            disabled={false}
          >
            <Trash size={16} />
            <span>{t('delete')}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
};
