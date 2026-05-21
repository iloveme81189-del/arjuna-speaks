import { useState, useEffect, useRef } from 'react';

export interface UXData {
  activeUsers: number;
  avgSessionDuration: number;
  ctr: number;
  conversion: number;
  userSparkline: number[];
  sessionSparkline: number[];
  ctrSparkline: number[];
  conversionSparkline: number[];
  funnel: { stage: string; users: number; dropoff: number }[];
  heatmap: { x: number; y: number; intensity: number }[];
}

export interface UXEvent {
  id: string;
  type: 'click' | 'scroll' | 'convert' | 'error';
  element: string;
  timestamp: Date;
  metadata?: any;
}

export function useRealtimeData() {
  const [data, setData] = useState<<UXData>({
    activeUsers: 1247,
    avgSessionDuration: 4.2,
    ctr: 3.8,
    conversion: 2.1,
    userSparkline: [1000, 1100, 1050, 1200, 1150, 1247],
    sessionSparkline: [3.5, 3.8, 4.0, 3.9, 4.1, 4.2],
    ctrSparkline: [4.2, 4.0, 3.9, 3.7, 3.8, 3.8],
    conversionSparkline: [1.8, 1.9, 2.0, 2.0, 2.1, 2.1],
    funnel: [
      { stage: 'Landing', users: 10000, dropoff: 0 },
      { stage: 'Product', users: 6500, dropoff: 35 },
      { stage: 'Cart', users: 2800, dropoff: 57 },
      { stage: 'Checkout', users: 1200, dropoff: 57 },
      { stage: 'Purchase', users: 420, dropoff: 65 },
    ],
    heatmap: Array.from({ length: 50 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      intensity: Math.random(),
    })),
  });

  const [events, setEvents] = useState<<UXEvent[]>([]);
  const intervalRef = useRef<<ReturnType<<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setData(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 3),
        ctr: +(prev.ctr + (Math.random() * 0.4 - 0.2)).toFixed(2),
      }));

      const types: UXEvent['type'][] = ['click', 'scroll', 'convert', 'error'];
      const elements = ['Hero CTA', 'Nav Menu', 'Product Card', 'Footer', 'Search Bar'];
      
      const newEvent: UXEvent = {
        id: Math.random().toString(36).substr(2, 9),
        type: types[Math.floor(Math.random() * types.length)],
        element: elements[Math.floor(Math.random() * elements.length)],
        timestamp: new Date(),
      };

      setEvents(prev => [newEvent, ...prev].slice(0, 20));
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { data, events };
}
