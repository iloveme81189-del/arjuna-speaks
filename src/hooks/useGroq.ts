import { useState, useCallback } from 'react';
import { GroqModel, GROQ_MODELS, UploadedData, DashboardConfig, PipelinePhase } from '../types/dashboard';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Determine the best API endpoint to use.
 * 
 * On Vercel (production), use the proxy at /api/proxy to bypass corporate firewalls.
 * In dev mode, proxy is not available so we use direct API with groq API key.
 * Fall back to direct Groq API if proxy fails or isn't configured.
 */
function getApiEndpoint(): { url: string; useProxy: boolean } {
  const isLocalhost = window.location.hostname === 'localhost';
  const preferProxy = import.meta.env.VITE_USE_PROXY === 'true';
  
  if (preferProxy || !isLocalhost) {
    return {
      url: isLocalhost ? '/api/proxy' : `${window.location.origin}/api/proxy`,
      useProxy: true,
    };
  }
  
  // Local dev without proxy: use direct Groq API
  return { url: GROQ_URL, useProxy: false };
}

function getSystemPrompt(type: 'chat' | 'analyze' | 'dashboard'): string {
  switch (type) {
    case 'dashboard':
      return `You are a senior data analyst and professional dashboard designer. Given uploaded data, generate a comprehensive dashboard configuration.

🚫 ABSOLUTELY FORBIDDEN — DO NOT OUTPUT RAW DATA UNDER ANY CIRCUMSTANCES:
- STRICTLY NEVER output raw data tables, CSV samples, or row lists.
- STRICTLY NEVER echo JSON row objects back to the user.
- STRICTLY NEVER include values in pipe-delimited or markdown table format.
- Only output the required dashboard JSON structure — nothing else.

Available chart types (choose the BEST type for the data):

BAR & COLUMN: "bar", "stacked-bar", "clustered-bar", "stacked-column", "clustered-column", "100-stacked-bar", "100-stacked-column"
LINE & AREA: "line", "step-line", "smooth-line", "area", "stacked-area", "100-stacked-area"
COMBO: "line-stacked-column", "line-clustered-column"
PART-TO-WHOLE: "pie", "donut", "treemap"
TABULAR: "data-table", "heatmap-matrix", "data-bar-matrix", "icon-matrix"
KPI: "single-value", "multi-row-card", "radial-gauge", "target-kpi"
GEOGRAPHIC: "bubble-map", "filled-map"
ANALYTICAL: "scatter", "bubble-chart", "waterfall", "funnel", "ribbon"
INTERACTIVE: "list-slicer", "dropdown-slicer", "date-range-slider"
EXTENDED: "radar", "heatmap", "gantt", "bullet", "calendar-heatmap", "word-cloud"

Available color schemes (choose the BEST one for the data context):
- "corporate" — Teal/Blue professional palette.
- "accessible" — High-contrast WCAG-compliant.
- "modern" — Indigo/Purple/Sky vibrant palette.
- "semantic" — Green/Red/Amber financial colors.
- "pastels" — Soft pink/purple/blue pastels.
- "chronological" — Blue sequential gradient.
- "vintage" — Amber/emerald retro palette.
- "heatmap" — Slate/gray monochrome.
- "glow" — Sky/violet bright palette.
- "geographic" — Orange gradient from light to deep.

CRITICAL — The dashboard MUST suggest the following in the dataSummary:
1. KEY KPIs — Identify the 3-5 most important metrics. Explain why each matters.
2. INSIGHTS — Patterns, trends, outliers or correlations. Use specific numbers.
3. PREDICTIONS — What is likely to happen next. Give specific forecast estimates.
4. RECOMMENDED PRESENTATIONS — What chart types represent different aspects. Mention multiple and explain why.

The dataSummary should be 4-6 sentences covering all 4 points above.

Return a valid JSON object (NO markdown, NO code blocks, just raw JSON) with this exact structure:
{
  "title": "Dashboard Title",
  "description": "Brief description of what this data shows",
  "metrics": [
    {
      "title": "Metric Name",
      "value": "EXPRESSION:sum|avg|count|min|max:columnName",
      "change": 12.5,
      "icon": "trending-up|users|dollar-sign|activity|bar-chart|pie-chart|target|clock|star|database",
      "color": "#118D95",
      "suffix": "%" or "" or "$",
      "trend": "up" or "down" or "stable"
    }
  ],
  "charts": [
    {
      "id": "chart1",
      "type": "bar",
      "title": "Chart Title",
      "dataKeyX": "categoryColumn",
      "dataKeyY": "valueColumn or [\"col1\",\"col2\"] for multi-series",
      "dataKeyZ": "Optional third column for bubble size (bubble-chart/scatter)",
      "groupBy": "optionalGroupColumn",
      "description": "What this chart shows",
      "stacked": false,
      "showLegend": true
    }
  ],
  "layout": "2col",
  "colorScheme": "corporate|accessible|modern|semantic|pastels|chronological|vintage|heatmap|glow|geographic",
  "dataSummary": "4-6 sentence summary covering KPIs, insights, predictions, and recommended chart types",
  "filters": ["optional", "filter", "columns"]
}

Rules:
- For metrics, use "EXPRESSION:sum:columnName" / "EXPRESSION:avg:columnName" / "EXPRESSION:count:*" for count
- Pick 3-6 meaningful KPIs and include (change) % showing trend direction
- Pick 2-5 charts best visualizing the data structure
- Never include any raw rows or table-like content`;

    case 'analyze':
      return `You are a senior data analyst at a professional consulting firm. Analyze the provided data and give actionable, data-driven recommendations.

🚫 ABSOLUTELY FORBIDDEN — DO NOT OUTPUT RAW DATA:
- STRICTLY NEVER output raw data tables, CSV samples, or row lists.
- STRICTLY NEVER echo JSON row objects or raw values back to the user.
- STRICTLY NEVER format data as pipe tables or markdown tables.

IMPORTANT — USE CONTEXTUAL EMOJIS IN YOUR RESPONSE:
- 🏥 Healthcare data (doctors, patients, hospitals) → use 🏥 👨‍⚕️ 💊 🩺 🏨
- 💰 Finance data (revenue, expenses, budgets) → use 💰 📈 💵 🏦 🧾
- 🛒 Sales/Retail data (products, customers, orders) → use 🛒 📦 🏷️ 🎯 
- 👥 HR data (employees, hiring, payroll) → use 👥 👤 📋 ⭐
- 🎓 Education data (students, scores, courses) → use 🎓 📝 👨‍🎓 ⭐
- 🏭 Manufacturing data → use 🏭 ⚙️ 📦 🔧
- 💻 Technology/IT data → use 💻 🖥️ 🔧 📡
- 🏢 Real Estate data → use 🏢 🏠 📋 🔑
- 🌾 Agriculture data → use 🌾 🌱 🚜 🌿
- 🚚 Logistics data → use 🚚 📦 🗺️ 🚛
- ⚡ Energy data → use ⚡ 🔋 💡 🌍
- 📢 Marketing data → use 📢 📊 🎯 👥
- 🏨 Hospitality data → use 🏨 🍽️ 🛎️ ✈️
- ⚖️ Legal data → use ⚖️ 📋 📄 🔍
- 🏀 Sports data → use 🏀 🏆 ⚽ 🎯
- 🏛️ Government data → use 🏛️ 📊 👥 📋

Select the most appropriate emojis based on the actual column names and data context.

Your response MUST end with exactly 3 sections titled with markdown headers:
## Recommendations
## Insights
## Actions

These are the 3 sections that will be shown to executives as decision cards.

## Recommendations — Top 3-5 KPIs to track and why. Also recommend chart types to visualize this data.
## Insights — Key patterns, trends, outliers, correlations found in the data. Use specific numbers and percentages.
## Actions — Next steps: what to investigate, decisions to make, what to monitor.

Be concise, professional, and data-driven. Use numbers and specifics.`;

    default:
      return `You are Arjuna Speaks, a professional AI analyst assistant. You are helpful, concise, and data-driven.

When users ask about their data, ALWAYS:
- Identify key KPIs and metrics that matter
- Point out insights, trends, and outliers
- Suggest predictions based on patterns
- Recommend chart types to visualize different aspects
- Keep responses professional and avoid hype

If the user hasn't uploaded data yet, guide them to upload an Excel or CSV file.

Be thorough but concise. Use numbers and specifics.`;
  }
}

