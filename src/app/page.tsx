'use client';

import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Facebook,
  Instagram,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Package,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useShop } from '@/components/layout/shop-context';

const navItems = [
  { label: 'Funcionalidades', href: '#features' },
  { label: 'Planos', href: '#pricing' },
  { label: 'Depoimentos', href: '#testimonials' },
];

const featureCards = [
  {
    icon: CalendarCheck2,
    title: 'Agendamento inteligente',
    description:
      'Visualize agenda diária e semanal por barbeiro, com bloqueios automáticos e gestão de tempo em tempo real.',
  },
  {
    icon: TrendingUp,
    title: 'Financeiro em tempo real',
    description:
      'Acompanhe saldo, receitas, contas a pagar e receber em uma visão clara e automatizada para decisões rápidas.',
  },
  {
    icon: Users,
    title: 'Clientes fidelizados',
    description:
      'Guarde histórico, preferências e informações de cada cliente para entregas mais personalizadas e recorrentes.',
  },
  {
    icon: Package,
    title: 'Estoque e PDV',
    description:
      'Controle pomadas, produtos e consumíveis com integração ao financeiro para faturamento e reposição em um clique.',
  },
  {
    icon: BriefcaseBusiness,
    title: 'Gestão de equipe',
    description:
      'Acompanhe performance, comissões e metas individuais de cada profissional para operação mais eficiente.',
  },
];

const stats = [
  { value: '10k+', label: 'agendamentos confirmados' },
  { value: '99.9%', label: 'tempo de atividade' },
  { value: '5h/sem', label: 'economizadas em gestão financeira' },
  { value: '4.9/5', label: 'avaliação média de clientes' },
];

const testimonials = [
  {
    name: 'Victor Almeida',
    shop: 'Mister Barber Studio',
    quote:
      'A plataforma eliminou a bagunça do financeiro e elevou a experiência dos nossos clientes. Hoje somos mais rápidos e mais organizados.',
    avatar: 'VA',
  },
  {
    name: 'Rafael Costa',
    shop: 'Noir & Blade',
    quote:
      'Além da rotina, a visão de gestão por barbeiro me ajudou a aumentar produtividade e reduzir atrasos no atendimento.',
    avatar: 'RC',
  },
  {
    name: 'Diego Nunes',
    shop: 'Dapper House',
    quote:
      'Nunca antes tive controle tão fácil da equipe, estoque e faturamento. O sistema vira parte da operação da barbearia.',
    avatar: 'DN',
  },
];

const pricingPlans = [
  {
    name: 'Iniciante',
    monthly: 59,
    annual: 49,
    description: 'Para barbearias em fase inicial de organização.',
    popular: false,
    features: ['Agenda e clientes', 'Financeiro básico', 'Relatórios mensais', 'Suporte por e-mail'],
  },
  {
    name: 'Crescimento',
    monthly: 99,
    annual: 79,
    description: 'Ideal para negócios que querem crescer com consistência.',
    popular: true,
    features: ['Tudo do Iniciante', 'Gestão de equipe', 'Controle de estoque', 'WhatsApp e automações'],
  },
  {
    name: 'Premium',
    monthly: 169,
    annual: 139,
    description: 'Para operações premium com múltiplas frentes e exigência.',
    popular: false,
    features: ['Tudo do Crescimento', 'Relatórios avançados', 'Múltiplas unidades', 'Suporte prioritário'],
  },
];

