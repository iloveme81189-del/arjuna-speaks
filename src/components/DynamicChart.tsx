import { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ComposedChart, ScatterChart,
  Scatter, RadialBarChart, RadialBar, Treemap,
} from 'recharts';
import { motion } from 'framer-motion';
import { ChartConfig, CHART_COLORS, ColorScheme } from '../types/dashboard';

const COLORS_BY_SCHEME: Record<string, string[]> = CHART_COLORS;

function TooltipContent({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="bg-white text-gray-800 px-3 py-2 rounded-lg shadow-xl text-xs border border-gray-200">
      <p className="font-medium mb-1 text-gray-900">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
}

interface DynamicChartProps {
  config: ChartConfig;
  data: Record<string, string | number>[];
  colorScheme?: ColorScheme;
  index?: number;
}

export function DynamicChart({ config, data, colorScheme = 'corporate', index = 0 }: DynamicChartProps) {
  const colors = useMemo(() => COLORS_BY_SCHEME[colorScheme] || COLORS_BY_SCHEME.corporate, [colorScheme]);

  const chartData = useMemo((): Record<string, any>[] => {
    if (!data || data.length === 0) return [];

    if (config.groupBy) {
      const groups = [...new Set(data.map((row) => String(row[config.groupBy!])))];
      const dataKeys = Array.isArray(config.dataKeyY) ? config.dataKeyY : [config.dataKeyY];
      return groups.map((group) => {
        const filtered = data.filter((row) => String(row[config.groupBy!]) === group);
        const point: Record<string, any> = { name: group };
        dataKeys.forEach((key) => {
          point[key] = filtered.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
        });
        return point;
      });
    }

    return data.map((row) => ({
      name: String(row[config.dataKeyX] ?? ''),
      ...(Array.isArray(config.dataKeyY)
        ? Object.fromEntries(config.dataKeyY.map((k) => [k, Number(row[k]) || 0]))
        : { value: Number(row[config.dataKeyY]) || 0 }),
      ...(config.dataKeyZ ? { z: Number(row[config.dataKeyZ]) || 0 } : {}),
    }));
  }, [data, config]);

  const renderChart = () => {
    const { type } = config;

    // ——— BAR & COLUMN ———
    if (type === 'bar' || type === 'stacked-bar' || type === 'clustered-bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <Tooltip content={<TooltipContent />} />
            {config.showLegend && <Legend />}
            {Array.isArray(config.dataKeyY) ? (
              config.dataKeyY.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[i % colors.length]}
                  radius={[3, 3, 0, 0]}
                  stackId={config.stacked ? 'stack' : undefined}
                />
              ))
            ) : (
              <Bar dataKey="value" fill={colors[0]} radius={[3, 3, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'stacked-column' || type === 'clustered-column') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <Tooltip content={<TooltipContent />} />
            {config.showLegend && <Legend />}
            {Array.isArray(config.dataKeyY) ? (
              config.dataKeyY.map((key, i) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[i % colors.length]}
                  radius={[3, 3, 0, 0]}
                  stackId={type === 'stacked-column' ? 'stack' : undefined}
                />
              ))
            ) : (
              <Bar dataKey="value" fill={colors[0]} radius={[3, 3, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (type === '100-stacked-bar' || type === '100-stacked-column') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} stackOffset="expand">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
            <Tooltip content={<TooltipContent />} />
            <Legend />
            {(Array.isArray(config.dataKeyY) ? config.dataKeyY : ['value']).map((key, i) => (
              <Bar key={key} dataKey={key} stackId="stack" fill={colors[i % colors.length]} radius={[2, 2, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // ——— LINE & AREA ———
    if (type === 'line' || type === 'step-line' || type === 'smooth-line') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <Tooltip content={<TooltipContent />} />
            {config.showLegend && <Legend />}
            {(Array.isArray(config.dataKeyY) ? config.dataKeyY : ['value']).map((key, i) => (
              <Line
                key={key}
                type={type === 'step-line' ? 'stepAfter' : type === 'smooth-line' ? 'monotone' : 'linear'}
                dataKey={key}
                stroke={colors[i % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[i % colors.length], r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (type === 'area' || type === 'stacked-area' || type === '100-stacked-area') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} stackOffset={type === '100-stacked-area' ? 'expand' : undefined}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <Tooltip content={<TooltipContent />} />
            <Legend />
            {(Array.isArray(config.dataKeyY) ? config.dataKeyY : ['value']).map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                fill={colors[i % colors.length]}
                fillOpacity={0.2}
                strokeWidth={2}
                stackId={type !== 'area' ? 'stack' : undefined}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // ——— COMBO ———
    if (type === 'line-stacked-column' || type === 'line-clustered-column') {
      const dataKeys = Array.isArray(config.dataKeyY) ? config.dataKeyY : ['value'];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <Tooltip content={<TooltipContent />} />
            <Legend />
            {dataKeys.map((key, i) =>
              i < dataKeys.length - 1 ? (
                <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[2, 2, 0, 0]} stackId={type === 'line-stacked-column' ? 'stack' : undefined} />
              ) : (
                <Line key={key} type="monotone" dataKey={key} stroke={colors[colors.length - 1]} strokeWidth={2} dot={{ r: 3 }} />
              )
            )}
          </ComposedChart>
        </ResponsiveContainer>
      );
    }

    // ——— PIE / DONUT ———
    if (type === 'pie' || type === 'donut') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={type === 'donut' ? 50 : 0}
              outerRadius={90}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              paddingAngle={2}
            >
              {chartData.map((_, i) => (
                <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipContent />} />
            {config.showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // ——— TREEMAP ———
    if (type === 'treemap') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={chartData}
            dataKey="value"
            nameKey="name"
            stroke="#1e293b"
            fill={colors[0]}
            content={<CustomTreemapContent colors={colors} />}
          >
            <Tooltip content={<TooltipContent />} />
          </Treemap>
        </ResponsiveContainer>
      );
    }

    // ——— SCATTER / BUBBLE (3-param XYZ) ———
    if (type === 'scatter' || type === 'bubble-chart') {
      const isBubble = type === 'bubble-chart';
      const maxZ = isBubble && config.dataKeyZ
        ? Math.max(...chartData.map(d => Number(d.z) || 0), 1)
        : 1;
      return (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} name={config.dataKeyX} />
            <YAxis dataKey="value" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} name={String(config.dataKeyY)} />
            <Tooltip content={
              isBubble && config.dataKeyZ
                ? ({ active, payload }: any) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white text-gray-800 px-3 py-2 rounded-lg shadow-xl text-xs border border-gray-200">
                        <p className="font-medium mb-1 text-gray-900">{d.name}</p>
                        <p style={{ color: colors[0] }}>X ({config.dataKeyX}): {d.name}</p>
                        <p style={{ color: colors[1] }}>Y ({config.dataKeyY}): {typeof d.value === 'number' ? d.value.toLocaleString() : d.value}</p>
                        {d.z !== undefined && <p style={{ color: colors[2] }}>Z ({config.dataKeyZ}): {d.z.toLocaleString()}</p>}
                      </div>
                    );
                  }
                : <TooltipContent />
            } />
            <Scatter
              data={chartData}
              fill={colors[0]}
              shape={isBubble ? (props: any) => {
                const { cx, cy, fill } = props;
                const zVal = Number(props?.payload?.z) || 0;
                const size = isBubble && maxZ > 0
                  ? Math.max(10, (zVal / maxZ) * 60)
                  : 20;
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={size} fill={colors[0]} fillOpacity={0.6} stroke={colors[0]} strokeWidth={1} />
                    <circle cx={cx} cy={cy} r={size * 0.7} fill={colors[1]} fillOpacity={0.4} />
                    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={Math.min(size * 0.5, 14)} fontWeight="bold">
                      {zVal > 0 ? (zVal >= 1000 ? (zVal / 1000).toFixed(1) + 'k' : zVal.toFixed(0)) : ''}
                    </text>
                  </g>
                );
              } : 'circle'}
            />
          </ScatterChart>
        </ResponsiveContainer>
      );
    }

    // ——— FUNNEL ———
    if (type === 'funnel' || type === 'waterfall') {
      const funnelData = [...chartData].reverse();
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} width={80} />
            <Tooltip content={<TooltipContent />} />
            <Bar dataKey="value" fill={colors[0]} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // ——— RADIAL GAUGE ———
    if (type === 'radial-gauge' || type === 'target-kpi') {
      const targetVal = config.targetValue || 100;
      const gaugeData = chartData.slice(0, 1).map((d) => ({
        name: d.name,
        value: Math.min(Number(d.value) || 0, targetVal),
        fullMark: targetVal,
      }));
      return (
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%" cy="50%" innerRadius="30%" outerRadius="90%"
            barSize={15} data={gaugeData}
            startAngle={180} endAngle={0}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={colors[0]}
              label={{ fill: '#fff', fontSize: 14, position: 'center' }}
            />
            <Legend />
          </RadialBarChart>
        </ResponsiveContainer>
      );
    }

    // ——— RADAR ———
    if (type === 'radar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <Tooltip content={<TooltipContent />} />
            <Legend />
            <Bar dataKey="value" fill={colors[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // ——— HEATMAP ———
    if (type === 'heatmap') {
      const maxVal = Math.max(...chartData.map((d) => Number(d.value) || 0));
      return (
        <div className="h-full flex flex-col" style={{ overflowY: 'auto' }}>
          <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${Math.min(chartData.length, 12)}, 1fr)` }}>
            <div />
            {chartData.slice(0, 12).map((d) => (
              <div key={d.name} className="text-[9px] text-gray-400 truncate text-center">{String(d.name).slice(0, 8)}</div>
            ))}
            {chartData.slice(0, 12).map((d, i) => {
              const intensity = maxVal > 0 ? (Number(d.value) || 0) / maxVal : 0;
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-[9px] text-gray-400 w-[110px] truncate text-right">{String(d.name)}</span>
                  <div
                    className="h-6 w-full rounded"
                    style={{
                      backgroundColor: colors[Math.min(Math.floor(intensity * colors.length), colors.length - 1)],
                      opacity: 0.3 + intensity * 0.7,
                    }}
                    title={`${d.name}: ${d.value}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // ——— DATA TABLE ———
    if (type === 'data-table') {
      const headers = data.length > 0 ? Object.keys(data[0]).slice(0, 8) : [];
      return (
        <div className="h-full overflow-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-gray-200">
                {headers.map((h) => (
                  <th key={h} className="px-2 py-1 text-left font-medium text-gray-500 truncate max-w-[80px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 15).map((row, i) => (
                <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
                  {headers.map((h) => (
                    <td key={h} className="px-2 py-1 text-gray-600 truncate max-w-[80px]">{String(row[h] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length > 15 && (
            <div className="text-center py-1 text-[10px] text-gray-500">+{data.length - 15} more rows</div>
          )}
        </div>
      );
    }

    // ——— HEATMAP MATRIX ———
    if (type === 'heatmap-matrix') {
      const xVals = [...new Set(chartData.map((d) => d.name))].slice(0, 10);
      const yVal = 'value';
      const allVals = chartData.map((d) => Number(d[yVal]) || 0);
      const maxV = Math.max(...allVals, 1);
      return (
        <div className="h-full overflow-auto">
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${xVals.length}, 1fr)` }}>
            {xVals.map((x) => (
              <div key={x} className="text-[8px] text-gray-400 text-center truncate">{String(x).slice(0, 6)}</div>
            ))}
            {xVals.map((x) => {
              const match = chartData.find((d) => d.name === x);
              const v = Number(match?.[yVal]) || 0;
              const intensity = v / maxV;
              return (
                <div
                  key={`v-${x}`}
                  className="h-6 rounded"
                  style={{
                    background: colors[Math.min(Math.floor(intensity * (colors.length - 1)), colors.length - 1)],
                    opacity: 0.3 + intensity * 0.7,
                  }}
                  title={`${x}: ${v.toLocaleString()}`}
                />
              );
            })}
          </div>
        </div>
      );
    }

    // ——— SLICERS (rendered as styled lists) ———
    if (type === 'list-slicer') {
      const unique = [...new Set(chartData.map((d) => d.name))];
      return (
        <div className="h-full overflow-auto space-y-1">
          {unique.slice(0, 20).map((item) => (
            <div
              key={String(item)}
              className="px-3 py-1.5 text-xs text-gray-600 bg-white rounded-lg hover:bg-purple-50 hover:text-purple-700 cursor-pointer transition-all border border-gray-200"
            >
              {String(item)}
            </div>
          ))}
        </div>
      );
    }

    if (type === 'dropdown-slicer') {
      const unique = [...new Set(chartData.map((d) => d.name))];
      return (
        <div className="h-full flex items-start">
          <select className="w-full bg-white border border-gray-200 text-gray-700 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/30">
            <option value="">All</option>
            {unique.slice(0, 50).map((item) => (
              <option key={String(item)} value={String(item)}>{String(item)}</option>
            ))}
          </select>
        </div>
      );
    }

    if (type === 'date-range-slider') {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-xs mb-2 text-gray-500">Date Range</div>
            <input type="range" min="0" max="100" className="w-full accent-purple-500" />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>Start</span>
              <span>End</span>
            </div>
          </div>
        </div>
      );
    }

    // ——— SMART NARRATIVE / HTML ———
    if (type === 'smart-narrative') {
      const totalRows = data.length;
      const sumVal = data.reduce((s, r) => s + (Number(r[Array.isArray(config.dataKeyY) ? config.dataKeyY[0] : config.dataKeyY]) || 0), 0);
      const avgVal = totalRows > 0 ? sumVal / totalRows : 0;
      return (
        <div className="h-full flex items-center justify-center text-xs text-gray-400 leading-relaxed px-4">
          <div className="text-center">              <p>📊 <strong className="text-gray-800">{totalRows}</strong> data points analyzed</p>
              <p className="mt-1">Total: <strong className="text-gray-800">{sumVal.toLocaleString()}</strong></p>
              <p>Average: <strong className="text-gray-800">{avgVal.toLocaleString(undefined, { maximumFractionDigits: 1 })}</strong></p>
            <p className="mt-2 text-gray-500">AI-powered narrative generation</p>
          </div>
        </div>
      );
    }

    if (type === 'html-content') {
      return (
        <div className="h-full flex items-center justify-center text-xs text-gray-400 px-4">
          <div className="prose prose-xs prose-invert max-w-none text-center">
            <p>HTML content rendered here.</p>
            <p className="text-gray-500">Supports rich text formatting</p>
          </div>
        </div>
      );
    }

    // ——— BULLET CHART ———
    if (type === 'bullet') {
      const val = Number(chartData[0]?.value) || 0;
      const target = config.targetValue || Math.max(val * 1.2, 100);
      const pct = Math.min((val / target) * 100, 100);
      return (
        <div className="h-full flex flex-col items-center justify-center px-6">
          <div className="w-full">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>0</span>
              <span>Target: {target.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${colors[0]}, ${colors[1] || colors[0]})` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white drop-shadow-md">{val.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // ——— GANTT (simplified timeline bars) ———
    if (type === 'gantt') {
      return (
        <div className="h-full overflow-auto space-y-1.5 px-2">
          {chartData.slice(0, 15).map((d, i) => {
            const v = Number(d.value) || 0;
            const maxV = Math.max(...chartData.map((x) => Number(x.value) || 0), 1);
            const widthPct = (v / maxV) * 100;
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-20 truncate text-right">{String(d.name).slice(0, 12)}</span>
                <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className="h-full rounded-full"
                    style={{ background: colors[i % colors.length] }}
                  />
                </div>
                <span className="text-[10px] text-gray-500 w-12">{v.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      );
    }

    // ——— SANKEY / CHORD (flow-like visualization as stacked bars) ———
    if (type === 'sankey' || type === 'chord') {
      const dataKeys = Array.isArray(config.dataKeyY) ? config.dataKeyY : ['value'];
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} />
            <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} width={70} />
            <Tooltip content={<TooltipContent />} />
            {dataKeys.map((key, i) => (
              <Bar key={key} dataKey={key} stackId="flow" fill={colors[i % colors.length]} radius={[0, 2, 2, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // ——— SUNBURST / WORD CLOUD / CALENDAR HEATMAP ———
    // Fallback: render as styled text display
    if (type === 'sunburst' || type === 'word-cloud' || type === 'calendar-heatmap') {
      return (
        <div className="h-full flex flex-wrap items-center justify-center gap-2 p-4 overflow-auto content-center">
          {chartData.slice(0, 30).map((d, i) => {
            const v = Number(d.value) || 1;
            const fontSize = Math.min(Math.max(v / 10, 10), 28);
            return (
              <span
                key={i}
                style={{
                  fontSize,
                  color: colors[i % colors.length],
                  opacity: 0.5 + (v / Math.max(...chartData.map((x) => Number(x.value) || 0), 1)) * 0.5,
                }}
                className="inline-block hover:scale-110 transition-transform cursor-default"
              >
                {String(d.name)}
              </span>
            );
          })}
        </div>
      );
    }

    // ——— RIBBON / DECOMPOSITION TREE ———
    if (type === 'ribbon' || type === 'decomposition-tree') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} />
            <Tooltip content={<TooltipContent />} />
            <Legend />
            {(Array.isArray(config.dataKeyY) ? config.dataKeyY : ['value']).map((key, i) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[i % colors.length]}
                fill={colors[i % colors.length]}
                fillOpacity={0.3}
                strokeWidth={2}
                stackId="ribbon"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    // ——— SINGLE VALUE / MULTI-ROW CARD ———
    if (type === 'single-value' || type === 'multi-row-card') {
      return (
        <div className="h-full flex flex-col items-center justify-center">            <div className="text-5xl font-bold text-gray-900">
            {Number(chartData[0]?.value || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-400 mt-2">{config.dataKeyY}</div>
        </div>
      );
    }

    // ——— ICON MATRIX ———
    if (type === 'icon-matrix') {
      return (
        <div className="h-full overflow-auto">
          <div className="grid grid-cols-5 gap-1.5">
            {chartData.slice(0, 25).map((d, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: colors[i % colors.length] + '33', color: colors[i % colors.length] }}
                >
                  {String(d.name).charAt(0).toUpperCase()}
                </div>
                <span className="text-[9px] text-gray-600 mt-0.5 truncate w-full text-center">{Number(d.value).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ——— FILLED MAP / BUBBLE MAP ———
    if (type === 'bubble-map' || type === 'filled-map') {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-3xl mb-2">🗺️</div>
            <p className="text-xs text-gray-400">Geographic Map</p>
            <p className="text-[10px] text-gray-600 mt-1">
              {chartData.length} regions · {chartData.reduce((s, d) => s + (Number(d.value) || 0), 0).toLocaleString()} total
            </p>
            <div className="flex flex-wrap gap-1 justify-center mt-2">
              {chartData.slice(0, 8).map((d, i) => (
                <span key={i} className="px-1.5 py-0.5 text-[9px] rounded bg-gray-100 text-gray-600">
                  {String(d.name).slice(0, 10)}: {Number(d.value).toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ——— DEFAULT FALLBACK ———
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Chart type not rendered</div>
          <div className="text-[10px] text-gray-600">{type}</div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, type: 'spring', stiffness: 200 }}
      className="chart-card"
    >
      <div className="chart-header">
        <div className="min-w-0 flex-1">
          <h3 className="chart-title truncate">{config.title}</h3>
          {config.description && (
            <p className="chart-subtitle truncate">{config.description}</p>
          )}
        </div>
        <div className="chart-meta">
          <span className="chart-badge">{config.type.replace(/-/g, ' ')}</span>
        </div>
      </div>
      <div className="h-72">{renderChart()}</div>
    </motion.div>
  );
}

/* Treemap custom content */
function CustomTreemapContent(props: any) {
  const { root, depth, x, y, width, height, index, colors } = props;
  const name = props['name'] || props['payload']?.name || '';
  const color = colors?.[index % (colors?.length || 5)] || '#8b5cf6';
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill: color, stroke: '#1e293b', strokeWidth: 2 / (depth + 1) }} />
      {width > 30 && height > 20 && (
        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" fill="#fff" fontSize={Math.min(width / 6, 12)}>
          {String(name).slice(0, 6)}
        </text>
      )}
    </g>
  );
}
