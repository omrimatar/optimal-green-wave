
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { BarChart } from 'lucide-react';

export const LogsNavLink: React.FC = () => {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link to="/logs" className="flex items-center">
        <BarChart className="h-4 w-4 mr-1" />
        <span>Analytics</span>
      </Link>
    </Button>
  );
};