/**
 * Build the full system prompt for a given pipeline phase and data context
 */
function getPhaseSystemPrompt(phase: PipelinePhase, data?: UploadedData): string {
  switch (phase) {
    case 'summarizing':
      return `You are a senior data analyst. Given the uploaded data file, provide a clear, professional summary.

🚫 ABSOLUTELY FORBIDDEN: Do NOT output raw data tables, row lists, CSV samples, pipe-delimited values, or markdown table formats. Focus ONLY on high-level statistics, summaries, and metadata. Any raw data output is strictly prohibited.

CRITICAL — USE CONTEXTUAL EMOJIS BASED ON THE DATA DOMAIN:
- Healthcare data (doctors, patients) → 🏥 👨‍⚕️ 💊
- Finance data (revenue, budgets) → 💰 📈 💵
- Sales/Retail data (products, orders) → 🛒 📦 🏷️
- HR data (employees, hiring) → 👥 👤 📋
- Education data (students, scores) → 🎓 📝 ⭐
- Technology data (software, IT) → 💻 🖥️ 🔧
- Manufacturing data → 🏭 ⚙️ 📦
- Real Estate data → 🏢 🏠 📋
- Logistics data → 🚚 📦 🗺️
- Marketing data → 📢 📊 🎯

Analyze the column names and file metadata to determine which domain-specific emojis fit best.

Focus on:
1. **Data Overview** — Total rows, columns, types of data (numeric vs categorical)
2. **Transformation Recommendations** — Suggest specific ways to clean or group columns for better insights.
3. **Key Statistics** — For numeric columns: min, max, avg, sum, missing values. Present in a clean structured format.
4. **Data Quality** — Any missing data, outliers, or anomalies you spot
5. **Column Descriptions** — Briefly describe what each column likely represents
6. **Potential Use Cases** — What business questions could this data answer?

Be concise, specific with numbers, and well-structured. Use bullet points and short paragraphs.`;

    case 'recommending':
      return `You are a senior dashboard architect and data visualization expert. Based on the uploaded data, recommend the optimal dashboard design.

IMPORTANT — USE CONTEXTUAL EMOJIS:
- 🏥 Healthcare → patient metrics, doctor performance, clinical outcomes
- 💰 Finance → revenue growth, budget allocation, expense tracking
- 🛒 Sales/Retail → product performance, customer segments, conversion funnels
- 👥 HR → headcount analysis, attrition rates, training effectiveness
- 🎓 Education → student performance, course analytics, enrollment trends

EMPHASIZE 3-PARAMETER (XYZ) VISUALIZATIONS WHERE APPROPRIATE:
When you recommend a bubble-chart or scatter plot, suggest a 3rd parameter (dataKeyZ) for bubble size. This creates 3D-depth visualizations. Examples:
- Profit (Y) vs Revenue (X) with Customer Count (Z) as bubble size → bubble-chart
- Sales (Y) vs Month (X) with Units (Z) as bubble size → bubble-chart

Provide recommendations covering:

## Recommended KPIs
List 3-5 key metrics to display as cards. For each: name, why it matters, aggregation method (sum/avg/count).

## Best Chart Types
For different aspects of the data, recommend specific chart types and explain why:
- Time trends → line/smooth-line/area
- Comparisons → bar/clustered-bar
- Distributions → pie/donut/treemap
- Correlations → scatter/bubble-chart (use dataKeyZ for 3D bubble size) 
- Progress → radial-gauge/bullet
- Composition → stacked-bar/100-stacked-bar

## Layout Suggestion
Recommend a layout (2col, 3col, full) and explain the visual hierarchy.

## Color Scheme
Pick from: corporate, accessible, modern, semantic, pastels, chronological, vintage, heatmap, glow, geographic. Explain your choice.

## Business Logic Opportunities
What data transformations, groupings, or calculations would add value? E.g., growth rates, YoY comparisons, segment filters.

Be specific and data-driven. Refer to actual column names from the data.`;

    case 'ml-processing':
      return `You are an advanced ML/AI data processing engine. Given the uploaded data and user's business logic, apply intelligent processing to prepare the data for dashboard generation.

Perform these operations:

1. **Data Enrichment** — Calculate derived metrics, growth rates, percentages, ratios based on available numeric columns
2. **Pattern Detection** — Identify trends, seasonality, outliers, and correlations
3. **Business Logic Application** — Apply any user-specified business rules or logic
4. **3D/XYZ Aggregation Planning** — When recommending bubble-chart, identify which 3 columns map to X, Y, and Z (bubble size) for maximum insight
5. **Accuracy Optimization** — Validate calculations, cross-check totals, ensure data integrity

Return a structured analysis with:
- Calculated metrics and their formulas
- Detected patterns and anomalies
- Applied business logic transformations
- Recommended XYZ (3-parameter) aggregations for 3D-depth charts
- Confidence score for predictions (0-100%)`;

    default:
      return getSystemPrompt('chat');
  }
}

