import { motion } from 'framer-motion';
import { UploadedData } from '../types/dashboard';
import { Table, Hash, AlignLeft } from 'lucide-react';

interface DataPreviewProps {
  data: UploadedData;
}

export function DataPreview({ data }: DataPreviewProps) {
  const previewRows = data.rows.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden mb-4"
    >
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table size={16} className="text-purple-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{data.fileName}</span>
          </div>
          <span className="text-xs text-gray-500">{data.totalRows} rows × {data.totalCols} cols</span>
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

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
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
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                {data.headers.map((header) => (
                  <td key={header} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {row[header]?.toString() || '—'}
                  </td>
                ))}
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
