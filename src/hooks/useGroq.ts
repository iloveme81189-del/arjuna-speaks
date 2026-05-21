import { useState, useCallback } from 'react';
import { GroqModel, GROQ_MODELS, UploadedData, DashboardConfig, PipelinePhase } from '../types/dashboard';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getSystemPrompt(type: 'chat' | 'analyze' | 'dashboard'): string {
  switch (type) {
    case 'dashboard':
      return `You are a senior data analyst and professional dashboard designer. Given uploaded data, generate a comprehensive dashboard configuration.

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
- "corporate" — Teal/Blue professional palette. Use for executive dashboards, financial reports, business intelligence.
- "accessible" — High-contrast WCAG-compliant. Use for accessibility-focused or public-facing dashboards.
- "modern" — Indigo/Purple/Sky vibrant palette. Use for SaaS metrics, tech startups, product analytics.
- "semantic" — Green/Red/Amber financial colors. Use for KPI tracking, P&L, budget vs actual.
- "pastels" — Soft pink/purple/blue pastels. Use for multi-slice charts (pie, donut, stacked bar) with many categories.
- "chronological" — Blue sequential gradient. Use for time-series data, trend lines, historical comparisons.
- "vintage" — Amber/emerald retro palette. Use for infographics, historical data, classic reports.
- "heatmap" — Slate/gray monochrome. Use for density maps, correlation matrices, data tables.
- "glow" — Sky/violet bright on dark. Use for dark-mode dashboards, operational monitoring.
- "geographic" — Orange gradient from light to deep. Use for regional maps, density choropleths.

Chart-type-specific color guidance (use these for reference when generating chart configs):
- Bar/Column charts: Use the colorScheme's primary colors for single-series, multiple colors for multi-series
- Pie/Donut charts: Use distinct colors from the colorScheme (one per slice, avoid adjacent similar hues)
- Line/Area charts: Use a single strong color from the scheme for the line; fill with lighter opacity
- Treemap: Use gradient progression of the colorScheme from light to dark for hierarchy
- Scatter/Bubble: Use vibrant contrast colors for different groups
- Heatmap: Use sequential intensity from light to dark within the scheme
- Funnel: Use a single hue progressively getting darker at each stage
- Gauge/Bullet: Use semantic colors (green for good, red for bad) from the semantic scheme
- Data tables: Use minimal slate/gray tones, highlight headers with scheme's primary

CRITICAL — The dashboard MUST suggest the following in the dataSummary:
1. KEY KPIs — Identify the 3-5 most important metrics for the business context. Explain why each matters.
2. INSIGHTS — What patterns, trends, outliers or correlations exist in the data? Be specific with numbers.
3. PREDICTIONS — Based on trends in the data, what is likely to happen next? Give specific forecast estimates.
4. RECOMMENDED PRESENTATIONS — What chart types best represent different aspects of this data? Mention multiple and explain why each is suited.

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
      "dataKeyY": "valueColumn or ["col1","col2"] for multi-series",
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
- For metrics, use "EXPRESSION:sum:columnName" for sums, "EXPRESSION:avg:columnName" for averages, "EXPRESSION:count:*" for count
- Pick 3-6 meaningful KPIs — each with a (change) percentage showing trend direction
- Pick 2-5 charts that best visualize the data structure
- For categorical X axes with few categories: use bar/pie/donut
- For time-series or sequential X axes: use line/area
- For comparing parts of a whole: use pie/donut/treemap/100-stacked-bar
- For comparing multiple values across categories: use bar/stacked-bar
- For showing trends over time: use line/smooth-line/area
- For showing distribution: use scatter/heatmap
- For showing hierarchical data: use treemap/radar
- For showing progress toward goals: use radial-gauge/bullet/target-kpi
- Use meaningful, professional titles
- Include colorScheme matching the data context
- Always include trend direction (change %) for each metric to indicate KPI movement`;

    case 'analyze':
      return `You are a senior data analyst at a professional consulting firm. Analyze the provided data and give actionable, data-driven recommendations.

Your response MUST end with exactly 3 sections titled with markdown headers:
## Recommendations
## Insights  
## Actions

These are the 3 sections that will be shown to executives as decision cards.

## Recommendations — What specific actions should be taken? What are the top 3-5 KPIs to track and why? What chart types and color schemes would best visualize this data?
## Insights — Key patterns, trends, outliers, correlations found in the data. Use specific numbers and percentages.
## Actions — Next steps: what to investigate further, what decisions to make, what to monitor.

Be concise, professional, and data-driven. Use numbers and specifics.`;

    default:
      return `You are Arjuna Speaks, a professional AI data intelligence assistant. You are helpful, concise, and data-driven.

When users ask about their data, ALWAYS:
- Identify key KPIs and metrics that matter
- Point out insights, trends, and outliers
- Suggest predictions based on patterns
- Recommend the best chart types to visualize different aspects
- Keep responses professional and avoid hype

If the user hasn't uploaded data yet, guide them to upload an Excel or CSV file using drag & drop or the attach button.

Be thorough but concise. Use numbers and specifics.`;
  }
}

/**
 * Build the full system prompt for a given pipeline phase and data context
 */
