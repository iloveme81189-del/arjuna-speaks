import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Smile, Meh, Frown, TrendingUp, TrendingDown, Brain } from 'lucide-react';
import { useGroq } from '../hooks/useGroq';
import type { UXData } from '../hooks/useRealtimeData';

interface SentimentAnalysisProps {
  currentData: UXData;
}

export function SentimentAnalysis({ currentData }: SentimentAnalysisProps) {
  const [sentiment, setSentiment] = useState<string>('positive');
  const [score, setScore] = useState(78);
  const { sendMessage, loading } = useGroq();
  const mountedRef = useRef(true);

  const parseSentimentResponse = (response: string) => {
    const lower = response.toLowerCase();
    let newSentiment = 'neutral';
    if (lower.includes('positive')) newSentiment = 'positive';
    else if (lower.includes('negative')) newSentiment = 'negative';

    let newScore = 78;
    const scoreMatch = response.match(/\b(\d{1,3})\b/);
    if (scoreMatch) {
      const parsed = parseInt(scoreMatch[1]);
      if (parsed >= 0 && parsed <= 100) newScore = parsed;
    }

    return { sentiment: newSentiment, score: newScore };
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Fetch sentiment once on mount (avoids burning through free GROQ quota)
  useEffect(() => {
    const loadSentiment = async () => {
      const dataPreview = {
        activeUsers: currentData.activeUsers,
        avgSessionDuration: currentData.avgSessionDuration,
        ctr: currentData.ctr,
        conversion: currentData.conversion,
      };
      const response = await sendMessage(
        `Analyze the overall user sentiment based on these metrics: Active Users: ${dataPreview.activeUsers}, Session Duration: ${dataPreview.avgSessionDuration}min, CTR: ${dataPreview.ctr}%, Conversion: ${dataPreview.conversion}%. Provide a single word (positive/neutral/negative) followed by a sentiment score from 0-100.`,
        undefined,
        'llama3-8b-8192',
        'chat'
      );
      if (response && typeof response === 'string' && mountedRef.current) {
        const parsed = parseSentimentResponse(response);
        setSentiment(parsed.sentiment);
        setScore(parsed.score);
      }
    };

    loadSentiment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sentimentConfig = {
    positive: { icon: Smile, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/30', bar: 'bg-green-500' },
    neutral: { icon: Meh, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/30', bar: 'bg-yellow-500' },
    negative: { icon: Frown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30', bar: 'bg-red-500' },
  };

  const config = sentimentConfig[sentiment as keyof typeof sentimentConfig] || sentimentConfig.neutral;
  const SentimentIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Brain size={18} className="text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI Sentiment</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={`w-16 h-16 rounded-full ${config.bg} flex items-center justify-center mb-3`}>
            <SentimentIcon size={32} className={config.color} />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {score}%
          </div>
          <span className={`text-sm font-medium capitalize ${config.color} mb-4`}>
            {sentiment}
          </span>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${config.bar}`}
            />
          </div>

          <div className="flex justify-between w-full mt-2 text-xs text-gray-400">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>

          <div className="flex items-center gap-1 mt-4 text-sm text-gray-500 dark:text-gray-400">
            {score > 60 ? (
              <><TrendingUp size={14} className="text-green-500" /> Users are engaged</>
            ) : (
              <><TrendingDown size={14} className="text-red-500" /> Needs attention</>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
