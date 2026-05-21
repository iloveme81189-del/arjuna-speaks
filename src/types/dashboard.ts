export interface UploadedData {
  fileName: string;
  headers: string[];
  rows: Record<string, string | number>[];
  totalRows: number;
  totalCols: number;
  numericColumns: string[];
  categoricalColumns: string[];
}

export interface MetricConfig {
  title: string;
  value: string | number;
  change?: number;
  icon: string;
  color: string;
  prefix?: string;
  suffix?: string;
  target?: number;
  trend?: 'up' | 'down' | 'stable';
}

export type ColorScheme = 'corporate' | 'accessible' | 'modern' | 'semantic' | 'pastels' | 'chronological' | 'vintage' | 'heatmap' | 'glow' | 'geographic';

export type ChartType =
  // Bar & Column
  | 'bar' | 'stacked-bar' | 'clustered-bar' | 'stacked-column' | 'clustered-column' | '100-stacked-bar' | '100-stacked-column'
  // Line & Area
  | 'line' | 'step-line' | 'smooth-line' | 'area' | 'stacked-area' | '100-stacked-area'
  // Combo
  | 'line-stacked-column' | 'line-clustered-column'
  // Part-to-Whole
  | 'pie' | 'donut' | 'treemap'
  // Tabular & Grid
  | 'data-table' | 'matrix' | 'heatmap-matrix' | 'data-bar-matrix' | 'icon-matrix'
  // KPI & Metric Cards
  | 'single-value' | 'multi-row-card' | 'radial-gauge' | 'target-kpi'
  // Geographic Maps
  | 'bubble-map' | 'filled-map'
  // Analytical & Flow
  | 'scatter' | 'bubble-chart' | 'waterfall' | 'funnel' | 'ribbon' | 'decomposition-tree'
  // Interactive Slicers
  | 'list-slicer' | 'dropdown-slicer' | 'date-range-slider'
  // AI & Advanced
  | 'smart-narrative' | 'html-content'
  // Extended
  | 'radar' | 'heatmap' | 'gantt' | 'sankey' | 'chord' | 'bullet' | 'calendar-heatmap' | 'word-cloud' | 'sunburst';

export const CHART_CATEGORIES: { name: string; types: ChartType[] }[] = [
  {
    name: 'Bar & Column',
    types: ['bar', 'stacked-bar', 'clustered-bar', 'stacked-column', 'clustered-column', '100-stacked-bar', '100-stacked-column'],
  },
  {
    name: 'Line & Area',
    types: ['line', 'step-line', 'smooth-line', 'area', 'stacked-area', '100-stacked-area'],
  },
  {
    name: 'Combo',
    types: ['line-stacked-column', 'line-clustered-column'],
  },
  {
    name: 'Part-to-Whole',
    types: ['pie', 'donut', 'treemap'],
  },
  {
    name: 'Tabular & Grid',
    types: ['data-table', 'matrix', 'heatmap-matrix', 'data-bar-matrix', 'icon-matrix'],
  },
  {
    name: 'KPI & Metric Cards',
    types: ['single-value', 'multi-row-card', 'radial-gauge', 'target-kpi'],
  },
  {
    name: 'Geographic Maps',
    types: ['bubble-map', 'filled-map'],
  },
  {
    name: 'Analytical & Flow',
    types: ['scatter', 'bubble-chart', 'waterfall', 'funnel', 'ribbon', 'decomposition-tree'],
  },
  {
    name: 'Interactive Slicers',
    types: ['list-slicer', 'dropdown-slicer', 'date-range-slider'],
  },
  {
    name: 'AI & Text',
    types: ['smart-narrative', 'html-content'],
  },
  {
    name: 'Extended',
    types: ['radar', 'heatmap', 'gantt', 'sankey', 'chord', 'bullet', 'calendar-heatmap', 'word-cloud', 'sunburst'],
  },
];

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  dataKeyX: string;
  dataKeyY: string | string[];
  dataKeyZ?: string;
  groupBy?: string;
  color?: string;
  description?: string;
  stacked?: boolean;
  showLegend?: boolean;
  showGrid?: boolean;
  showLabels?: boolean;
  height?: number;
  threshold?: number;
  targetValue?: number;
}

export interface DashboardConfig {
  title: string;
  description: string;
  metrics: MetricConfig[];
  charts: ChartConfig[];
  layout: '2col' | '3col' | 'full';
  colorScheme: ColorScheme;
  darkMode: boolean;
  dataSummary: string;
  filters?: string[];
}

export type PipelinePhase =
  | 'idle'
  | 'summarizing'
  | 'summarized'
  | 'recommending'
  | 'recommended'
  | 'awaiting-logic'
  | 'ml-processing'
  | 'dashboard-ready';