function getPhaseSystemPrompt(phase: PipelinePhase, data?: UploadedData): string {
  switch (phase) {
    case 'summarize':
      return `You are a senior data analyst. Given the uploaded data file, provide a clear, professional summary.

Focus on:
1. **Data Overview** — Total rows, columns, types of data (numeric vs categorical)
2. **Key Statistics** — For numeric columns: min, max, avg, sum, missing values. Present in a clean structured format.
3. **Data Quality** — Any missing data, outliers, or anomalies you spot
4. **Column Descriptions** — Briefly describe what each column likely represents
5. **Potential Use Cases** — What business questions could this data answer?

Be concise, specific with numbers, and well-structured. Use bullet points and short paragraphs.`;

    case 'recommend':
      return `You are a senior dashboard architect and data visualization expert. Based on the uploaded data, recommend the optimal dashboard design.

Provide recommendations covering:

## Recommended KPIs
List 3-5 key metrics to display as cards. For each: name, why it matters, aggregation method (sum/avg/count).

## Best Chart Types
For different aspects of the data, recommend specific chart types and explain why:
- Time trends → line/smooth-line/area
- Comparisons → bar/clustered-bar
- Distributions → pie/donut/treemap
- Correlations → scatter/heatmap
- Progress → radial-gauge/bullet
- Composition → stacked-bar/100-stacked-bar

## Layout Suggestion
Recommend a layout (2col, 3col, full) and explain the visual hierarchy.

## Color Scheme
Pick from: corporate, accessible, modern, semantic, pastels, chronological, vintage, heatmap, glow, geographic. Explain your choice.

## Business Logic Opportunities
What data transformations, groupings, or calculations would add value? E.g., growth rates, YoY comparisons, segment filters.

Be specific and data-driven. Refer to actual column names from the data.`;

    case 'ml-process':
      return `You are an advanced ML/AI data processing engine. Given the uploaded data and user's business logic, apply intelligent processing to prepare the data for dashboard generation.

Perform these operations:

1. **Data Enrichment** — Calculate derived metrics, growth rates, percentages, ratios based on available numeric columns
2. **Pattern Detection** — Identify trends, seasonality, outliers, and correlations
3. **Business Logic Application** — Apply any user-specified business rules or logic
4. **Aggregation Planning** — Determine the best groupings and aggregations for visualization
5. **Accuracy Optimization** — Validate calculations, cross-check totals, ensure data integrity

Return a structured analysis with:
- Calculated metrics and their formulas
- Detected patterns and anomalies
- Applied business logic transformations
- Recommended aggregations for charts
- Confidence score for predictions (0-100%)`;

    default:
      return getSystemPrompt('chat');
  }
}

export function useGroq() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    data?: UploadedData,
    model: GroqModel = 'llama-3.3-70b-versatile',
    type: 'chat' | 'analyze' | 'dashboard' | 'summarize' | 'recommend' | 'ml-process' = 'chat',
  ): Promise<string | DashboardConfig | null> => {
    if (!GROQ_API_KEY) {
      setError('GROQ API key not configured. Set VITE_GROQ_API_KEY in your environment.');
      return null;
    }

    setLoading(true);
    setError(null);

    // For pipeline phases, use the phase-specific system prompt
    const isPipelinePhase = type === 'summarize' || type === 'recommend' || type === 'ml-process';
    const systemPrompt = isPipelinePhase
      ? getPhaseSystemPrompt(type as PipelinePhase, data)
      : getSystemPrompt(type === 'analyze' ? 'analyze' : type === 'dashboard' ? 'dashboard' : 'chat');
    
    let userContent = message;

    if (data) {
      const dataPreview = {
        fileName: data.fileName,
        totalRows: data.totalRows,
        totalCols: data.totalCols,
        headers: data.headers,
        numericColumns: data.numericColumns,
        categoricalColumns: data.categoricalColumns,
        sampleRows: data.rows.slice(0, 10),
      };

      if (type === 'dashboard') {
        const basePrompt = getSystemPrompt('dashboard');
        userContent = `Generate a professional dashboard for this data. Return ONLY valid JSON.`;
        const dataContext = `\n\nThe user uploaded "${data.fileName}" with ${data.totalRows} rows and ${data.totalCols} columns.
Columns: ${data.headers.join(', ')}
Numeric: ${data.numericColumns.join(', ') || 'none'}
Categorical: ${data.categoricalColumns.join(', ') || 'none'}`;
        // We need the dashboard prompt + data context
        // Rebuild: use a custom system prompt that includes both
        const dashboardSystemPrompt = getSystemPrompt('dashboard') + dataContext;
        
        try {
          const response = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'system', content: dashboardSystemPrompt },
                { role: 'user', content: userContent },
              ],
              temperature: 0.2,
              max_tokens: 2048,
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API error (${response.status}): ${errText}`);
          }

          const result = await response.json();
          const content = result.choices[0].message.content;
          
          try {
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```')) {
              jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
            }
            return JSON.parse(jsonStr) as DashboardConfig;
          } catch {
            return content;
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          return null;
        } finally {
          setLoading(false);
        }
      }

      // For pipeline phases (summarize, recommend, ml-process) or analyze/chat
      if (isPipelinePhase) {
        userContent = `Data file: ${data.fileName}\nColumns: ${data.headers.join(', ')}\nNumeric: ${data.numericColumns.join(', ') || 'none'}\nCategorical: ${data.categoricalColumns.join(', ') || 'none'}\nTotal rows: ${data.totalRows}\nSample data (first 10 rows):\n${JSON.stringify(dataPreview.sampleRows, null, 2)}\n\n${message}`;
      } else if (type === 'analyze' || type === 'chat') {
        userContent = `Data file: ${data.fileName}\nColumns: ${data.headers.join(', ')}\nSample (${data.totalRows} rows):\n${JSON.stringify(dataPreview.sampleRows, null, 2)}\n\nQuestion: ${message}`;
      }
    }

    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          temperature: type === 'dashboard' ? 0.2 : 0.5,
          max_tokens: type === 'summarize' ? 1536 : type === 'recommend' || type === 'ml-process' ? 2048 : 1024,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API error (${response.status}): ${errText}`);
      }

      const result = await response.json();
      const content = result.choices[0].message.content;

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
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendMessage, loading, error, availableModels: GROQ_MODELS };
}
