'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type RevenuePoint = { day: string; value: number };

export function RevenueChart({ data, total, timeRange, loading }: { data: RevenuePoint[]; total: number; timeRange?: 'today' | 'week' | 'month'; loading?: boolean }) {
  const inferredRange = timeRange || (data[0]?.day.endsWith('h') ? 'today' : data.length > 7 ? 'month' : 'week');
  const subtitle = inferredRange === 'today' ? 'Receita bruta de hoje' : inferredRange === 'week' ? 'Receita bruta nesta semana' : 'Receita bruta neste mês';
  return (
    <section className="rounded-2xl border border-white/5 bg-[#141517] p-5 sm:p-6">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-100">Evolução de ganhos</p>
          <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
        </div>
        <p className="text-lg font-black text-[#FBC02D]">{loading ? '...' : `R$ ${total.toLocaleString('pt-BR')}`}</p>
      </div>

      <div className="h-[230px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="38%">
            <CartesianGrid vertical={false} stroke="#303640" strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fill: '#727b87', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#727b87', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value / 1000}k`} width={42} />
            <Tooltip
              cursor={{ fill: '#ffffff08' }}
              contentStyle={{ background: '#1B1C1E', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, color: '#fff' }}
              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
            />
            <Bar dataKey="value" fill="#FBC02D" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}