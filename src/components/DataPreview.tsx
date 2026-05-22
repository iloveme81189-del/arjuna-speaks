import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UploadedData } from '../types/dashboard';
import { Table, Hash, AlignLeft, Edit3, Check, X } from 'lucide-react';

interface DataPreviewProps {
  data: UploadedData;
  onDataUpdate?: (updatedData: UploadedData) => void;
}

interface EditCell {
  rowIdx: number;
  header: string;
  value: string;
}

export function DataPreview({ data, onDataUpdate }: DataPreviewProps) {
  const previewRows = data.rows.slice(0, 5);
  const [editing, setEditing] = useState<EditCell | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleCellClick = useCallback((rowIdx: number, header: string, currentValue: string | number) => {
    setEditing({ rowIdx, header, value: String(currentValue) });
  }, []);

  const handleCellSave = useCallback(() => {
    if (!editing || !onDataUpdate) return;

    const newRows = data.rows.map((row, idx) => {
      if (idx === editing.rowIdx) {
        const parsed: string | number = isNaN(Number(editing.value)) || editing.value.trim() === ''
          ? editing.value
          : Number(editing.value);
        return { ...row, [editing.header]: parsed };
      }
      return row;
    });

    // Keep original column type classification to avoid breaking downstream components
    const newRowsData = newRows as typeof data.rows;

    const updatedData: UploadedData = {
      ...data,
      rows: newRows,
    };

    onDataUpdate(updatedData);
    setEditing(null);
  }, [editing, data, onDataUpdate]);

  const handleCellCancel = useCallback(() => {
    setEditing(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCellSave();
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  }, [handleCellSave, handleCellCancel]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-4"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table size={16} className="text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{data.fileName}</span>
          </div>
          <div className="flex items-center gap-3">
            {onDataUpdate && (
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <Edit3 size={10} />
                Click cells to edit
              </span>
            )}
            <span className="text-xs text-gray-500">{data.totalRows} rows × {data.totalCols} cols</span>
          </div>
        </div>

        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <Hash size={12} className="text-blue-500" />
            <span className="text-xs text-gray-500">{data.numericColumns.length} numeric</span>
          </div>
          <div className="flex items-center gap-1.5">
            <AlignLeft size={12} className="text-orange-500" />
            <span className="text-xs text-gray-500">{data.categoricalColumns.length} categories</span>
          </div>
        </div>

        {data.numericColumns.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.numericColumns.map((col) => (
              <span key={col} className="px-2 py-0.5 text-xs rounded-full bg-blue-500/10 text-blue-400">
                {col}
              </span>
            ))}
          </div>
        )}
        {data.categoricalColumns.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {data.categoricalColumns.map((col) => (
              <span key={col} className="px-2 py-0.5 text-xs rounded-full bg-orange-500/10 text-orange-400">
                {col}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="px-3 py-2 text-left font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap w-8">
                #
              </th>
              {data.headers.map((header) => (
                <th
                  key={header}
                  className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0 group">
                <td className="px-3 py-2 text-gray-400 dark:text-gray-500 text-[10px] select-none">
                  {i + 1}
                </td>
                {data.headers.map((header) => {
                  const isEditing = editing?.rowIdx === i && editing?.header === header;
                  const value = row[header];
                  const displayValue = value?.toString() || '—';
                  const isNumeric = typeof value === 'number';

                  return (
                    <td
                      key={header}
                      className={`px-3 py-2 whitespace-nowrap transition-colors ${
                        isEditing
                          ? 'p-0'
                          : onDataUpdate
                          ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30 group-hover:ring-1 group-hover:ring-inset group-hover:ring-blue-200 dark:group-hover:ring-blue-800/30'
                          : ''
                      } ${isNumeric ? 'text-right tabular-nums text-gray-800 dark:text-gray-200 font-medium' : 'text-gray-700 dark:text-gray-300'}`}
                      onClick={() => !isEditing && onDataUpdate && handleCellClick(i, header, value ?? '')}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-0.5 px-1">
                          <input
                            ref={inputRef}
                            type="text"
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            onKeyDown={handleKeyDown}
                            onBlur={handleCellSave}
                            className="flex-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-400 dark:border-blue-600 rounded px-1.5 py-1 text-xs text-gray-900 dark:text-white outline-none min-w-[60px]"
                          />
                          <button
                            onClick={handleCellSave}
                            className="p-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-800/40 text-blue-600 dark:text-blue-400"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={handleCellCancel}
                            className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>{displayValue}</span>
                          {onDataUpdate && (
                            <Edit3 size={8} className="opacity-0 group-hover:opacity-40 text-gray-400 transition-opacity flex-shrink-0" />
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.totalRows > 5 && (
        <div className="px-3 py-2 text-center text-xs text-gray-500 border-t border-gray-200 dark:border-gray-800">
          Showing 5 of {data.totalRows} rows
        </div>
      )}
    </motion.div>
  );
}
