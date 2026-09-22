'use client';
import { Bell, ChevronDown, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { UserProfile } from '@/lib/profile';
import { supabase } from '@/lib/supabase';

type NotificationItem = {
  id: string;
  type: 'bill' | 'stock';
  title: string;
  message: string;
  href: string;
};

export function Header({ title, onMenu, profile }: { title: string; onMenu: () => void; profile: UserProfile | null }) {
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const userName = profile?.full_name || profile?.email?.split('@')[0];
  const initials = userName?.slice(0, 2).toUpperCase();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const loadNotifications = async () => {
      const now = new Date();
      const dueWindowEnd = new Date(now);
      dueWindowEnd.setDate(now.getDate() + 3);
      dueWindowEnd.setHours(23, 59, 59, 999);

      const [billsResponse, stockResponse] = await Promise.all([
        supabase
          .from('financial_records')
          .select('id, description, due_date, status')
          .eq('status', 'Pendente')
          .not('due_date', 'is', null)
          .order('due_date', { ascending: true }),
        supabase
          .from('products')
          .select('id, name, quantity')
          .lte('quantity', 5)
          .order('quantity', { ascending: true }),
      ]);

      const billAlerts: NotificationItem[] = (billsResponse.data || [])
        .filter((record) => {
          const dueDate = record.due_date ? new Date(`${record.due_date}T00:00:00`) : null;
          if (!dueDate) return false;
          return dueDate <= dueWindowEnd && dueDate <= new Date(new Date().getTime() + 1000 * 60 * 60 * 24 * 4);
        })
        .map((record) => ({
          id: `bill-${record.id}`,
          type: 'bill',
          title: 'Conta pendente',
          message: `${record.description || 'Conta'} vence em ${new Date(`${record.due_date}T00:00:00`).toLocaleDateString('pt-BR')}`,
          href: '/financeiro/contas-a-pagar',
        }));

      const stockAlerts: NotificationItem[] = (stockResponse.data || []).map((product) => ({
        id: `stock-${product.id}`,
        type: 'stock',
        title: 'Estoque baixo',
        message: `${product.name} com ${product.quantity} unidade${product.quantity === 1 ? '' : 's'} restante${product.quantity === 1 ? '' : 's'}`,
        href: '/estoque',
      }));

      setNotifications([...billAlerts, ...stockAlerts]);
    };

    void loadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const notificationLabel = notifications.length > 0 ? `${notifications.length}` : '0';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#0D0F12]/90 px-4 backdrop-blur-xl sm:px-8">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="rounded-xl p-2 text-gray-400 transition hover:bg-white/5 hover:text-zinc-100 lg:hidden" aria-label="Abrir menu">
          <Menu />
        </button>
        <Image
          src="/logo.png"
          alt="Mister Manager OS"
          width={36}
          height={36}
          priority
          unoptimized
          className="h-9 w-9 object-contain drop-shadow-[0_0_12px_rgba(251,192,45,.15)]"
        />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400">Visão geral</p>
          <h1 className="text-xl font-semibold tracking-[-0.04em] text-zinc-100">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div ref={notificationRef} className="relative">
          <button
            type="button"
            aria-label="Notificações"
            aria-expanded={notificationsOpen}
            onClick={() => setNotificationsOpen((current) => !current)}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/5 bg-[#1B1C1E] text-zinc-200 transition hover:border-amber-400/40 hover:text-amber-300"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-[#0b0b0d]">
                {notificationLabel}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-[320px] overflow-hidden rounded-2xl border border-white/5 bg-[#16191E] shadow-2xl">
              <div className="border-b border-white/5 px-4 py-3">
                <p className="text-sm font-semibold text-white">Notificações</p>
              </div>

              <div className="max-h-[360px] overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-400">Nenhuma notificação pendente.</div>
                ) : (
                  <ul className="space-y-2">
                    {notifications.map((item) => (
                      <li key={item.id} className="rounded-xl border border-white/5 bg-[#1B1C1E] p-3">
                        <div className="mb-2 flex items-start gap-2">
                          <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${item.type === 'bill' ? 'bg-amber-400' : 'bg-rose-400'}`} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-gray-400">{item.message}</p>
                          </div>
                        </div>
                        <Link
                          href={item.href}
                          onClick={() => setNotificationsOpen(false)}
                          className="inline-flex items-center text-xs font-semibold text-[#FBC02D] transition hover:text-[#f7d36a]"
                        >
                          {item.type === 'bill' ? 'Ir para Contas a Pagar' : 'Ir para Estoque'}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {profile ? (
          <div className="group relative">
            <Link href="/profile" title={profile.email} className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[#FBC02D] text-xs font-black text-[#0b0b0d]">
                {profile.avatar_url ? <img src={profile.avatar_url} alt={`Foto de ${userName}`} className="h-full w-full rounded-full object-cover" /> : initials}
              </span>
              <span className="hidden max-w-32 truncate sm:block">{userName}</span>
              <ChevronDown size={15} className="text-gray-500" />
            </Link>

            <div className="invisible absolute right-0 top-full z-50 w-36 pt-2 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
              <div className="rounded-xl border border-white/5 bg-[#1B1C1E] p-1.5">
                <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-300 transition hover:bg-red-500/10 hover:text-red-400">
                  <LogOut size={14} /> Sair
                </button>
              </div>
            </div>
          </div>
        ) : (
          <span className="h-8 w-24 animate-pulse rounded-lg bg-white/10" aria-label="Carregando usuário" />
        )}
      </div>
    </header>
  );
}
