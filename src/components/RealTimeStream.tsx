import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MousePointer, ScrollText, ShoppingCart, AlertCircle } from 'lucide-react';
import { UXEvent } from '../hooks/useRealtimeData';

interface Props {
  events: UXEvent[];
}

const eventIcons = {
  click: <MousePointer size={14} />,
  scroll: <ScrollText size={14} />,
  convert: <ShoppingCart size={14} />,
  error: <AlertCircle size={14} />,
};

const eventColors = {
  click: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
  scroll: 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400',
  convert: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
  error: 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400',
};

export const RealTimeStream: React.FC<<Props> = ({ events }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6 h-[400px] flex flex-col">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Live Events</h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div className={`p-1.5 rounded-md ${eventColors[event.type]}`}>
                {eventIcons[event.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">
                  {event.element}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {event.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase">
                {event.type}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {events.length === 0 && (
          <div className="text-center text-gray-400 py-8 text-sm">Waiting for events...</div>
        )}
      </div>
    </div>
  );
};
