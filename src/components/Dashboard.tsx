import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, TrendingUp, Users, DollarSign, Activity,
  Target, Clock, Star, Database, Sparkles, Sun, Moon,
  RefreshCw, BarChart3, PieChart, Globe, Share2, Check,
} from 'lucide-react';
import { AIChat } from './AIChat';
import { DynamicChart } from './DynamicChart';import { DashboardConfig, UploadedData } from '../types/dashboard';

const ICON_MAP: Record<string, React.ReactNode> = {
  'trending-up': <TrendingUp size={18} />,
  'users': <Users size={18} />,
  'dollar-sign': <DollarSign size={18} />,
  'activity': <Activity size={18} />,
  'bar-chart': <BarChart3 size={18} />,
  'pie-chart': <PieChart size={18} />,
  'target': <Target size={18} />,
  'clock': <Clock size={18} />,
  'star': <Star size={18} />,
  'database': <Database size={18} />,
};

const COLOR_SCHEMES: Record<string, {
  bg: string; text: string; border: string; iconBg: string;
  gradient: string; chip: string;
}> = {
  corporate: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    gradient: 'from-blue-600 to-indigo-600',
    chip: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
  },
  accessible: {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-800/50',
    iconBg: 'bg-slate-100 dark:bg-slate-900/40',
    gradient: 'from-slate-600 to-blue-600',
    chip: 'bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/50',
  },
  modern: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800/50',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    gradient: 'from-indigo-600 to-blue-600',
    chip: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700/50',
  },
  semantic: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    gradient: 'from-emerald-600 to-teal-600',
    chip: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50',
  },
  pastels: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800/50',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    gradient: 'from-rose-500 to-pink-500',
    chip: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700/50',
  },
  chronological: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800/50',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    gradient: 'from-blue-600 to-indigo-800',
    chip: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700/50',
  },
  vintage: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    gradient: 'from-amber-600 to-emerald-700',
    chip: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/50',
  },
  heatmap: {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-800/50',
    iconBg: 'bg-slate-100 dark:bg-slate-900/40',
    gradient: 'from-slate-600 to-slate-800',
    chip: 'bg-slate-100 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/50',
  },
  glow: {
    bg: 'bg-sky-50 dark:bg-sky-950/30',
    text: 'text-sky-600 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-800/50',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    gradient: 'from-sky-600 to-indigo-600',
    chip: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/50',
  },
  geographic: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/50',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    gradient: 'from-orange-500 to-red-600',
    chip: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700/50',
  },
};

