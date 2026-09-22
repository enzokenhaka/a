'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck2, CircleDollarSign, TrendingUp, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { KpiCard } from '@/components/ui/KpiCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { useCurrentProfile } from '@/components/layout/PanelShell';
import { supabase } from '@/lib/supabase';

type DashboardAppointment = { id: string; date: string; start_time: string; end_time: string; status?: string | null; services?: { name?: string; price?: number; duration?: number } | null; customers?: { name?: string } | null };
type CompletedService = { id: string; name: string; customer: string; time: string; value: number };
type RevenuePoint = { day: string; value: number };
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const relation = <T,>(value: T | T[] | null | undefined) => Array.isArray(value) ? value[0] : value;
const isCancelled = (status?: string | null) => ['cancelled', 'canceled', 'cancelado', 'cancelada'].includes(String(status || '').toLowerCase());
const isCompleted = (status?: string | null) => ['completed', 'complete', 'confirmed', 'concluído', 'concluido', 'confirmado'].includes(String(status || '').toLowerCase());

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({ revenue: 0, appointments: 0, customers: 0, occupancy: 0 });
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [upcoming, setUpcoming] = useState<{ id: string; time: string; name: string; service: string; barber: string }[]>([]);
  const [completed, setCompleted] = useState<CompletedService[]>([]);
  const profile = useCurrentProfile();
  const userName = profile?.full_name || profile?.email?.split('@')[0];

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      const today = new Date();
      const todayIso = isoDate(today);
      const monthStart = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
      const periodStart = timeRange === 'today'
        ? todayIso
        : timeRange === 'week'
          ? isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7)))
          : monthStart;
      const periodEnd = timeRange === 'month'
        ? isoDate(new Date(today.getFullYear(), today.getMonth() + 1, 0))
        : timeRange === 'week'
          ? isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - ((today.getDay() + 6) % 7))))
          : todayIso;

      try {
        const [
          { data: appointmentRows, error: appointmentError },
          { data: customerRows, error: customerError, count: customerCount },
          { data: financialRows, error: financialError }
        ] = await Promise.all([
          supabase
            .from('appointments')
            .select('id, date, start_time, end_time, status, customer_id, service_id, services(name, price, duration), customers!fk_appointments_customer(name)')
            .gte('date', periodStart)
            .lte('date', periodEnd)
            .order('date', { ascending: true })
            .order('start_time', { ascending: true }),
          supabase.from('customers').select('id', { count: 'exact', head: true }),
          supabase.from('financial_records').select('id, value, status, type, created_at, due_date').order('created_at', { ascending: false }),
        ]);

        if (appointmentError) {
          throw appointmentError;
        }

        if (customerError) {
          console.warn('Não foi possível carregar a contagem de clientes:', customerError);
        }

        if (financialError) {
          console.warn('Não foi possível carregar o faturamento financeiro:', financialError);
        }

        const appointments = (appointmentRows || []) as DashboardAppointment[];
        const todayAppointments = appointments.filter((item) => item.date === todayIso && !isCancelled(item.status));
        const completedToday = todayAppointments.filter((item) => isCompleted(item.status));

        const revenueFromFinancial = (financialRows || []).filter((entry) => {
          const status = String(entry?.status || '').trim().toLowerCase();
          const type = String(entry?.type || '').trim().toLowerCase();
          const transactionDate = String(entry?.due_date || entry?.created_at || '').split('T')[0];
          return type === 'receita' && (status === 'pago' || status === 'paid') && transactionDate === todayIso;
        }).reduce((sum, entry) => sum + Number(entry?.value || 0), 0);

        const revenueFromAppointments = completedToday.reduce(
          (sum, item) => sum + Number(relation(item.services)?.price || 0),
          0,
        );

        const revenue = revenueFromFinancial || revenueFromAppointments;
        const averageDuration = todayAppointments.length ? todayAppointments.reduce((sum, item) => {
          const serviceDuration = Number(relation(item.services)?.duration || 0);
          const fallbackMinutes = Math.max(30, (new Date(`1970-01-01T${item.end_time || '00:00'}`).getTime() - new Date(`1970-01-01T${item.start_time || '00:00'}`).getTime()) / 60000);
          return sum + (serviceDuration > 0 ? serviceDuration : fallbackMinutes);
        }, 0) / todayAppointments.length : 0;

        const chart = timeRange === 'today'
          ? Array.from({ length: 7 }, (_, index) => {
              const hour = 8 + index * 2;
              return {
                day: `${String(hour).padStart(2, '0')}h`,
                value: appointments.filter((item) => item.date === todayIso && Number(item.start_time.slice(0, 2)) >= hour && Number(item.start_time.slice(0, 2)) < hour + 2 && isCompleted(item.status)).reduce((sum, item) => sum + Number(relation(item.services)?.price || 0), 0),
              };
            })
          : timeRange === 'week'
            ? Array.from({ length: 7 }, (_, index) => {
                const dateValue = new Date(`${periodStart}T12:00:00`);
                dateValue.setDate(dateValue.getDate() + index);
                const key = isoDate(dateValue);
                return {
                  day: dateValue.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace('.', ''),
                  value: appointments.filter((item) => item.date === key && isCompleted(item.status)).reduce((sum, item) => sum + Number(relation(item.services)?.price || 0), 0),
                };
              })
            : Array.from({ length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() }, (_, index) => {
                const key = isoDate(new Date(today.getFullYear(), today.getMonth(), index + 1));
                return {
                  day: String(index + 1).padStart(2, '0'),
                  value: appointments.filter((item) => item.date === key && isCompleted(item.status)).reduce((sum, item) => sum + Number(relation(item.services)?.price || 0), 0),
                };
              });

        const upcomingRows = appointments.filter((item) => item.date >= todayIso && !isCancelled(item.status)).slice(0, 5);
        const completedRows = appointments.filter((item) => isCompleted(item.status)).sort((a, b) => `${b.date}${b.start_time}`.localeCompare(`${a.date}${a.start_time}`)).slice(0, 5);
        const occupancyMinutes = todayAppointments.reduce((sum, item) => {
          const serviceDuration = Number(relation(item.services)?.duration || 0);
          const fallbackMinutes = Math.max(30, (new Date(`1970-01-01T${item.end_time || '00:00'}`).getTime() - new Date(`1970-01-01T${item.start_time || '00:00'}`).getTime()) / 60000);
          return sum + (serviceDuration > 0 ? serviceDuration : fallbackMinutes);
        }, 0);
        const totalWorkingMinutes = 12 * 60;

        setMetrics({
          revenue,
          appointments: todayAppointments.length,
          customers: Number(customerCount || 0),
          occupancy: Math.min(100, (occupancyMinutes / totalWorkingMinutes) * 100),
        });
        setRevenueData(chart);
        setUpcoming(upcomingRows.map((item) => ({
          id: item.id,
          time: `${item.date === todayIso ? 'Hoje' : item.date} ${item.start_time.slice(0, 5)}`,
          name: relation(item.customers)?.name || 'Cliente',
          service: relation(item.services)?.name || 'Serviço',
          barber: 'Equipe',
        })));
        setCompleted(completedRows.map((item) => ({
          id: item.id,
          name: relation(item.services)?.name || 'Serviço',
          customer: relation(item.customers)?.name || 'Cliente',
          time: `${new Date(`${item.date}T${item.start_time}`).toLocaleDateString('pt-BR')} às ${item.start_time.slice(0, 5)}`,
          value: Number(relation(item.services)?.price || 0),
        })));
      } catch (requestError) {
        console.error('Erro ao carregar dashboard:', requestError);
        setError(requestError instanceof Error ? requestError.message : 'Não foi possível carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [timeRange]);

  return <div className="animate-rise space-y-6 p-5 sm:p-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-gray-500">{userName ? `Bom dia, ${userName}` : <span className="inline-block h-4 w-32 animate-pulse rounded bg-gray-800" />}</p><h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Tudo sob controle.</h2></div><select value={timeRange} onChange={(event) => setTimeRange(event.target.value as 'today' | 'week' | 'month')} className="rounded-lg border border-gray-800 bg-surface px-3 py-2 text-sm text-gray-300 outline-none focus:border-gold"><option value="today">Hoje</option><option value="week">Esta semana</option><option value="month">Este mês</option></select></div>{error && <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</p>}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><KpiCard href="/financial" title="Faturamento diário" value={loading ? '...' : currency.format(metrics.revenue)} trend="Serviços concluídos no período" icon={CircleDollarSign} /><KpiCard href="/appointments" title="Agendamentos hoje" value={loading ? '...' : String(metrics.appointments)} trend="Agenda do período" icon={CalendarCheck2} /><KpiCard href="/customers" title="Novos clientes" value={loading ? '...' : String(metrics.customers).padStart(2, '0')} trend="Cadastrados no período" icon={UserPlus} /><KpiCard href="/appointments" title="Taxa de ocupação" value={loading ? '...' : `${metrics.occupancy.toFixed(1)}%`} trend="Baseada na agenda do período" positive={metrics.occupancy >= 50} icon={TrendingUp} /></div><div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]"><RevenueChart data={revenueData} total={revenueData.reduce((sum, item) => sum + item.value, 0)} loading={loading} /><UpcomingAppointments appointments={upcoming} loading={loading} /></div><section className="overflow-hidden rounded-xl border border-gray-800 bg-panel"><div className="flex items-center justify-between border-b border-gray-800 px-5 py-4 sm:px-6"><div><p className="text-sm font-bold text-white">Serviços concluídos</p><p className="mt-1 text-xs text-gray-500">Últimos atendimentos finalizados</p></div><Link href="/financial" aria-label="Ver financeiro" className="cursor-pointer text-gray-500 transition-colors duration-200 hover:text-[#C5A059]"><Users size={18} /></Link></div><div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="text-[10px] uppercase tracking-[.12em] text-gray-500"><tr><th className="px-6 py-3 font-semibold">Serviço</th><th className="px-6 py-3 font-semibold">Cliente</th><th className="px-6 py-3 font-semibold">Data</th><th className="px-6 py-3 text-right font-semibold">Valor</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Carregando dados...</td></tr> : completed.map((service) => <tr key={service.id} className="border-t border-gray-800/70 text-gray-300"><td className="px-6 py-4 font-semibold text-white">{service.name}</td><td className="px-6 py-4">{service.customer}</td><td className="px-6 py-4 text-gray-500">{service.time}</td><td className="px-6 py-4 text-right font-bold text-gold">{currency.format(service.value)}</td></tr>)}</tbody></table></div></section></div>;
}
