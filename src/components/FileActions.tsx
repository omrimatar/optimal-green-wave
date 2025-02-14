
import type { Intersection } from "@/types/optimization";

interface FileActionsProps {
  speed: number;
  intersections: Intersection[];
  onLoadInput: (data: { speed: number; intersections: Intersection[] }) => void;
}

export const FileActions = ({ speed, intersections, onLoadInput }: FileActionsProps) => {
  return null; // כרגע ריק - יש להשלים את הלוגיקה
};
