import { useState, useRef, useEffect, useCallback } from 'react';
import { useGroq } from '../hooks/useGroq';
import { FileUpload } from './FileUpload';
import {
  Send, Bot, User, Paperclip, Cloud,
  Sparkles, FileSpreadsheet, Copy, ThumbsUp, ThumbsDown,
  Menu, Plus, X, Check, ChevronDown, ExternalLink,
  FileText, Lightbulb, BrainCircuit, LayoutDashboard,
  ArrowRight, Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatMessage, UploadedData, GroqModel, DashboardConfig, AnalysisSection, GROQ_MODELS,
  PipelinePhase,
} from '../types/dashboard';
import { uploadToDrive, saveDashboardLinkToDrive, isDriveConfigured } from '../services/googleDrive';
import { useChatStore } from '../store/chatStore';

interface AIChatProps {
  onDashboardGenerated?: (config: DashboardConfig, data: UploadedData) => void;
  standalone?: boolean;
}

const PIPELINE_STEPS: { phase: PipelinePhase; label: string; icon: React.ReactNode }[] = [
  { phase: 'summarizing', label: 'Analyze Data', icon: <FileText size={14} /> },
  { phase: 'recommending', label: 'Recommendations', icon: <Lightbulb size={14} /> },
  { phase: 'awaiting-logic', label: 'Business Logic', icon: <BrainCircuit size={14} /> },
  { phase: 'ml-processing', label: 'ML Processing', icon: <Loader2 size={14} /> },
  { phase: 'dashboard-ready', label: 'Ready', icon: <LayoutDashboard size={14} /> },
  { phase: 'completed', label: 'Saved', icon: <Check size={14} /> },
];

const PHASE_LABELS: Record<string, string> = {
  summarizing: 'Analyzing data...',
  recommending: 'Generating recommendations...',
  'ml-processing': 'Applying ML processing...',
};