const faqs = [
  {
    question: 'Posso migrar meus dados atuais para a plataforma?',
    answer:
      'Sim. Nossa equipe realiza migração de agendamentos, clientes e histórico com apoio de onboarding para não interromper seu fluxo de trabalho.',
  },
  {
    question: 'Como funciona o teste gratuito?',
    answer:
      'Você recebe 14 dias para testar todos os módulos principais, com acesso total e suporte para configurar sua barbearia em poucos passos.',
  },
  {
    question: 'Existe integração com WhatsApp?',
    answer:
      'Sim. O sistema suporta mensagens automáticas, lembretes e confirmações de agendamento diretamente pelo WhatsApp da sua operação.',
  },
  {
    question: 'Quem pode acessar a plataforma?',
    answer:
      'Você controla permissões por perfil, definindo quem acessa agenda, financeiro, estoque e relatórios de desempenho da equipe.',
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof CalendarCheck2;
  title: string;
  description: string;
}) {
  return (
    <article className="animate-rise group rounded-2xl border border-zinc-800/60 bg-[#16191E] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-[0_20px_60px_rgba(251,192,45,0.08)]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-3 text-xl font-semibold text-zinc-100">{title}</h3>
      <p className="text-sm leading-6 text-zinc-400">{description}</p>
    </article>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[560px] rounded-[28px] border border-zinc-700/60 bg-[#0F1115] p-3 shadow-[0_24px_80px_rgba(13,15,18,0.9)]">
      <div className="absolute -left-12 top-14 h-32 w-32 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="absolute -right-16 bottom-6 h-40 w-40 rounded-full bg-zinc-700/40 blur-3xl" />
      <div className="relative overflow-hidden rounded-[22px] border border-zinc-800 bg-[#12161B] p-4">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
            <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          </div>
          <div className="rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-300">
            Painel
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-[#171B20] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <LayoutDashboard className="h-3.5 w-3.5 text-amber-400" />
              Receita
            </div>
            <div className="text-xl font-semibold text-zinc-100">R$ 18.4k</div>
            <div className="mt-2 text-[11px] text-emerald-400">+12.4% vs mês</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#171B20] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <Clock3 className="h-3.5 w-3.5 text-amber-400" />
              Hoje
            </div>
            <div className="text-xl font-semibold text-zinc-100">42 agend.</div>
            <div className="mt-2 text-[11px] text-zinc-400">8 clientes em fila</div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-[#171B20] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Retenção
            </div>
            <div className="text-xl font-semibold text-zinc-100">86%</div>
            <div className="mt-2 text-[11px] text-zinc-400">Clientes ativos</div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-2xl border border-zinc-800 bg-[#171B20] p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Próximos serviços</p>
                <h4 className="mt-2 text-lg font-semibold text-zinc-100">Agenda do dia</h4>
              </div>
              <button className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-300">
                + Novo
              </button>
            </div>

            <div className="space-y-3">
              {[
                ['09:00', 'Corte + barba', 'Rafael', 'R$ 120'],
                ['10:30', 'Barba premium', 'Mateus', 'R$ 90'],
                ['12:15', 'Corte + hidratação', 'Lucas', 'R$ 150'],
                ['15:00', 'Corte Executivo', 'João', 'R$ 110'],
              ].map(([time, service, barber, price], index) => (
                <div key={index} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#14181D] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/10 text-xs font-semibold text-amber-300">
                      {time}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{service}</p>
                      <p className="text-xs text-zinc-500">{barber}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-200">{price}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#171B20] p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Resumo</p>
              <BarChart3 className="h-4 w-4 text-amber-400" />
            </div>
            <div className="space-y-3">
              {[72, 64, 86, 92].map((value, index) => (
                <div key={index}>
                  <div className="mb-1 flex justify-between text-[11px] text-zinc-500">
                    <span>{['R. Lucro', 'Vendas', 'Fidelização', 'Outros'][index]}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-200"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3">
              <div className="flex items-center gap-2 text-amber-300">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-[0.2em]">Meta</span>
              </div>
              <p className="mt-2 text-2xl font-semibold text-zinc-100">R$ 25,6k</p>
              <p className="mt-1 text-[11px] text-zinc-400">Saldo estimado até o fim do mês</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { shop } = useShop();
  const shopLogo = shop.logo_url || '/logo.png';
  const shopName = shop.shop_name || 'Mister Manager OS';

  return (
    <main className="min-h-screen bg-[#0D0F12] text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-50 pb-4 pt-4">
          <nav className="rounded-full border border-zinc-800/80 bg-[#0d0f12]/75 px-4 py-3 shadow-[0_12px_36px_rgba(0,0,0,0.25)] backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <a href="#top" className="flex items-center gap-3" aria-label={`${shopName} home`}>
                <Image
                  src={shopLogo}
                  alt={`${shopName} logo`}
                  width={36}
                  height={36}
                  priority
                  unoptimized
                  className="h-9 w-9 rounded-full border border-white/10 bg-zinc-900/80 object-contain"
                  onError={(event) => {
                    event.currentTarget.src = '/logo.png';
                    event.currentTarget.onerror = null;
                  }}
                />
                <div>
                  <div className="text-base font-semibold tracking-tight text-zinc-100">{shopName}</div>
                </div>
              </a>

              <div className="hidden items-center gap-8 md:flex">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="text-sm text-zinc-300 transition-all duration-200 hover:text-amber-400"
                  >
                    {item.label}
                  </a>
                ))}
              </div>

              <div className="hidden items-center gap-3 md:flex">
                <Link
                  href="/login"
                  className="rounded-full border border-zinc-700 bg-white/0 px-4 py-2 text-sm font-medium text-zinc-100 transition-all duration-200 hover:bg-white/5"
                  aria-label="Entrar"
                >
                  Entrar
                </Link>
                <a
                  href="#pricing"
                  className="rounded-full bg-[#FBC02D] px-4 py-2 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-amber-300"
                >
                  Começar teste grátis
                </a>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/70 p-2 text-zinc-100 md:hidden"
                onClick={() => setMenuOpen((value) => !value)}
                aria-label="Abrir menu"
              >
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            {menuOpen ? (
              <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4 md:hidden">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block rounded-xl px-3 py-2 text-sm text-zinc-300 transition-all duration-200 hover:bg-white/5 hover:text-amber-400"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <div className="grid gap-2 pt-2">
                  <Link
                    href="/login"
                    className="rounded-xl border border-zinc-700 bg-white/0 px-4 py-2 text-center text-sm font-medium text-zinc-100"
                  >
                    Entrar
                  </Link>
                  <a href="#pricing" className="rounded-xl bg-[#FBC02D] px-4 py-2 text-center text-sm font-semibold text-zinc-900">
                    Começar teste grátis
                  </a>
                </div>
              </div>
            ) : null}
          </nav>
        </header>

        <section id="top" className="relative scroll-mt-28 overflow-hidden pb-16 pt-8 md:pt-16">
          <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(251,192,45,0.16),transparent_39%)]" />
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
                Sistema premium
              </div>

              <h1 className="text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Operação Mais Eficiente Para Sua Barbearia
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-400">
                Organize seus agendamentos, controle o financeiro em tempo real e gerencie sua equipe com a plataforma desenvolvida sob medida para o seu negócio.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FBC02D] px-6 py-3.5 text-sm font-semibold text-zinc-900 transition-all duration-200 hover:bg-amber-300"
                >
                  Começar grátis
                  <ArrowRight className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-700 bg-[#111315] px-6 py-3.5 text-sm font-semibold text-zinc-100 transition-all duration-200 hover:bg-white/5"
                  aria-label="Assistir demonstração"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Ver demonstração
                </button>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Setup em 15 minutos
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  Sem contrato fixo
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="hero-glow absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-400/10 blur-3xl" />
              <DashboardMockup />
              <div className="float-soft absolute -bottom-5 -left-4 hidden w-52 overflow-hidden rounded-2xl border border-white/10 bg-[#111315]/90 p-2 shadow-2xl backdrop-blur-xl sm:block">
                <div className="relative h-28 overflow-hidden rounded-xl">
                  <img
                    src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=700&q=85"
                    alt="Ambiente profissional de uma barbearia"
                    className="h-full w-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white">Experiência premium</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-20 pt-2">
          <div className="grid overflow-hidden rounded-[30px] border border-zinc-800/70 bg-[#14171B] lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative min-h-[300px] overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=85"
                alt="Barbeiro trabalhando em um ambiente moderno"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/15 via-black/20 to-[#14171B]" />
              <div className="absolute bottom-5 left-5 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-xs font-medium text-white backdrop-blur-md">
                Gestão que acompanha sua rotina
              </div>
            </div>
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-300">Uma operação mais leve</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Menos cliques. Mais tempo para atender.</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-400">
                Uma experiência pensada para você encontrar cada módulo rapidamente, acompanhar o que importa e voltar ao trabalho sem se perder em menus.
              </p>
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-zinc-300">
                {['Navegação rápida', 'Interface responsiva', 'Dados organizados', 'Feedback visual'].map((item) => (
                  <span key={item} className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-2">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 px-0 pb-20 pt-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-300">Funcionalidades</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Tudo o que sua barbearia precisa em uma plataforma
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureCards.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </section>

        <section className="pb-20">
          <div className="rounded-[28px] border border-zinc-800/60 bg-[#16191E] p-6 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-[#121417] p-5">
                  <div className="text-3xl font-black tracking-tight text-white">{stat.value}</div>
                  <div className="mt-2 text-sm text-zinc-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="testimonials" className="scroll-mt-28 pb-22">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-300">Depoimentos</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Barbearias que cresceram com a Mister</h2>
            </div>
            <div className="hidden items-center gap-1 md:flex">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((person) => (
              <article key={person.name} className="rounded-2xl border border-zinc-800/60 bg-[#16191E] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-sm font-bold text-zinc-900">
                      {person.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">{person.name}</div>
                      <div className="text-sm text-zinc-500">{person.shop}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-sm leading-7 text-zinc-300">“{person.quote}”</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="scroll-mt-28 pb-20 pt-4">
          <div className="mb-10 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-300">Planos</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Escolha o plano ideal para seu negócio</h2>
          </div>

          <div className="mb-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                billing === 'monthly' ? 'bg-[#FBC02D] text-zinc-900' : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80'
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBilling('annual')}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                billing === 'annual' ? 'bg-[#FBC02D] text-zinc-900' : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700/80'
              }`}
            >
              Anual
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {pricingPlans.map((plan) => {
              const price = billing === 'monthly' ? plan.monthly : plan.annual;
              return (
                <article
                  key={plan.name}
                  className={`rounded-2xl border p-6 ${
                    plan.popular
                      ? 'border-amber-500/60 bg-[#17191D] shadow-[0_0_24px_rgba(251,192,45,0.18)]'
                      : 'border-zinc-800/70 bg-[#16191E]'
                  }`}
                >
                  {plan.popular ? (
                    <div className="mb-5 inline-flex rounded-full border border-amber-500/50 bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-amber-300">
                      Mais popular
                    </div>
                  ) : null}

                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-zinc-100">{plan.name}</h3>
                    <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>
                  </div>

                  <div className="mb-6 flex items-end gap-2">
                    <span className="text-4xl font-black text-white">R$ {price}</span>
                    <span className="pb-1 text-sm text-zinc-400">/mês</span>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-sm text-zinc-300">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/10 text-amber-300">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    className={`mt-8 w-full rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                      plan.popular
                        ? 'bg-[#FBC02D] text-zinc-900 hover:bg-amber-300'
                        : 'border border-zinc-700 bg-zinc-900/70 text-zinc-100 hover:bg-white/5'
                    }`}
                  >
                    {plan.popular ? 'Começar teste grátis' : 'Escolher plano'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="pb-20">
          <div className="mx-auto max-w-4xl rounded-[28px] border border-zinc-800 bg-[#16191E] p-6 sm:p-8">
            <div className="mb-8 text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-amber-300">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">Perguntas frequentes</h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;

                return (
                  <div key={faq.question} className="rounded-2xl border border-zinc-800 bg-[#111315]">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span className="font-medium text-zinc-100">{faq.question}</span>
                      <ChevronDown className={`h-5 w-5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen ? <p className="px-4 pb-4 text-sm leading-7 text-zinc-400">{faq.answer}</p> : null}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-zinc-800 bg-[#0D0F12]">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src={shopLogo}
                alt={`${shopName} logo`}
                width={36}
                height={36}
                priority
                unoptimized
                className="h-9 w-9 rounded-full border border-white/10 bg-zinc-900/80 object-contain"
                onError={(event) => {
                  event.currentTarget.src = '/logo.png';
                  event.currentTarget.onerror = null;
                }}
              />
              <div className="text-base font-semibold text-zinc-100">{shopName}</div>
            </div>
            <p className="mt-3 max-w-md text-sm text-zinc-500">Gestão premium para barbearias modernas e profissionais que querem crescer com consistência.</p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-zinc-400">
            <a href="#features" className="transition-all duration-200 hover:text-amber-300">Funcionalidades</a>
            <a href="#pricing" className="transition-all duration-200 hover:text-amber-300">Planos</a>
            <a href="#testimonials" className="transition-all duration-200 hover:text-amber-300">Depoimentos</a>
            <a href="#" className="transition-all duration-200 hover:text-amber-300">Política de privacidade</a>
          </div>

          <div className="flex items-center gap-3">
            <a href="#" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-[#111315] text-zinc-300 transition-all duration-200 hover:border-amber-400/50 hover:text-amber-300">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="#" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-[#111315] text-zinc-300 transition-all duration-200 hover:border-amber-400/50 hover:text-amber-300">
              <Facebook className="h-4 w-4" />
            </a>
            <a href="#" aria-label="WhatsApp" className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-[#111315] text-zinc-300 transition-all duration-200 hover:border-amber-400/50 hover:text-amber-300">
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mx-auto max-w-7xl border-t border-zinc-800 px-4 py-5 text-center text-sm text-zinc-500 sm:px-6 lg:px-8">
          © 2026 Mister Manager OS. Todos os direitos reservados.
        </div>
      </footer>
    </main>
  );
}
