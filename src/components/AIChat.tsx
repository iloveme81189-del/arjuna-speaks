import { useState, useRef, useEffect } from 'react';
import { useGroq } from '../hooks/useGroq';
import { FileUpload } from './FileUpload';
import { DataPreview } from './DataPreview';
import {
  Send, Bot, User, Paperclip, Cloud,
  Sparkles, FileSpreadsheet, Copy, ThumbsUp, ThumbsDown,
  Menu, Plus, X, Check, ChevronDown, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatMessage, UploadedData, GroqModel, DashboardConfig, GROQ_MODELS,
} from '../types/dashboard';
import { uploadToDrive, saveDashboardLinkToDrive, isDriveConfigured } from '../services/googleDrive';
import { useChatStore } from '../store/chatStore';

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
  const [showSidebar, setShowSidebar] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<GroqModel>('llama-3.3-70b-versatile');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'uploading' | 'uploaded' | 'error'>('idle');
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  const { sendMessage, loading, error } = useGroq();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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

    // Upload to Google Drive uploads folder
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
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `## ${config.title}\n${config.description || ''}\n\n${config.dataSummary || ''}`,
        timestamp: new Date(),
        metadata: { type: 'dashboard', dashboardConfig: config },
      };
      addMessage(activeSessionId, aiMsg);
      onDashboardGenerated?.(config, uploadedData);

      // Save dashboard link to Drive reports folder
      if (isDriveConfigured()) {
        setDriveStatus('uploading');
        try {
          const dashboardUrl = `${window.location.origin}?dashboard=${encodeURIComponent(config.title)}`;
          const driveFile = await saveDashboardLinkToDrive(config.title, dashboardUrl, config.description);
          setDriveUrl(driveFile.webViewLink);
          setDriveStatus('uploaded');

          // Add a Drive link message
          const driveMsg: ChatMessage = {
            id: (Date.now() + 2).toString(),
            role: 'system',
            content: `📁 Dashboard saved to Google Drive — [View on Drive](${driveFile.webViewLink})`,
            timestamp: new Date(),
          };
          addMessage(activeSessionId, driveMsg);
        } catch {
          setDriveStatus('error');
        }
      }
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

  return (
    <div className={`flex flex-col ${standalone ? 'h-screen' : 'h-[600px]'} bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-lg border border-gray-200/80 dark:border-gray-700/50 overflow-hidden relative`}>
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/40"
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
            className="absolute left-0 top-0 bottom-0 w-[260px] z-50 bg-gray-900 dark:bg-[#0f0f1a] border-r border-gray-800/50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sessions</span>
              {sessions.length < 6 && (
                <button
                  onClick={() => { createSession(); setShowSidebar(false); }}
                  className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-all ${
                    s.id === activeSessionId
                      ? 'bg-teal-600/20 text-teal-300 border border-teal-600/20'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent'
                  }`}
                  onClick={() => { switchSession(s.id); setShowSidebar(false); }}
                >
                  <Bot size={14} className="flex-shrink-0 opacity-60" />
                  <span className="flex-1 truncate text-xs">{s.name}</span>
                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); closeSession(s.id); }}
                      className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-700/50 transition-all"
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

      {/* Header — Minimal like Gemini */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0 bg-white dark:bg-[#1a1a2e]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidebar(true)}
            className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center">
              <Bot size={14} className="text-white dark:text-gray-900" />
            </div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Arjuna Speaks</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Model Picker */}
          <div className="relative">
            <button
              onClick={() => setShowModelPicker(!showModelPicker)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Bot size={11} />
              {GROQ_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}
              <ChevronDown size={10} />
            </button>
            {showModelPicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
                  <div className="px-3 py-1.5 text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Free Models</div>
                  {GROQ_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setSelectedModel(m.id); setShowModelPicker(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${
                        m.id === selectedModel
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
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
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 text-[10px] border border-teal-200 dark:border-teal-800/30">
              <FileSpreadsheet size={12} />
              <span className="truncate max-w-[50px]">{uploadedData.fileName}</span>
            </div>
          )}
          {driveUrl && driveStatus === 'uploaded' && (
            <a
              href={driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-[10px] border border-green-200 dark:border-green-800/30 hover:opacity-80 transition-opacity"
              title="View on Google Drive"
            >
              <Cloud size={11} />
              <ExternalLink size={9} />
            </a>
          )}
        </div>
      </div>

      {/* Messages — Centered like Gemini */}
      <div className="flex-1 overflow-y-auto px-4 py-8 scroll-smooth">
        <div className="max-w-2xl mx-auto space-y-6">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              >
                {msg.role === 'system' ? (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/30 text-xs text-teal-700 dark:text-teal-300 shadow-sm">
                      {msg.content}
                    </div>
                  </div>
                ) : msg.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="flex gap-2 max-w-[75%] items-end">
                      <div className="px-4 py-2.5 rounded-2xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm leading-relaxed">
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                        <User size={13} className="text-white dark:text-gray-200" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Bot size={13} className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="px-4 py-3 rounded-2xl bg-gray-50 dark:bg-[#1e1e30] text-gray-800 dark:text-gray-200 text-sm leading-relaxed border border-gray-100 dark:border-gray-700/30">
                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                          {msg.content}
                        </div>
                        {msg.metadata?.type === 'dashboard' && msg.metadata.dashboardConfig && (
                          <div className="mt-2.5 flex items-center gap-2 text-xs text-teal-500 bg-teal-50 dark:bg-teal-900/20 px-3 py-1.5 rounded-lg border border-teal-200 dark:border-teal-800/30">
                            <Sparkles size={12} />
                            Dashboard generated — view it on the left panel
                          </div>
                        )}
                      </div>
                      {/* Action buttons — subtle, like Gemini */}
                      <div className="flex items-center gap-0.5 mt-1.5 ml-1">
                        <button
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title="Copy"
                        >
                          {copiedId === msg.id ? <Check size={13} className="text-teal-500" /> : <Copy size={13} />}
                        </button>
                        <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Like">
                          <ThumbsUp size={13} />
                        </button>
                        <button className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Dislike">
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
              <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <Bot size={13} className="text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {uploadedData ? 'Analyzing data...' : 'Thinking...'}
                </span>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 text-red-600 dark:text-red-400 text-xs rounded-xl text-center"
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
          <div className="px-4 pb-2 max-w-3xl mx-auto w-full">
            <FileUpload onFileParsed={handleFileParsed} onCancel={() => setShowUpload(false)} />
          </div>
        )}
      </AnimatePresence>

      {/* Data Preview */}
      <AnimatePresence>
        {uploadedData && !showUpload && (
          <div className="px-4 pb-2 max-w-3xl mx-auto w-full">
            <DataPreview data={uploadedData} />
          </div>
        )}
      </AnimatePresence>

      {/* Input Area — Gemini-style centered */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-200/80 dark:border-gray-700/50 flex-shrink-0 bg-white dark:bg-[#1a1a2e]">
        <div className="max-w-3xl mx-auto">
          {uploadedData && !showUpload && (
            <button
              onClick={handleGenerateDashboard}
              disabled={loading}
              className="w-full mb-2.5 px-4 py-2.5 text-sm bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2 shadow-sm"
            >
              <Sparkles size={16} />
              Generate Dashboard
            </button>
          )}

          <div className="flex items-end gap-2 bg-gray-50 dark:bg-[#232340] rounded-2xl border border-gray-200 dark:border-gray-600/50 p-2 focus-within:ring-2 focus-within:ring-teal-500/30 focus-within:border-teal-500/30 transition-all shadow-sm">
            <button
              onClick={() => setShowUpload(!showUpload)}
              className={`p-2 rounded-xl transition-all ${
                showUpload
                  ? 'bg-teal-500/20 text-teal-500'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
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
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none resize-none max-h-[120px]"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-25 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2.5">
            Arjuna Speaks may display inaccurate info. Verify critical data independently.
          </p>
        </div>
      </div>
    </div>
  );
}
