'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface PipelineChartProps {
  data: { stage: string; count: number }[]
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean
  payload?: { value: number }[]
  label?: string
}) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0D1421] border border-[#1a2332] rounded px-3 py-2 shadow-xl">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="text-sm font-bold text-[#C9A84C] font-data">{payload[0].value} cases</p>
    </div>
  )
}

export function PipelineChart({ data }: PipelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-xs text-slate-500">
        No active cases in pipeline
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2332" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 10, fill: '#64748b', fontFamily: 'DM Mono' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="stage"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          tickLine={false}
          axisLine={false}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(201,168,76,0.05)' }} />
        <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={20}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.count > 0 ? '#C9A84C' : '#1a2332'}
              fillOpacity={0.8}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
