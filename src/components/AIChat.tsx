import { useState, useRef, useEffect } from 'react';
import { useGroq } from '../hooks/useGroq';
import { FileUpload } from './FileUpload';
import { DataPreview } from './DataPreview';
import {
  Send, Bot, User, Loader2, Paperclip,
  ChevronDown, Sparkles, FileSpreadsheet,
  Plus, Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatMessage, UploadedData, GroqModel, DashboardConfig, GROQ_MODELS,
} from '../types/dashboard';import { useChatStore } from '../store/chatStore';

interface AIChatProps {
  onDashboardGenerated?: (config: DashboardConfig, data: UploadedData) => void;
  standalone?: boolean;
}

export function AIChat({ onDashboardGenerated, standalone = false }: AIChatProps) {
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
  const [selectedModel, setSelectedModel] = useState<GroqModel>('llama-3.3-70b-versatile');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  const { sendMessage, loading, error } = useGroq();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeSessionId]);

  const handleFileParsed = async (data: UploadedData, file: File) => {
    if (!activeSessionId) return;
    setStoreUploadedData(activeSessionId, data);
    setShowUpload(false);

    const fileMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'system',
      content: `📎 Uploaded **${data.fileName}** — ${data.totalRows} rows, ${data.totalCols} columns`,
      timestamp: new Date(),
    };
    addMessage(activeSessionId, fileMsg);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading || !activeSessionId) return;
    setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    addMessage(activeSessionId, userMsg);

    const isDashboardRequest = text.toLowerCase().includes('generate') ||
      text.toLowerCase().includes('dashboard') ||
      text.toLowerCase().includes('visualize') ||
      text.toLowerCase().includes('chart');

    if (isDashboardRequest && uploadedData) {
      const response = await sendMessage(text, uploadedData, selectedModel, 'dashboard');
      if (response && typeof response === 'object' && 'title' in response) {
        const config = response as DashboardConfig;
        const shareUrl = `${window.location.origin}?dashboard=${encodeURIComponent(config.title)}`;
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `## ${config.title}\n${config.description || ''}\n\n${config.dataSummary || ''}`,
          timestamp: new Date(),
          metadata: { type: 'dashboard', dashboardConfig: config },
        };
        addMessage(activeSessionId, aiMsg);
        onDashboardGenerated?.(config, uploadedData);
        return;
      } else if (response && typeof response === 'string') {
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        };
        addMessage(activeSessionId, aiMsg);
        return;
      }
    }

    const response = await sendMessage(text, uploadedData || undefined, selectedModel, 'chat');
    if (response && typeof response === 'string') {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
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
      id: Date.now().toString(),
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
      const shareUrl = `${window.location.origin}?dashboard=${encodeURIComponent(config.title)}`;
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `## ${config.title}\n${config.description || ''}\n\n${config.dataSummary || ''}`,
        timestamp: new Date(),
        metadata: { type: 'dashboard', dashboardConfig: config },
      };
      addMessage(activeSessionId, aiMsg);
      onDashboardGenerated?.(config, uploadedData);
    }
  };

  const currentModel = GROQ_MODELS.find((m) => m.id === selectedModel);

  return (
    <div className={`flex flex-col ${standalone ? 'h-screen' : 'h-[600px]'} bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200/80 dark:border-gray-800/80 overflow-hidden backdrop-blur-sm`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-teal-600 to-blue-600 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-white" />
            <span className="text-white font-semibold text-sm">Arjuna Speaks</span>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Sessions */}
            <div className="relative">
              <button
                onClick={() => setShowSessions(!showSessions)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/90 text-xs"
              >
                <span className="truncate max-w-[60px]">{activeSession?.name || 'Chat'}</span>
                <ChevronDown size={10} />
              </button>
              <AnimatePresence>
                {showSessions && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full right-0 mt-1 w-44 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="px-3 py-2 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      Sessions ({sessions.length}/6)
                    </div>
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer transition-colors ${
                          s.id === activeSessionId
                            ? 'bg-purple-600/20 text-purple-300'
                            : 'text-gray-300 hover:bg-gray-800/50'
                        }`}
                        onClick={() => { switchSession(s.id); setShowSessions(false); }}
                      >
                        <Bot size={12} />
                        <span className="flex-1 truncate">{s.name}</span>
                        {sessions.length > 1 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); closeSession(s.id); }}
                            className="p-0.5 hover:bg-gray-700/50 rounded"
                          >
                            <Trash2 size={10} className="text-gray-500" />
                          </button>
                        )}
                      </div>
                    ))}
                    {sessions.length < 6 && (
                      <button
                        onClick={() => { createSession(); setShowSessions(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-purple-400 hover:bg-gray-800/50 transition-colors border-t border-gray-800"
                      >
                        <Plus size={12} />
                        New session
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Model Picker */}
            <div className="relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white/90 text-xs"
              >
                <Sparkles size={10} />
                <span className="hidden sm:inline">{currentModel?.name || 'Model'}</span>
                <ChevronDown size={10} />
              </button>
              <AnimatePresence>
                {showModelPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full right-0 mt-1 w-52 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
                  >
                    {GROQ_MODELS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => { setSelectedModel(model.id); setShowModelPicker(false); }}
                        className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                          selectedModel === model.id
                            ? 'bg-purple-600/20 text-purple-300'
                            : 'text-gray-300 hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="font-medium">{model.name}</div>
                        <div className="text-gray-500 mt-0.5">{model.description}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Data badge */}
            {uploadedData && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 text-white/80 text-[10px]">
                <FileSpreadsheet size={10} />
                <span className="truncate max-w-[60px]">{uploadedData.fileName}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
        <AnimatePresence mode="popLayout">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : msg.role === 'system' ? 'justify-center' : 'justify-start'} message-fade-in`}
            >
              {msg.role === 'system' ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-xs text-purple-300">
                  {msg.content}
                </div>
              ) : (
                <div className={`flex gap-2 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-teal-500 to-blue-500 text-white'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-500 text-white'
                  }`}>
                    {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                    msg.role === 'assistant'
                      ? 'bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-800 dark:text-gray-200 border border-gray-200/50 dark:border-gray-700/50'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                  }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                    {msg.metadata?.type === 'dashboard' && msg.metadata.dashboardConfig && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-purple-400">
                        <Sparkles size={12} />
                        Dashboard generated
                      </div>
                    )}
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
            className="flex items-center gap-3 px-4"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
              <span className="text-xs">
                {uploadedData ? 'Analyzing data...' : 'Thinking...'}
              </span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center"
          >
            {error}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Overlay */}
      <AnimatePresence>
        {showUpload && (
          <div className="px-4 mb-2">
            <FileUpload onFileParsed={handleFileParsed} onCancel={() => setShowUpload(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Data Preview */}
      <AnimatePresence>
        {uploadedData && !showUpload && (
          <div className="px-4 mb-2">
            <DataPreview data={uploadedData} />
          </div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-200/80 dark:border-gray-800/80 flex-shrink-0 bg-gradient-to-t from-gray-50/50 to-transparent dark:from-gray-900/50">
        {uploadedData && !showUpload && (
          <button
            onClick={handleGenerateDashboard}
            disabled={loading}
            className="w-full mb-2 px-4 py-2.5 text-sm bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            Generate Dashboard
          </button>
        )}

        <div className="flex items-end gap-2 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-2 focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-500/30 transition-all">              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className={`px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    showUpload
                      ? 'bg-teal-500/20 text-teal-400'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
                  title="Upload file"
                >
                  <Paperclip size={16} />
                  <span className="ml-1 hidden sm:inline">Attach</span>
                </button>
              </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={uploadedData ? "Ask about your data..." : "Type a message..."}
            className="flex-1 bg-transparent px-2 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