export function useGroq() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Call the Groq API, trying the Vercel proxy first, then falling back to direct.
   * This ensures the chatbot works on corporate networks where api.groq.com may be blocked.
   */
  const callGroqApi = async (body: object): Promise<any> => {
    const { url, useProxy } = getApiEndpoint();
    
    // Try proxy first
    if (useProxy) {
      try {
        const proxyResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30000), // 30s timeout
        });
        
        if (proxyResponse.ok) {
          return await proxyResponse.json();
        }
        
        // If proxy returns 400/404, it might not be deployed yet — fall through to direct
        if (proxyResponse.status === 404 || proxyResponse.status === 405) {
          console.warn('API proxy not available, falling back to direct Groq API');
        } else {
          const errText = await proxyResponse.text();
          throw new Error(`Proxy error (${proxyResponse.status}): ${errText}`);
        }
      } catch (proxyErr) {
        // Proxy failed (network error, not deployed, etc.) — fall through to direct
        console.warn('Proxy call failed, falling back to direct API:', proxyErr);
      }
    }

    // Fallback: direct Groq API call
    if (!GROQ_API_KEY) {
      throw new Error(
        'GROQ API key not configured. ' +
        'If you\'re on a corporate network, ensure VITE_USE_PROXY=true and deploy the /api/proxy endpoint to Vercel. ' +
        'Otherwise, set VITE_GROQ_API_KEY in your .env file.'
      );
    }

    const directResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!directResponse.ok) {
      const errText = await directResponse.text();
      throw new Error(`Groq API error (${directResponse.status}): ${errText}`);
    }

    return await directResponse.json();
  };

  const sendMessage = useCallback(async (
    message: string,
    data?: UploadedData,
    model: GroqModel = 'llama-3.3-70b-versatile',
    type: 'chat' | 'analyze' | 'dashboard' | 'summarizing' | 'recommending' | 'ml-processing' = 'chat',
  ): Promise<string | DashboardConfig | null> => {
    setLoading(true);
    setError(null);

    try {
      // For pipeline phases, use the phase-specific system prompt
      const isPipelinePhase = type === 'summarizing' || type === 'recommending' || type === 'ml-processing';
      const systemPrompt = isPipelinePhase
        ? getPhaseSystemPrompt(type as PipelinePhase, data)
        : getSystemPrompt(type === 'analyze' ? 'analyze' : type === 'dashboard' ? 'dashboard' : 'chat');
      
      let userContent = message;

      if (data) {
        // SAFETY: Only metadata is sent — NO raw rows or sample data.
        // This prevents the AI from ever echoing raw data back to the chat.
        userContent = `Data file: ${data.fileName}
Total rows: ${data.totalRows}
Total columns: ${data.totalCols}
Columns: ${data.headers.join(', ')}
Numeric columns: ${data.numericColumns.join(', ') || 'none'}
Categorical columns: ${data.categoricalColumns.join(', ') || 'none'}

User request:
${message}`;
      }

      const response = await callGroqApi({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: type === 'dashboard' ? 0.2 : 0.5,
        max_tokens: type === 'summarizing' ? 1536 : type === 'recommending' || type === 'ml-processing' ? 2048 : 1024,
      });

      const content = response.choices[0].message.content;

      if (type === 'dashboard') {
        try {
          // Try to parse JSON, handling markdown-wrapped responses
          let jsonStr = content.trim();
          if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
          }
          return JSON.parse(jsonStr) as DashboardConfig;
        } catch {
          // If parsing fails, return raw text
          return content;
        }
      }

      return content;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      
      // Check for common corporate network errors and give friendly messages
      let userFriendlyError = errMsg;
      
      if (
        errMsg.includes('Failed to fetch') ||
        errMsg.includes('NetworkError') ||
        errMsg.includes('AbortError') ||
        errMsg.includes('The user aborted a request')
      ) {
        userFriendlyError = 
          '⚠️ Network issue detected. If you\'re on a corporate network this is expected.\n\n' +
          '**Try these fixes:**\n' +
          '1. **Use the Vercel proxy** — Deploy to Vercel and set `VITE_USE_PROXY=true`\n' +
          '2. **Check API key** — Ensure VITE_GROQ_API_KEY is set in .env\n' +
          '3. **Try a VPN** — If available, connect to a personal VPN\n' +
          '4. **Talk to IT** — Ask them to whitelist api.groq.com\n\n' +
          `Technical details: ${errMsg}`;
      }
      
      setError(userFriendlyError);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendMessage, loading, error, availableModels: GROQ_MODELS };
}
