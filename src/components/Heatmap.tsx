interface HeatPoint {
  x: number;
  y: number;
  intensity: number;
}

interface HeatmapProps {
  data: HeatPoint[];
}

export function Heatmap(props: HeatmapProps) {
  const { data } = props;
  return (
    <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden">
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
        <div className="w-3/4 h-8 bg-gray-400 rounded mb-4" />
        <div className="w-1/2 h-4 bg-gray-400 rounded mb-2" />
        <div className="grid grid-cols-3 gap-2 w-3/4">
          <div className="h-20 bg-gray-400 rounded" />
          <div className="h-20 bg-gray-400 rounded" />
          <div className="h-20 bg-gray-400 rounded" />
        </div>
      </div>
      
      {data.map((point, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
            width: `${12 + point.intensity * 20}px`,
            height: `${12 + point.intensity * 20}px`,
            backgroundColor: `rgba(139, 92, 246, ${0.3 + point.intensity * 0.7})`,
            transform: 'translate(-50%, -50%)',
            filter: 'blur(4px)',
          }}
        />
      ))}
    </div>
  );
}
