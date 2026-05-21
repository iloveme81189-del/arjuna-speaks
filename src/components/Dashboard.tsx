import { useState } from 'react';
import { MetricCard } from './MetricCard';
import { FunnelChart } from './FunnelChart';
import { Heatmap } from './Heatmap';
import { AIChat } from './AIChat';
import { RealTimeStream } from './RealTimeStream';
import { useRealtimeData } from '../hooks/useRealtimeData';
import { TrendingUp, Users, MousePointer, Clock, Zap } from 'lucide-react';

export function Dashboard() {
  const { data, events } = useRealtimeData();
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="text-purple-600" />
              Arjuna UX Intelligence
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              AI-Powered User Experience Analytics
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Users"
            value={data.activeUsers}
            change={+12.5}
            icon={<Users size={20} />}
            sparkline={data.userSparkline}
          />
          <MetricCard
            title="Avg. Session"
            value={`${data.avgSessionDuration}m`}
            change={+5.2}
            icon={<Clock size={20} />}
            sparkline={data.sessionSparkline}
          />
          <MetricCard
            title="Click-through Rate"
            value={`${data.ctr}%`}
            change={-2.1}
            icon={<MousePointer size={20} />}
            sparkline={data.ctrSparkline}
          />
          <MetricCard
            title="Conversion Rate"
            value={`${data.conversion}%`}
            change={+8.4}
            icon={<TrendingUp size={20} />}
            sparkline={data.conversionSparkline}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Conversion Funnel</h3>
              <FunnelChart data={data.funnel} />
            </div>
            
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Click Heatmap</h3>
              <Heatmap data={data.heatmap} />
            </div>
          </div>

          <div className="space-y-6">
            <AIChat currentData={data} />
            <RealTimeStream events={events} />
          </div>
        </div>
      </main>
    </div>
  );
}
