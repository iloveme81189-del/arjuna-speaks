import { useState, useCallback } from 'react';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const useGroq = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeUX = useCallback(async (data: any, question?: string) => {
    setLoading(true);
    setError(null);

    const systemPrompt = `You are a senior UX researcher and data analyst. Analyze the provided UI/UX metrics and provide actionable insights. Be concise, data-driven, and suggest specific improvements. Format key points with bullet points.`;

    const userContent = question 
      ? `Data: ${JSON.stringify(data)}\n\nQuestion: ${question}`
      : `Analyze this UI/UX data and provide key insights and recommendations:\n${JSON.stringify(data, null, 2)}`;

    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', // or 'mixtral-8x7b-32768'
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
          ],
          temperature: 0.3,
          max_tokens: 1024,
        }),
      });

      if (!response.ok) throw new Error('Groq API error');
      
      const result = await response.json();
      return result.choices[0].message.content;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyzeUX, loading, error };
};