export interface AnalysisSection {
  title: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    type?: 'text' | 'dashboard' | 'chart' | 'file_upload' | 'drive_link' | 'analysis';
    dashboardConfig?: DashboardConfig;
    driveUrl?: string;
    sections?: AnalysisSection[];
  };
}

export type GroqModel =
  | 'deepseek-r1-distill-llama-70b'
  | 'deepseek-r1-distill-qwen-32b'
  | 'llama-3.3-70b-versatile'
  | 'llama-3.3-70b-specdec'
  | 'llama3-70b-8192'
  | 'gemma2-9b-it'
  | 'llama3-8b-8192'
  | 'mixtral-8x7b-32768';

export const GROQ_MODELS: { id: GroqModel; name: string; description: string; color: string; badge: string }[] = [
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Llama 70B', description: 'Complex logic & deep reasoning', color: '#8b5cf6', badge: 'Reasoning' },
  { id: 'deepseek-r1-distill-qwen-32b', name: 'DeepSeek R1 Qwen 32B', description: 'Advanced algorithmic coding & math', color: '#6366f1', badge: 'Coding' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Dashboard structure layout planning & prompt instruction-following', color: '#3b82f6', badge: 'Dashboard' },
  { id: 'llama-3.3-70b-specdec', name: 'Llama 3.3 70B SpecDec', description: 'High-speed iterative debugging', color: '#06b6d4', badge: 'Debug' },
  { id: 'llama3-70b-8192', name: 'Llama 3 70B', description: 'Issue resolution & long context analysis', color: '#10b981', badge: 'Analysis' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Data narrative generation & basic chart selection', color: '#f59e0b', badge: 'Narrative' },
  { id: 'llama3-8b-8192', name: 'Llama 3 8B', description: 'Fast intent classification & simple code syntax', color: '#f97316', badge: 'Intent' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Broad logical schema mapping & generalized reasoning', color: '#ec4899', badge: 'Schema' },
];

export const CHART_COLORS: Record<string, string[]> = {
  // Corporate & Executive
  corporate: ['#118D95', '#185ABD', '#0078D4', '#2563EB', '#1E40AF', '#3182CE'],
  // Accessible WCAG
  accessible: ['#005A9C', '#A80000', '#008A00', '#D1A100', '#6B21A8', '#991B1B'],
  // Modern Tech & Startup
  modern: ['#4F46E5', '#10B981', '#8B5CF6', '#0EA5E9', '#F43F5E', '#EC4899'],
  // Semantic KPI & Financial
  semantic: ['#198754', '#DC3545', '#FFC107', '#0D6EFD', '#22C55E', '#EF4444'],
  // Pastels
  pastels: ['#A7F3D0', '#FDE68A', '#FBCFE8', '#C7D2FE', '#BAE6FD', '#FCA5A5'],
  // Chronological Blue (time-series)
  chronological: ['#EFF6FF', '#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6'],
  // Vintage & Retro
  vintage: ['#D97706', '#B45309', '#78350F', '#047857', '#065F46', '#0F766E'],
  // Heatmap Slate
  heatmap: ['#F8FAFC', '#F1F5F9', '#E2E8F0', '#CBD5E1', '#94A3B8', '#64748B'],
  // Dark Mode Glow
  glow: ['#38BDF8', '#34D399', '#FB7185', '#FBBF24', '#A78BFA', '#F472B6'],
  // Geographic Density
  geographic: ['#FFF7ED', '#FFEDD5', '#FDBA74', '#F97316', '#EA580C', '#C2410C'],
};



export const GRADIENT_PRESETS: Record<string, string> = {
  corporate: 'linear-gradient(135deg, #118D95 0%, #185ABD 50%, #0078D4 100%)',
  accessible: 'linear-gradient(135deg, #005A9C 0%, #6B21A8 50%, #008A00 100%)',
  modern: 'linear-gradient(135deg, #4F46E5 0%, #8B5CF6 50%, #0EA5E9 100%)',
  semantic: 'linear-gradient(135deg, #0D6EFD 0%, #198754 50%, #FFC107 100%)',
  pastels: 'linear-gradient(135deg, #A7F3D0 0%, #C7D2FE 50%, #FBCFE8 100%)',
  chronological: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 50%, #1E3A8A 100%)',
  vintage: 'linear-gradient(135deg, #D97706 0%, #78350F 50%, #047857 100%)',
  heatmap: 'linear-gradient(135deg, #CBD5E1 0%, #64748B 50%, #0F172A 100%)',
  glow: 'linear-gradient(135deg, #38BDF8 0%, #A78BFA 50%, #FB7185 100%)',
  geographic: 'linear-gradient(135deg, #FFF7ED 0%, #F97316 50%, #7C2D12 100%)',
};