export function AIChat({
  onDashboardGenerated,
  standalone = false,
}: AIChatProps) {
  const {
    sessions, activeSessionId,
    createSession, switchSession, closeSession,
    addMessage, setUploadedData: setStoreUploadedData,
  } = useChatStore();

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messages = activeSession?.messages || [];
  const uploadedData = activeSession?.uploadedData || null;

  const [input, setInput] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<GroqModel>('llama-3.3-70b-versatile');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [pendingConfig, setPendingConfig] = useState<DashboardConfig | null>(null);
  const [showDriveConfirm, setShowDriveConfirm] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  // Pipeline state
  const [pipelinePhase, setPipelinePhase] = useState<PipelinePhase>('idle');
  const [businessLogic, setBusinessLogic] = useState('');
  const [summaryContent, setSummaryContent] = useState<string | null>(null);
  const [recommendationsContent, setRecommendationsContent] = useState<string | null>(null);
  const [mlResultContent, setMlResultContent] = useState<string | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);

  const { sendMessage, loading, error } = useGroq();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logicInputRef = useRef<HTMLTextAreaElement>(null);

  // Helper to generate unique IDs for React keys
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, pipelinePhase]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeSessionId]);

  /** Determine the current step index for the pipeline progress bar */
  const getCurrentStepIndex = (): number => {
    const order: PipelinePhase[] = ['summarizing', 'recommending', 'awaiting-logic', 'ml-processing', 'dashboard-ready', 'completed'];
    const idx = order.indexOf(pipelinePhase);
    return idx >= 0 ? idx : -1;
  };

  /** Parse AI analysis response into 3 structured sections */
  const parseAnalysisSections = (content: string): AnalysisSection[] | undefined => {
    const sectionTitles = ['Recommendations', 'Insights', 'Actions'];
    const sections: AnalysisSection[] = [];

    const lines = content.split('\n');
    let currentSection: string | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      const headerMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
      if (headerMatch) {
        const title = headerMatch[1].trim();
        if (sectionTitles.includes(title)) {
          if (currentSection && currentContent.length > 0) {
            sections.push({ title: currentSection, content: currentContent.join('\n').trim() });
          }
          currentSection = title;
          currentContent = [];
          continue;
        }
      }
      if (currentSection) {
        currentContent.push(line);
      }
    }
    if (currentSection && currentContent.length > 0) {
      sections.push({ title: currentSection, content: currentContent.join('\n').trim() });
    }

    if (sections.length === 0) {
      const recommendationsMatch = content.match(/(?:\*\*|__)?Recommendations?(?:\*\*|__)?[\s:]*(.+?)(?=(?:\*\*|__)?(?:Insights?|Actions?)(?:\*\*|__)?)/is);
      const insightsMatch = content.match(/(?:\*\*|__)?Insights?(?:\*\*|__)?[\s:]*(.+?)(?=(?:\*\*|__)?(?:Recommendations?|Actions?)(?:\*\*|__)?)/is);
      const actionsMatch = content.match(/(?:\*\*|__)?Actions?(?:\*\*|__)?[\s:]*(.+?)$/is);

      if (recommendationsMatch) sections.push({ title: 'Recommendations', content: recommendationsMatch[1].trim() });
      if (insightsMatch) sections.push({ title: 'Insights', content: insightsMatch[1].trim() });
      if (actionsMatch) sections.push({ title: 'Actions', content: actionsMatch[1].trim() });
    }

    return sections.length >= 2 ? sections.slice(0, 3) : undefined;
  };

  /** Run the full analysis pipeline after file upload */
  const runAnalysisPipeline = useCallback(async (data: UploadedData, file: File) => {
    if (!activeSessionId) return;

    // Phase 1: Summarize - Show concise insights, NOT raw data
    setPipelinePhase('summarizing');
    setPipelineLoading(true);

    const summaryResponse = await sendMessage(
      'Provide a high-level executive summary of this data. DO NOT include raw data tables or lists of rows. Focus on: 1. Key statistical highlights 2. Data quality assessment 3. Recommended column transformations for visualization.',
      data,
      selectedModel,
      'summarizing'
    );

    if (summaryResponse && typeof summaryResponse === 'string') {
      setSummaryContent(summaryResponse);
      const summaryMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `## 📊 Data Summary\n\n${summaryResponse}`,
        timestamp: new Date(),
      };
      addMessage(activeSessionId, summaryMsg);
    }

    // Phase 2: Recommend
    setPipelinePhase('recommending');

    const recommendResponse = await sendMessage(
      'Recommend the visual architecture. Suggest the best chart types (including potential 3D-depth visualizations), optimal column mappings, and transformation logic for professional dashboards.',
      data,
      selectedModel,
      'recommending'
    );

    if (recommendResponse && typeof recommendResponse === 'string') {
      setRecommendationsContent(recommendResponse);
      const sections = parseAnalysisSections(recommendResponse);
      const recommendMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `## 🎯 Dashboard Recommendations\n\n${recommendResponse}`,
        timestamp: new Date(),
        metadata: sections ? { type: 'analysis', sections } : undefined,
      };
      addMessage(activeSessionId, recommendMsg);
    }

    // Move to business logic input phase
    setPipelinePhase('awaiting-logic');
    setPipelineLoading(false);

    // Upload to Google Drive uploads folder (background)
    if (isDriveConfigured()) {
      setDriveStatus('uploading');
      try {
        const driveFile = await uploadToDrive(file, 'Uploads');
        setDriveUrl(driveFile.webViewLink);
        setDriveStatus('uploaded');
      } catch {
        setDriveStatus('error');
      }
    }
  }, [activeSessionId, selectedModel, sendMessage, addMessage]);

  /** Handle business logic submission and run ML processing */
  const handleBusinessLogicSubmit = useCallback(async () => {
    if (!activeSessionId || !uploadedData) return;

    const logicText = businessLogic.trim() || 'No specific business logic provided. Apply standard data analysis best practices.';

    // Add user's business logic as a message
    const logicMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: `📋 Business Logic: ${logicText}`,
      timestamp: new Date(),
    };
    addMessage(activeSessionId, logicMsg);

    // Phase 4: ML Processing
    setPipelinePhase('ml-processing');
    setPipelineLoading(true);

    const mlResponse = await sendMessage(
      `Process data with logic: ${logicText}. Identify trends, anomalies, and prepare for 3D visualizations. If no logic, autonomously determine the best transformation patterns.`,
      uploadedData,
      selectedModel,
      'ml-processing'
    );

    if (mlResponse && typeof mlResponse === 'string') {
      setMlResultContent(mlResponse);
      const mlMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `## 🔬 ML Processing Complete\n\n${mlResponse}`,
        timestamp: new Date(),
      };
      addMessage(activeSessionId, mlMsg);
    }

    // Dashboard ready!
    setPipelinePhase('dashboard-ready');
    setPipelineLoading(false);
  }, [activeSessionId, uploadedData, businessLogic, selectedModel, sendMessage, addMessage]);

   const handleConfirmAndStore = async () => {
    if (!pendingConfig || !uploadedData || !activeSessionId) return;
    
    setDriveStatus('uploading');
    try {
      const dashboardUrl = `${window.location.origin}?dashboard=${encodeURIComponent(pendingConfig.title)}`;
      const driveFile = await saveDashboardLinkToDrive(pendingConfig.title, dashboardUrl, pendingConfig.description);
      
      setDriveUrl(driveFile.webViewLink);
      setDriveStatus('uploaded');
      setPipelinePhase('completed');
      
      const shareMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `### 🎉 Report Finished & Stored\nYour professional dashboard is now live and stored in your Google Drive 'Reports' folder.\n\n**Shareable Links:**\n1. 📂 Google Drive Link: ${driveFile.webViewLink}\n2. 🔗 Public Dashboard: ${dashboardUrl}`,
        timestamp: new Date(),
      };
      addMessage(activeSessionId, shareMsg);
      setShowDriveConfirm(false);
    } catch (err) {
      setDriveStatus('error');
    }
  };

  const handleFileParsed = async (data: UploadedData, file: File) => {
    if (!activeSessionId) return;
    setStoreUploadedData(activeSessionId, data);
    setShowUpload(false);

    const fileMsg: ChatMessage = {
      id: generateId(),
      role: 'system',
      content: `${data.context?.emoji || '📎'} Uploaded **${data.fileName}** — ${data.totalRows} rows, ${data.totalCols} columns`,
      timestamp: new Date(),
    };

    // Add an additional context-aware welcome message
    if (data.context && data.context.domain !== 'general') {
      const contextMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `🔍 **Detected Domain: ${data.context.emoji} ${data.context.label}**\n\n${data.context.description}\n\nI'll analyze this with relevant domain expertise. Ask me anything or say "generate dashboard" when ready.`,
        timestamp: new Date(),
      };
      addMessage(activeSessionId, contextMsg);
    }
    addMessage(activeSessionId, fileMsg);

    // Run the full analysis pipeline
    await runAnalysisPipeline(data, file);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !activeSessionId) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(activeSessionId, userMsg);

    const response = await sendMessage(text, uploadedData || undefined, selectedModel, 'chat');
    if (response && typeof response === 'string') {
      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      addMessage(activeSessionId, aiMsg);
    }
  };

  const handleGenerateDashboard = async () => {
    if (!uploadedData || loading || !activeSessionId) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: '✨ Generate a professional dashboard from my data',
      timestamp: new Date(),
    };
    addMessage(activeSessionId, userMsg);

    const response = await sendMessage(
      'Generate a professional dashboard',
      uploadedData,
      selectedModel,
      'dashboard'
    );

    if (response && typeof response === 'object' && 'title' in response) {
      const config = response as DashboardConfig;
      const aiMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `## ${config.title}\n${config.description || ''}\n\n${config.dataSummary || ''}`,
        timestamp: new Date(),
        metadata: { type: 'dashboard', dashboardConfig: config },
      };
      addMessage(activeSessionId, aiMsg);
      setPendingConfig(config);
      setShowDriveConfirm(true);
      onDashboardGenerated?.(config, uploadedData);
    }
  };

  const copyToClipboard = async (text: string, msgId: string) => {
    await navigator.clipboard.writeText(text.replace(/## .+\n/, '').trim());
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Auto-resize business logic textarea
  useEffect(() => {
    if (logicInputRef.current) {
      logicInputRef.current.style.height = 'auto';
      logicInputRef.current.style.height = Math.min(logicInputRef.current.scrollHeight, 200) + 'px';
    }
  }, [businessLogic]);

  const currentStep = getCurrentStepIndex();
  const showPipelineProgress = pipelinePhase !== 'idle' && uploadedData !== null;

  return (
    <div className={`flex flex-col ${standalone ? 'h-screen' : 'h-full'} bg-white rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden relative`}>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-gray-800/20"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute left-0 top-0 bottom-0 w-[260px] z-50 bg-white border-r border-gray-200 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sessions</span>
              {sessions.length < 6 && (
                <button
                  onClick={() => { createSession(); setShowSidebar(false); }}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.map((s) => (
                <div
                  key={s.id}                    className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all ${
                    s.id === activeSessionId
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent'
                  }`}
                  onClick={() => { switchSession(s.id); setShowSidebar(false); }}
                >
                  <Bot size={14} className="flex-shrink-0 opacity-40" />
                  <span className="flex-1 truncate text-xs">{s.name}</span>
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); closeSession(s.id); }}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200/50 transition-all"
                    >
                      <X size={12} className="text-gray-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 flex-shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <Bot size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-gray-800">Arjuna Speaks</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Model Picker */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <Bot size={11} />
              {GROQ_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
              <ChevronDown size={10} />
            </button>
            {showModelPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                  <div className="px-3 py-1.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Free Models</div>
                  {GROQ_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                        m.id === selectedModel
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{m.name}</span>
                        <span className="block text-[9px] text-gray-400 truncate">{m.description}</span>
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] font-medium text-white"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {uploadedData && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] border border-blue-200">
              <FileSpreadsheet size={12} />
              <span className="truncate max-w-[50px]">{uploadedData.fileName}</span>
            </div>
          )}
          {driveUrl && driveStatus === 'uploaded' && (
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 text-[10px] border border-green-200 hover:opacity-80 transition-opacity"
              title="View on Google Drive"
            >
              <Cloud size={11} />
              <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>

      {/* Pipeline Progress Indicator */}
      <AnimatePresence>
        {showPipelineProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3 pb-2 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-blue-200/50"
          >
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                  Analysis Pipeline
                </span>
                <span className="text-[10px] text-blue-500 font-medium">
                  {pipelinePhase === 'awaiting-logic' ? 'Action Required' :
                   pipelinePhase === 'dashboard-ready' ? 'Complete' : 'In Progress'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {PIPELINE_STEPS.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isComplete = idx < currentStep;
                  const isPending = idx > currentStep;
                  return (
                    <div key={step.phase} className="flex-1 flex flex-col items-center">
                      <div className="flex items-center w-full">
                        <div className={`flex items-center justify-center w-7 h-7 rounded-full transition-all duration-500 ${
                          isComplete
                            ? 'bg-blue-600 text-white shadow-sm'
                            : isActive
                            ? 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-sm'
                            : 'bg-gray-200 text-gray-400'
                        }`}>
                          {isComplete ? (
                            <Check size={13} />
                          ) : isActive && pipelineLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            step.icon
                          )}
                        </div>
                        {idx < PIPELINE_STEPS.length - 1 && (
                          <div className={`flex-1 h-[2px] mx-1 rounded-full transition-all duration-500 ${
                            isComplete
                              ? 'bg-blue-500'
                              : isActive
                              ? 'bg-blue-300'
                              : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                      <span className={`text-[8px] mt-1 text-center font-medium transition-colors duration-300 ${
                        isComplete
                          ? 'text-blue-600'
                          : isActive
                          ? 'text-blue-600'
                          : 'text-gray-400'
                      } ${isActive && pipelinePhase === 'awaiting-logic' ? 'animate-pulse' : ''}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth">
        <div className="max-w-2xl mx-auto space-y-6">
          {messages.length === 0 && !loading && !uploadedData && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg mb-6">
                <Bot size={32} className="text-white" />
              </div>
              <div className="space-y-4 px-6">
                <h2 className="text-xl font-bold text-gray-900">👋 Welcome to Arjuna Speaks!</h2>
                <div className="text-sm text-gray-500 space-y-4 max-w-sm mx-auto">
                  <p className="font-medium text-gray-700">Get started:</p>
                  <ul className="text-left space-y-3 ml-4">
                    <li className="flex items-start gap-2"><span>•</span> Upload an Excel or CSV file (drag & drop or click)</li>
                    <li className="flex items-start gap-2"><span>•</span> The AI automatically analyzes and suggests KPIs & insights</li>
                    <li className="flex items-start gap-2"><span>•</span> Add business logic or ask questions about your data</li>
                    <li className="flex items-start gap-2"><span>•</span> Click <strong>Preview Dashboard</strong> to generate visualizations</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                {msg.role === 'system' ? (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 shadow-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="flex gap-2 max-w-[75%] items-end">
                      <div className="px-4 py-2.5 rounded-2xl bg-gray-900 text-white text-sm leading-relaxed">
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <User size={13} className="text-white" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <Bot size={13} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="px-4 py-3 rounded-2xl bg-gray-50 text-gray-800 text-sm leading-relaxed border border-gray-100 overflow-hidden">
                        {/* Never show raw data tables - only processed insights */}
                        <div className="prose prose-sm max-w-full whitespace-pre-wrap overflow-x-auto">
                          {msg.content}
                        </div>
                        {msg.metadata?.type === 'dashboard' && msg.metadata.dashboardConfig && (
                          <div className="mt-2.5 flex items-center gap-2 text-xs text-blue-500 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                            <Sparkles size={12} />
                            Dashboard generated — view it on the right panel
                          </div>
                        )}
                        {/* 3-Cards for analysis responses */}
                        {msg.metadata?.type === 'analysis' && msg.metadata.sections && (
                          <div className="mt-4 flex flex-col gap-3">
                            {msg.metadata.sections.map((section, idx) => (
                              <div key={idx} className="p-4 rounded-xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-center gap-1.5 mb-2">
                                  <div className={`w-2.5 h-2.5 rounded-full ${
                                    idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-indigo-500' : 'bg-violet-500'
                                  }`} />
                                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                                    idx === 0 ? 'text-blue-600' : idx === 1 ? 'text-indigo-600' : 'text-violet-600'
                                  }`}>
                                    {section.title}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {section.content}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-0.5 mt-1.5 ml-1">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy"
                        >
                          {copiedId === msg.id ? <Check size={13} className="text-blue-500" /> : <Copy size={13} />}
                        </button>
                        <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Like">
                          <ThumbsUp size={13} />
                        </button>
                        <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Dislike">
                          <ThumbsDown size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 max-w-[85%]"
            >
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                <Bot size={13} className="text-gray-600" />
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-gray-500">
                  {PHASE_LABELS[pipelinePhase] || (uploadedData ? 'Analyzing data...' : 'Thinking...')}
                </span>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* File Upload Overlay */}
      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="w-full max-w-md">
              <FileUpload onFileParsed={handleFileParsed} onCancel={() => setShowUpload(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-200/80 flex-shrink-0 bg-white">
        <div className="max-w-3xl mx-auto">
          {/* Business Logic Input */}
          <AnimatePresence>
            {pipelinePhase === 'awaiting-logic' && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-3 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
                    <BrainCircuit size={14} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800">Business Logic Input</h4>
                    <p className="text-[10px] text-gray-500">
                      Optionally describe any business rules, calculations, or logic to apply
                    </p>
                  </div>
                </div>
                <textarea
                  ref={logicInputRef}
                  value={businessLogic}
                  onChange={(e) => setBusinessLogic(e.target.value)}
                  placeholder="e.g., Calculate growth rate as (current - previous) / previous * 100. Group by department. Flag any values below threshold as 'At Risk'..."
                  rows={2}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/30 resize-none min-h-[60px] transition-all"
                  disabled={pipelineLoading}
                />
                <div className="flex items-center justify-between mt-2.5">
                  <p className="text-[10px] text-gray-400">
                    {businessLogic.trim() ? 'Business logic defined ✓' : 'Optional — click proceed to use standard best practices'}
                  </p>
                  <button
                    onClick={handleBusinessLogicSubmit}
                    disabled={pipelineLoading}
                    className="px-4 py-2 text-xs font-medium bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                  >
                    {pipelineLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <ArrowRight size={13} />
                    )}
                    {pipelineLoading ? 'Processing...' : 'Apply & Proceed'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sticky Action Area — Always visible when data is uploaded */}
          <AnimatePresence>
            {uploadedData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2.5 space-y-2"
              >
                {/* Show Dashboard button prominently when ready */}
                {pipelinePhase === 'dashboard-ready' && (
                  <button
                    onClick={handleGenerateDashboard}
                    disabled={loading}
                    className="w-full px-4 py-3 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 font-semibold flex items-center justify-center gap-2 shadow-md"
                  >
                    <LayoutDashboard size={18} />
                    Preview Dashboard
                    <Sparkles size={14} className="opacity-70" />
                  </button>
                )}

                {/* Show status when pipeline is running */}
                {pipelinePhase !== 'idle' && pipelinePhase !== 'dashboard-ready' && pipelinePhase !== 'completed' && (
                  <div className="w-full px-4 py-2.5 text-xs text-center bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                    {pipelinePhase === 'awaiting-logic' 
                      ? '⏳ Add business logic above or click Apply to proceed'
                      : `⏳ Pipeline in progress — ${PHASE_LABELS[pipelinePhase] || 'processing...'}`}
                  </div>
                )}

                {showDriveConfirm && isDriveConfigured() && pipelinePhase === 'dashboard-ready' && (
                  <button
                    onClick={handleConfirmAndStore}
                    disabled={driveStatus === 'uploading'}
                    className="w-full px-4 py-3 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    {driveStatus === 'uploading' ? <Loader2 size={16} className="animate-spin" /> : <Cloud size={16} />}
                    Confirm & Store to Drive
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Input */}
          <div className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-blue-500/30 focus-within:border-blue-500/30 transition-all shadow-sm">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className={`p-2 rounded-xl transition-all ${
                showUpload
                  ? 'bg-blue-500/20 text-blue-500'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Upload file"
            >
              <Paperclip size={18} />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={uploadedData ? "Ask about your data..." : "Type a message..."}
              rows={1}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none max-h-[120px]"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-25 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2.5">
            Arjuna Speaks may display inaccurate info. Verify critical data independently.<br />
            <a href="https://www.flaticon.com/free-icons/fab" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">
              Icons by Flaticon
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
