import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

type Props = {
  title: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  positive?: boolean;
  href?: string;
};

export function KpiCard({ title, value, trend, icon: Icon, positive = true, href }: Props) {
  const card = (
    <article
      className={`group rounded-2xl border border-white/5 bg-[#141517] p-5 transition-all duration-200 ${
        href ? 'cursor-pointer hover:-translate-y-0.5 hover:border-[#FBC02D]/40' : 'hover:-translate-y-0.5 hover:border-[#FBC02D]/35'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-400">{title}</p>
          <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-zinc-100">{value}</p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FBC02D]/12 text-[#FBC02D] ring-1 ring-[#FBC02D]/20">
          <Icon size={20} />
        </span>
      </div>

      <p className={`mt-4 text-xs font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>{trend}</p>
    </article>
  );

  return href ? <Link href={href} className="block">{card}</Link> : card;
}