function computeMetricValue(expression: string, rows: Record<string, string | number>[]): number {
  const parts = expression.split(':');
  if (parts.length < 2) return 0;
  const [, operation, column] = parts;

  switch (operation) {
    case 'sum':
      return rows.reduce((sum, row) => sum + (Number(row[column]) || 0), 0);
    case 'avg': {
      const vals = rows.map((row) => Number(row[column]) || 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    case 'count':
      return rows.length;
    case 'min':
      return Math.min(...rows.map((row) => Number(row[column]) || 0));
    case 'max':
      return Math.max(...rows.map((row) => Number(row[column]) || 0));
    default:
      return 0;
  }
}

function formatValue(value: number, suffix?: string): string {
  if (suffix === '%') return value.toFixed(1) + '%';
  if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
  if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

const DASHBOARD_STORAGE_KEY = 'arjuna_dashboard';

export function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const colors = dashboardConfig
    ? COLOR_SCHEMES[dashboardConfig.colorScheme] || COLOR_SCHEMES.corporate
    : COLOR_SCHEMES.corporate;

  // Save dashboard to localStorage for sharing
  const saveDashboardToStorage = (config: DashboardConfig, data: UploadedData) => {
    try {
      localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify({ config, data, timestamp: Date.now() }));
    } catch { /* storage full or unavailable */ }
  };

  // Load dashboard from URL or localStorage on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const dashboardParam = params.get('dashboard');
    
    if (dashboardParam) {
      try {
        const stored = localStorage.getItem(DASHBOARD_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.config && parsed.data) {
            setDashboardConfig(parsed.config);
            setUploadedData(parsed.data);
            return;
          }
        }
      } catch { /* invalid stored data */ }
    }
  }, []);

  const handleDashboardGenerated = (config: DashboardConfig, data: UploadedData) => {
    setDashboardConfig(config);
    setUploadedData(data);
    const url = `${window.location.origin}?dashboard=${encodeURIComponent(config.title)}`;
    setShareUrl(url);
    saveDashboardToStorage(config, data);
  };

  const metricCards = useMemo(() => {
    if (!dashboardConfig || !uploadedData) return [];
    return dashboardConfig.metrics.map((metric) => {
      let value: number | string = metric.value;
      if (typeof metric.value === 'string' && metric.value.startsWith('EXPRESSION:')) {
        value = computeMetricValue(metric.value, uploadedData.rows);
      }
      return { ...metric, computedValue: value };
    });
  }, [dashboardConfig, uploadedData]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-950' : 'bg-gray-50'}`}>
      {/* Glass Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <Zap size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                Arjuna Speaks
              </h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">
                AI-Powered Data Intelligence
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {dashboardConfig && (
              <>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all font-medium"
                >
                  <Share2 size={14} />
                  Share
                </button>
                <button
                  onClick={() => setDashboardConfig(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                >
                  <RefreshCw size={14} />
                  New
                </button>
              </>
            )}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      <main className="max-w-7xl mx-auto p-6">
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-[420px_1fr]">
          {/* Chat Sidebar — Left */}
          <div className="block">
            <div className="sticky top-24">
              <AIChat onDashboardGenerated={handleDashboardGenerated} />
            </div>
          </div>

          {/* Dashboard Area — Right */}
          <div className="space-y-6 min-w-0">
            {dashboardConfig && uploadedData ? (
              <>
                {/* Dashboard Header */}
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-medium uppercase tracking-wider ${colors.chip}`}>
                      <Sparkles size={10} className="inline mr-1" />
                      AI Generated
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px]">
                      {uploadedData.totalRows} rows
                    </span>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {dashboardConfig.title}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dashboardConfig.description}
                  </p>
                </motion.div>

                {/* Data Summary Card */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-2xl border backdrop-blur-sm ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Database size={14} className={colors.text} />
                    <span className={`text-xs font-medium ${colors.text}`}>Data Overview</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    📊 <strong className="text-gray-900 dark:text-white">{uploadedData.fileName}</strong> — {uploadedData.totalRows} rows × {uploadedData.totalCols} columns
                  </p>
                  {dashboardConfig.dataSummary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {dashboardConfig.dataSummary}
                    </p>
                  )}
                  <div className="flex gap-3 mt-3">
                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      {uploadedData.numericColumns.length} numeric
                    </span>
                    <span className="text-xs text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full">
                      {uploadedData.categoricalColumns.length} categories
                    </span>
                  </div>
                </motion.div>

                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {metricCards.map((metric, i) => (
                    <motion.div
                      key={metric.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 200 }}
                      className="group bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl p-5 shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-800/50 hover:border-blue-500/20 dark:hover:border-blue-500/20 hover:-translate-y-0.5 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className={`p-2 rounded-xl ${colors.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                          <span className={colors.text}>
                            {ICON_MAP[metric.icon] || <Database size={18} />}
                          </span>
                        </div>
                        {metric.change !== undefined && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            metric.change >= 0
                              ? 'text-emerald-400 bg-emerald-500/10'
                              : 'text-red-400 bg-red-500/10'
                          }`}>
                            {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-gray-500 dark:text-gray-500 text-[10px] font-medium uppercase tracking-widest">
                        {metric.title}
                      </h3>
                      <p className={`text-2xl font-bold text-gray-900 dark:text-white mt-1 group-hover:${colors.text} transition-colors`}>
                        {typeof metric.computedValue === 'number'
                          ? formatValue(metric.computedValue, metric.suffix)
                          : metric.computedValue}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Grid */}
                <div className={
                  dashboardConfig.layout === 'full'
                    ? 'space-y-6'
                    : 'grid grid-cols-1 lg:grid-cols-2 gap-6'
                }>
                  {dashboardConfig.charts.map((chartConfig, i) => (
                    <DynamicChart
                      key={chartConfig.id}
                      config={chartConfig}
                      data={uploadedData.rows}
                      colorScheme={dashboardConfig.colorScheme}
                    />
                  ))}
                </div>
              </>
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[600px] bg-white dark:bg-gray-900/80 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-12"
              >
                <div className="mb-8">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                    <Zap size={40} className="text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 tracking-tight">
                  Your Dashboard
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8 leading-relaxed">
                  Upload your Excel or CSV file, and let the AI analyze your data. It will suggest the best KPIs, charts, and insights automatically.
                </p>
                <div className="flex items-center gap-2">
                  {['1. Upload Data', '2. AI Summary', '3. Recommendations', '4. Business Logic & ML', '5. Generate'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                        i === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {step}
                      </div>
                      {i < 4 && <span className="text-gray-400 text-xs">→</span>}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>


        </div>
      </main>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && shareUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Share2 size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Share Dashboard</h3>
                  <p className="text-xs text-gray-400">Anyone with this link can view</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-gray-800 rounded-xl p-3 mb-4">
                <Globe size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  data-share-input
                  className="flex-1 bg-transparent text-sm text-gray-300 focus:outline-none"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).select();
                    try {
                      navigator.clipboard.writeText(shareUrl || '');
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2000);
                    } catch { /* fallback handled by button */ }
                  }}
                />
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareUrl || '');
                      setShareCopied(true);
                      setTimeout(() => setShareCopied(false), 2000);
                    } catch {
                      // Fallback for insecure contexts
                      const input = document.querySelector<HTMLInputElement>('[data-share-input]');
                      if (input) {
                        input.select();
                        document.execCommand('copy');
                        setShareCopied(true);
                        setTimeout(() => setShareCopied(false), 2000);
                      }
                    }
                  }}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-all font-medium flex items-center gap-1 ${
                    shareCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {shareCopied ? <><Check size={12} /> Copied</> : 'Copy'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
