'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Package,
  Scissors,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import type { UserProfile } from '@/lib/profile';
import { useShop } from './shop-context';

const groups = [
  {
    label: 'Visão geral',
    links: [
      { href: '/dashboard', label: 'Painel', icon: ChartNoAxesCombined },
    ],
  },
  {
    label: 'Operação',
    links: [
      { href: '/appointments', label: 'Agendamentos', icon: CalendarDays },
      { href: '/customers', label: 'Clientes', icon: Users },
      { href: '/services', label: 'Serviços', icon: Scissors },
      { href: '/estoque', label: 'Estoque', icon: Package },
      { href: '/funcionarios', label: 'Funcionários', icon: UserRound },
    ],
  },
  {
    label: 'Gestão',
    links: [
      { href: '/finance', label: 'Financeiro', icon: CircleDollarSign },
    ],
  },
];

export function Sidebar({
  open,
  onClose,
  profile,
}: {
  open: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}) {
  const pathname = usePathname();
  const { shop } = useShop();
  const shopName = shop.shop_name || 'Mister Manager OS';
  const shopLogo = shop.logo_url || '/logo.png';

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden ${open ? 'block' : 'hidden'}`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[270px] flex-col border-r border-white/5 bg-[#0A0B0E]/95 px-4 py-4 shadow-[20px_0_60px_rgba(0,0,0,.18)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="relative flex shrink-0 flex-col items-center justify-center gap-2 border-b border-white/5 pb-5 pt-1">
            <div className="relative grid h-20 w-full place-items-center">
              <div className="absolute h-16 w-16 rounded-full bg-amber-400/10 blur-2xl" />
              <Image
                src={shopLogo}
                alt={`${shopName} logo`}
                width={160}
                height={80}
                priority
                unoptimized
                className="relative mx-auto h-16 w-full max-w-[150px] object-contain"
                onError={(event) => {
                  event.currentTarget.src = '/logo.png';
                }}
              />
            </div>
            <div className="max-w-full truncate text-center text-xs font-bold uppercase tracking-[0.16em] text-zinc-200">
              {shopName}
            </div>

            <button
              onClick={onClose}
              className="absolute right-1 top-1 rounded-lg p-2 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-100 lg:hidden"
              aria-label="Fechar menu"
            >
              <X size={19} />
            </button>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto py-5 pr-1" aria-label="Navegação principal">
            <div className="space-y-6">
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.links.map(({ href, label, icon: Icon }) => {
                      const active = pathname === href || pathname.startsWith(`${href}/`);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={onClose}
                          prefetch
                          data-active={active}
                          className={`nav-link group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                            active
                              ? 'text-amber-300'
                              : 'text-zinc-400 hover:-translate-y-[1px] hover:text-zinc-100'
                          }`}
                        >
                          {active && (
                            <span className="absolute -left-2 h-7 w-1 rounded-r-full bg-[#FBC02D] shadow-[0_0_16px_rgba(251,192,45,.45)]" />
                          )}
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                              active
                                ? 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/15'
                                : 'bg-white/5 text-zinc-500 group-hover:bg-white/10 group-hover:text-zinc-100'
                            }`}
                          >
                            <Icon size={18} />
                          </span>
                          <span className="truncate">{label}</span>
                          {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(251,192,45,.8)]" />}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

        </div>
      </aside>
    </>
  );
}
