import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, TrendingUp, Users, DollarSign, Activity,
  Target, Clock, Star, Database, Sparkles,
  RefreshCw, BarChart3, PieChart, Globe, Share2, Check,
  Heart, ShoppingCart, GraduationCap, Monitor, Factory,
  Building2, Truck, Megaphone, Hotel, Sprout,
  Trophy, Landmark, Scale, Filter, ChevronDown,
  Copy, Link, FileText, Download, X, Code, ArrowUpRight,
} from 'lucide-react';
import { AIChat } from './AIChat';
import { DynamicChart } from './DynamicChart';
import { DashboardConfig, UploadedData } from '../types/dashboard';
import { getMetricEmoji } from '../utils/dataContext';

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
  'heart-pulse': <Heart size={18} />,
  'shopping-cart': <ShoppingCart size={18} />,
  'graduation-cap': <GraduationCap size={18} />,
  'monitor': <Monitor size={18} />,
  'factory': <Factory size={18} />,
  'building-2': <Building2 size={18} />,
  'truck': <Truck size={18} />,
  'zap': <Zap size={18} />,
  'megaphone': <Megaphone size={18} />,
  'hotel': <Hotel size={18} />,
  'sprout': <Sprout size={18} />,
  'trophy': <Trophy size={18} />,
  'landmark': <Landmark size={18} />,
  'scale': <Scale size={18} />,
};

const COLOR_SCHEMES: Record<string, {
  bg: string; text: string; border: string; iconBg: string;
  gradient: string; chip: string; accent: string;
}> = {
  corporate: {
    bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    gradient: 'from-blue-600 to-indigo-600',
    chip: 'bg-blue-100 text-blue-700 border-blue-200',
    accent: '#3b82f6',
  },
  accessible: {
    bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    gradient: 'from-slate-600 to-blue-600',
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    accent: '#64748b',
  },
  modern: {
    bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200',
    iconBg: 'bg-indigo-100',
    gradient: 'from-indigo-600 to-blue-600',
    chip: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    accent: '#6366f1',
  },
  semantic: {
    bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    gradient: 'from-emerald-600 to-teal-600',
    chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    accent: '#059669',
  },
  pastels: {
    bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200',
    iconBg: 'bg-rose-100',
    gradient: 'from-rose-500 to-pink-500',
    chip: 'bg-rose-100 text-rose-700 border-rose-200',
    accent: '#f43f5e',
  },
  chronological: {
    bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200',
    iconBg: 'bg-blue-100',
    gradient: 'from-blue-600 to-indigo-800',
    chip: 'bg-blue-100 text-blue-700 border-blue-200',
    accent: '#2563eb',
  },
  vintage: {
    bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200',
    iconBg: 'bg-amber-100',
    gradient: 'from-amber-600 to-emerald-700',
    chip: 'bg-amber-100 text-amber-700 border-amber-200',
    accent: '#d97706',
  },
  heatmap: {
    bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200',
    iconBg: 'bg-slate-100',
    gradient: 'from-slate-600 to-slate-800',
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    accent: '#475569',
  },
  glow: {
    bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200',
    iconBg: 'bg-sky-100',
    gradient: 'from-sky-600 to-indigo-600',
    chip: 'bg-sky-100 text-sky-700 border-sky-200',
    accent: '#0284c7',
  },
  geographic: {
    bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200',
    iconBg: 'bg-orange-100',
    gradient: 'from-orange-500 to-red-600',
    chip: 'bg-orange-100 text-orange-700 border-orange-200',
    accent: '#f97316',
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
      if (rows.length === 0) return 0;
      return rows.reduce((min, row) => {
        const val = Number(row[column]) || 0;
        return val < min ? val : min;
      }, Number(rows[0][column]) || 0);
    case 'max':
      if (rows.length === 0) return 0;
      return rows.reduce((max, row) => {
        const val = Number(row[column]) || 0;
        return val > max ? val : max;
      }, Number(rows[0][column]) || 0);
    default:
      return 0;
  }
}

function formatValue(value: number, suffix?: string): string {
  let formatted = '';
  if (value >= 1000000) formatted = (value / 1000000).toFixed(1) + 'M';
  else if (value >= 1000) formatted = (value / 1000).toFixed(1) + 'K';
  else formatted = value.toLocaleString(undefined, { maximumFractionDigits: 1 });

  if (suffix === '%') return formatted + '%';
  if (suffix === '$') return '$' + formatted;
  return formatted + (suffix || '');
}

const DASHBOARD_STORAGE_KEY = 'arjuna_dashboard';

