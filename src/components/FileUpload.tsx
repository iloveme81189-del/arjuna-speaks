import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Cloud, Loader2 } from 'lucide-react';
import { UploadedData } from '../types/dashboard';

interface FileUploadProps {
  onFileParsed: (data: UploadedData, file: File) => void;
  onCancel: () => void;
}

export function FileUpload({ onFileParsed, onCancel }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (f: File): boolean => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!ext || !['xlsx', 'xls', 'csv'].includes(ext)) {
      setError('Please upload an Excel (.xlsx, .xls) or CSV (.csv) file');
      return false;
    }
    if (f.size > 500 * 1024 * 1024) {
      setError('File size must be under 500MB');
      return false;
    }
    return true;
  };

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    if (!validateFile(f)) return;

    setFile(f);
    setParsing(true);

    try {
      const { parseExcelFile, parseCSVText } = await import('../utils/fileParser');
      let result;
      if (f.name.endsWith('.csv')) {
        const text = await f.text();
        result = parseCSVText(text, f.name);
      } else {
        result = await parseExcelFile(f);
      }
      onFileParsed(result, f);
    }
    } catch (err) {
      setError((err as Error).message);
      setFile(null);
    } finally {
      setParsing(false);
    }
  }, [onFileParsed]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-xl border-2 border-dashed p-5 transition-all duration-200"
      style={{
        borderColor: dragOver ? '#0D9488' : error ? '#DC2626' : file ? '#059669' : 'rgba(13,148,136,0.25)',
        backgroundColor: dragOver ? 'rgba(13,148,136,0.05)' : 'transparent',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {!file ? (
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${dragOver ? 'bg-teal-500/20 scale-110' : 'bg-gray-100 dark:bg-gray-800'}`}>
            <Upload size={22} className={dragOver ? 'text-teal-500' : 'text-gray-400'} />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {dragOver ? 'Drop your file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Excel (.xlsx, .xls) or CSV — up to 500MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="flex gap-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 text-xs font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-all"
            >
              Browse files
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-all"
            >
              Cancel
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs bg-red-50 dark:bg-red-950/50 px-3 py-1.5 rounded-lg">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </div>
      ) : parsing ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6">
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 size={18} className="animate-spin text-teal-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Processing <strong className="text-gray-700 dark:text-gray-300">{file.name}</strong>...
          </span>
          <span className="text-[10px] text-gray-400">Large files may take a moment</span>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <FileSpreadsheet size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <CheckCircle size={18} className="text-emerald-500" />
        </div>
      )}
    </motion.div>
  );
}
