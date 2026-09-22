import { Clock3 } from 'lucide-react';
import Link from 'next/link';

type UpcomingAppointment = { id: string; time: string; name: string; service: string; barber: string };

export function UpcomingAppointments({ appointments, loading }: { appointments: UpcomingAppointment[]; loading?: boolean }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-[#141517] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-white">Próximos agendamentos</p>
          <p className="mt-1 text-xs text-gray-400">Próximos horários</p>
        </div>
        <Link href="/appointments" aria-label="Ver agenda de agendamentos" className="rounded-xl border border-white/5 bg-[#1B1C1E] p-2 text-zinc-300 transition hover:bg-zinc-800/40 hover:text-amber-400">
          <Clock3 size={18} />
        </Link>
      </div>

      <div className="space-y-1">
        {loading ? <p className="py-8 text-center text-sm text-gray-500">Carregando agenda...</p> : appointments.map((appointment) => (
          <div key={appointment.id} className="flex items-center gap-3 border-b border-white/10 py-3 last:border-0">
            <p className="w-12 text-xs font-bold text-[#FBC02D]">{appointment.time}</p>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-100">{appointment.name}</p>
              <p className="truncate text-xs text-gray-400">{appointment.service} · {appointment.barber}</p>
            </div>
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>
        ))}
        {!loading && appointments.length === 0 && <p className="py-8 text-center text-sm text-gray-500">Nenhum agendamento próximo.</p>}
      </div>
    </section>
  );
}