export function Dashboard() {
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig | null>(null);
  const [uploadedData, setUploadedData] = useState<UploadedData | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [shareLinkType, setShareLinkType] = useState<'public' | 'embed'>('public');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Force white theme on initial load
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

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

  const getShareLink = () => {
    if (shareLinkType === 'embed') {
      return `<iframe src="${shareUrl}" width="100%" height="800" frameborder="0" style="border:1px solid #e2e8f0;border-radius:12px;"></iframe>`;
    }
    return shareUrl || '';
  };

  const copyShareLink = async () => {
    const link = getShareLink();
    try {
      await navigator.clipboard.writeText(link);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      const input = document.querySelector<HTMLInputElement>('[data-share-input]');
      if (input) {
        input.select();
        document.execCommand('copy');
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Professional Dashboard Header */}
      <header className="dashboard-header fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <Zap size={18} className="text-white" />
            </div>
            <div className="flex items-center gap-1">
              <h1 className="text-base font-bold text-gray-900 tracking-tight">
                Arjuna Speaks
              </h1>
              {dashboardConfig && (
                <>
                  <ChevronDown size={14} className="text-gray-400 mx-1" />
                  <span className="text-sm text-gray-500 font-medium">{dashboardConfig.title}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dashboardConfig && (
            <>
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all font-medium"
              >
                <Share2 size={14} />
                Share
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all"
              >
                <Download size={14} />
                Export
              </button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <button
                onClick={() => { setDashboardConfig(null); setUploadedData(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all"
              >
                <RefreshCw size={14} />
                New
              </button>
            </>
          )}
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16" />

      <main className="max-w-[1600px] mx-auto p-5">
        <div className="flex flex-col lg:flex-row gap-5">
          {/* Chat Sidebar — Left */}
          <aside className="w-full lg:w-[380px] flex-shrink-0">
            <div className="sticky top-20 h-[calc(100vh-90px)] min-h-[600px]">
              <AIChat
                onDashboardGenerated={handleDashboardGenerated}
              />
            </div>
          </aside>

          {/* Dashboard Area — Right */}
          <section className="flex-1 min-w-0 space-y-5">
            {dashboardConfig && uploadedData ? (
              <>
                {/* Dashboard Header with Meta */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-md border text-[10px] font-medium uppercase tracking-wider ${colors.chip}`}>
                      <Sparkles size={10} className="inline mr-1" />
                      AI Generated Dashboard
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-500 text-[10px] font-medium">
                      {uploadedData.totalRows} rows · {uploadedData.totalCols} columns
                    </span>
                    {uploadedData.context && (
                      <span
                        className="px-2 py-1 rounded-md text-[10px] font-medium text-white flex items-center gap-1"
                        style={{ backgroundColor: uploadedData.context.accentColor }}
                      >
                        {uploadedData.context.emoji} {uploadedData.context.label}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                      {dashboardConfig.title}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {dashboardConfig.description}
                    </p>
                  </div>
                </div>

                {/* Filter Bar (like PowerBI) */}
                {dashboardConfig.filters && dashboardConfig.filters.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200/80 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Filter size={14} className="text-gray-400 flex-shrink-0" />
                      <div className="filter-bar flex-1">
                        {dashboardConfig.filters.map((filter, i) => (
                          <button
                            key={filter}
                            onClick={() => setActiveFilter(activeFilter === filter ? null : filter)}
                            className={`filter-chip ${activeFilter === filter ? 'active' : ''}`}
                            style={{ animationDelay: `${i * 30}ms` }}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Summary Card */}
                <div className={`rounded-xl border backdrop-blur-sm bg-white ${colors.border} p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Database size={14} className={colors.text} />
                    <span className={`text-xs font-medium ${colors.text}`}>Data Overview</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong className="text-gray-900">{uploadedData.fileName}</strong> — {uploadedData.totalRows} rows × {uploadedData.totalCols} columns
                  </p>
                  {dashboardConfig.dataSummary && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                      {dashboardConfig.dataSummary}
                    </p>
                  )}
                  <div className="flex gap-2 mt-3">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md font-medium">
                      {uploadedData.numericColumns.length} numeric
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md font-medium">
                      {uploadedData.categoricalColumns.length} categories
                    </span>
                  </div>
                </div>

                {/* KPI Metric Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {metricCards.map((metric, i) => {
                    const isPositive = metric.change !== undefined && metric.change >= 0;
                    const isNegative = metric.change !== undefined && metric.change < 0;
                    return (
                      <motion.div
                        key={metric.title}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 200 }}
                        className="metric-card"
                      >
                        {/* Accent bar */}
                        <div
                          className="accent-bar"
                          style={{ background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}88)` }}
                        />

                        <div className="flex items-start justify-between mb-2">
                          <div className={`p-2 rounded-lg ${colors.iconBg}`}>
                            {ICON_MAP[metric.icon] || <Database size={16} />}
                          </div>
                          {metric.change !== undefined && (
                            <span className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
                              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {isPositive ? (
                                <TrendingUp size={11} />
                              ) : (
                                <TrendingUp size={11} className="rotate-180" />
                              )}
                              {Math.abs(metric.change)}%
                            </span>
                          )}
                        </div>

                        <div className="metric-value">
                          {typeof metric.computedValue === 'number'
                            ? formatValue(metric.computedValue, metric.suffix)
                            : metric.computedValue}
                        </div>
                        <div className="metric-label flex items-center gap-1">
                          <span>{getMetricEmoji(metric.title, uploadedData?.context?.domain || 'general')}</span>
                          <span>{metric.title}</span>
                        </div>
                        <div className="drill-hint absolute bottom-2 right-3 text-[9px] text-gray-300 font-medium flex items-center gap-0.5">
                          Details <ArrowUpRight size={9} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Charts Grid */}
                <div className={
                  dashboardConfig.layout === 'full'
                    ? 'space-y-5'
                    : 'grid grid-cols-1 lg:grid-cols-2 gap-5'
                }>
                  {dashboardConfig.charts.map((chartConfig, i) => (
                    <DynamicChart
                      key={chartConfig.id}
                      config={chartConfig}
                      data={uploadedData.rows}
                      colorScheme={dashboardConfig.colorScheme}
                      index={i}
                    />
                  ))}
                </div>
              </>
            ) : uploadedData ? (
              /* Data Workspace (analysis-only) */
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Data Workspace</h2>
                  <span className="px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200">
                    Awaiting Dashboard Generation
                  </span>
                </div>

                <div className="rounded-xl bg-white border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Database size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{uploadedData.fileName}</p>
                      <p className="text-xs text-gray-500">{uploadedData.totalRows} rows · {uploadedData.totalCols} columns</p>
                      {uploadedData.context && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-medium text-white" style={{ backgroundColor: uploadedData.context.accentColor }}>
                          {uploadedData.context.emoji} {uploadedData.context.label}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    Data has been analyzed. Insights, KPIs, and recommendations are available in the chat panel on the left.
                    When ready, click <strong>Preview Dashboard</strong> in the chat to generate your visualization.
                  </p>
                </div>
              </div>
            ) : (
              /* Welcome / Empty State */
              <div className="flex flex-col items-center justify-center h-[600px] bg-white rounded-xl border border-gray-200 p-12 shadow-sm">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg mb-6
                  animate-float-3d">
                  <Zap size={40} className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
                  Welcome to Arjuna Speaks
                </h2>
                <p className="text-gray-500 text-center max-w-md mb-8 leading-relaxed">
                  Upload an Excel or CSV file to initiate pattern analysis and KPI detection.
                  Your professional dashboard will be generated with intelligent visualizations.
                </p>
                <div className="flex flex-wrap justify-center items-center gap-2">
                  {['1. Upload Data', '2. AI Analysis', '3. Recommendations', '4. Generate'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2 mb-2">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                        i === 3
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white text-gray-600 border border-gray-200 shadow-sm'
                      }`}>
                        {step}
                      </div>
                      {i < 3 && <span className="text-gray-300 text-xs">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Professional Share Modal */}
      <AnimatePresence>
        {showShareModal && shareUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 share-modal-overlay"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="share-modal"
            >
              {/* Modal Header */}
              <div className="flex items-center gap-3 p-5 pb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                  <Share2 size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Share Dashboard</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {dashboardConfig?.title || 'Analytics Dashboard'}
                  </p>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Link Type Tabs */}
              <div className="px-5 py-3">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setShareLinkType('public')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                      shareLinkType === 'public' ? 'tab-active' : 'tab-inactive'
                    }`}
                  >
                    <Link size={14} />
                    Share Link
                  </button>
                  <button
                    onClick={() => setShareLinkType('embed')}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-all ${
                      shareLinkType === 'embed' ? 'tab-active' : 'tab-inactive'
                    }`}
                  >
                    <Code size={14} />
                    Embed
                  </button>
                </div>
              </div>

              {/* Link Display */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1.5 border border-gray-200">
                  <div className="flex-1 px-2">
                    {shareLinkType === 'embed' ? (
                      <textarea
                        readOnly
                        value={getShareLink()}
                        rows={2}
                        className="w-full bg-transparent text-[11px] text-gray-600 font-mono resize-none focus:outline-none"
                        onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                      />
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value={getShareLink()}
                        data-share-input
                        className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                    )}
                  </div>
                  <button
                    onClick={copyShareLink}
                    className={`px-3 py-2 text-xs rounded-lg transition-all font-medium flex items-center gap-1.5 flex-shrink-0 ${
                      shareCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {shareCopied ? (
                      <><Check size={13} /> Copied</>
                    ) : (
                      <><Copy size={13} /> Copy</>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mt-2 text-center">
                  {shareLinkType === 'embed'
                    ? 'Paste this iframe code into any HTML page to embed the dashboard.'
                    : 'Anyone with this link can view the dashboard.'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
