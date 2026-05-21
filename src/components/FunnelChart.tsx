import { Funnel, FunnelChart as ReFunnelChart, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface FunnelData {
  stage: string;
  users: number;
  dropoff: number;
}

interface FunnelChartProps {
  data: FunnelData[];
}

const COLORS = ['#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];

export function FunnelChart(props: FunnelChartProps) {
  const { data } = props;
  const chartData = data.map((d, i) => ({
    name: d.stage,
    value: d.users,
    fill: COLORS[i % COLORS.length],
  }));

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ReFunnelChart>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
            formatter={(value: number) => [`${value.toLocaleString()} users`, 'Count']}
          />
          <Funnel
            dataKey="value"
            nameKey="name"
            data={chartData}
            isAnimationActive
          >
            <LabelList position="inside" fill="#fff" stroke="none" dataKey="name" />
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Funnel>
        </ReFunnelChart>
      </ResponsiveContainer>
    </div>
  );
}
