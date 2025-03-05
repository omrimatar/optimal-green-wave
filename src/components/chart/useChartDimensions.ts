
import { useState, useEffect, RefObject } from 'react';

export function useChartDimensions(chartRef: RefObject<HTMLDivElement>) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  useEffect(() => {
    const handleResize = () => {
      if (chartRef.current) {
        // Use parent width, but fixed height
        const width = chartRef.current.clientWidth;
        setDimensions({
          width,
          height: 500
        });
      }
    };

    // Set initial dimensions
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [chartRef]);

  return dimensions;
}
