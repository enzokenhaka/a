'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, BarChart3, CalendarDays, Check, ChevronDown, Instagram, Menu, Package, Users, Wallet, X } from 'lucide-react';
import { useShop } from '@/components/layout/shop-context';
import { subscriptionPlans } from '@/lib/plans';
import ClipperHero from '@/components/ClipperHero';
import './landing.css';

const features = [
  { icon: CalendarDays, index: '01', title: 'Agenda em ordem', text: 'Organize os horários por profissional, acompanhe os atendimentos do dia e mantenha a rotina da barbearia fluindo.' },
  { icon: Users, index: '02', title: 'Clientes por perto', text: 'Consulte o histórico de visitas e mantenha as informações de cada cliente reunidas em um só lugar.' },
  { icon: Wallet, index: '03', title: 'Financeiro claro', text: 'Acompanhe vendas, contas a pagar e a receber para entender como anda a operação.' },
  { icon: Package, index: '04', title: 'Estoque sob controle', text: 'Cadastre produtos e acompanhe as quantidades para planejar a reposição.' },
];

const plans = [
  { ...subscriptionPlans[0], description: 'Uma opção direta para iniciar a organização.', popular: false },
  { ...subscriptionPlans[1], description: 'Mais espaço para acompanhar a rotina.', popular: true },
  { ...subscriptionPlans[2], description: 'Uma opção ampliada para sua operação.', popular: false },
];

const platformModules = ['Agenda', 'Clientes', 'Equipe e serviços', 'Estoque', 'Financeiro'];

const questions = [
  ['O que posso gerenciar no Mister Manager OS?', 'Agenda, clientes, serviços, equipe, estoque e financeiro ficam reunidos em um único sistema para sua barbearia.'],
  ['Como começo a usar?', 'Crie sua conta, configure os dados da barbearia e cadastre seus serviços e profissionais. Depois, entre para acompanhar a operação.'],
  ['Posso trocar de plano?', 'Você pode escolher entre as opções mensal e anual na seção de planos. Os recursos de cada opção estão descritos nesta página.'],
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const { shop } = useShop();
  const shopLogo = shop.logo_url || '/logo.png';
  const shopName = shop.shop_name || 'Mister Manager OS';

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>('.landing [data-reveal]'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-visible'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -45px 0px' });
      revealItems.forEach((item) => observer.observe(item));
      return () => observer.disconnect();
    }
  }, []);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 45);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  return (
    <main className="landing">
      <header className={scrolled ? 'landing-header is-scrolled' : 'landing-header'}>
        <a className="landing-brand" href="#inicio" aria-label={`${shopName}, início`}>
          <Image src={shopLogo} alt="" width={48} height={48} unoptimized />
          <span>{shopName}<small>GESTÃO PARA BARBEARIAS</small></span>
        </a>
        <button className="landing-menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}>{menuOpen ? <X /> : <Menu />}</button>
        <nav className={menuOpen ? 'landing-nav is-open' : 'landing-nav'}>
          <a href="#recursos" onClick={() => setMenuOpen(false)}>Recursos</a>
          <a href="#sobre" onClick={() => setMenuOpen(false)}>O sistema</a>
          <a href="#planos" onClick={() => setMenuOpen(false)}>Planos</a>
          <Link className="landing-login" href="/login">Entrar <ArrowRight size={16} /></Link>
        </nav>
      </header>

      <section className="landing-hero" id="inicio">
        <div className="landing-hero-image" role="img" aria-label="Interior acolhedor de uma barbearia" />
        <div className="landing-hero-shade" />
        <ClipperHero />
        <div className="landing-hero-copy">
          <p className="landing-kicker">A rotina da sua barbearia, em harmonia</p>
          <h1>MAIS TEMPO<br />PARA O <em>OFÍCIO.</em></h1>
          <p className="landing-lead">Agenda, equipe, clientes e financeiro em um só lugar. Uma gestão mais clara para você cuidar do que acontece na cadeira.</p>
          <Link className="landing-button" href="/login">Conheça o sistema <ArrowRight size={18} /></Link>
        </div>
        <a className="landing-scroll" href="#recursos"><span>Descubra o Mister Manager</span><ArrowDown size={16} /></a>
        <div className="landing-hero-caption"><span>01 / 04</span><span>GESTÃO FEITA PARA BARBEARIAS</span></div>
      </section>

      <section className="landing-intro" id="sobre">
        <div className="landing-intro-image"><Image src="/barber-working.webp" alt="Barbeiro concentrado em seu trabalho" fill sizes="(max-width: 800px) 100vw, 48vw" /></div>
        <div className="landing-intro-copy" data-reveal>
          <p className="landing-kicker">A operação por trás de cada bom atendimento</p>
          <h2>O cuidado começa <em>antes da cadeira.</em></h2>
          <p>Quando a agenda está organizada e as informações estão à mão, sobra mais espaço para atender bem. O Mister Manager OS reúne as tarefas do dia a dia da barbearia em uma experiência simples de acompanhar.</p>
          <a className="landing-text-link" href="#recursos">Explore os recursos <ArrowRight size={17} /></a>
          <div className="landing-intro-note"><BarChart3 size={18} /><span>Uma visão completa da sua operação, de um só lugar.</span></div>
        </div>
      </section>

      <section className="landing-features" id="recursos">
        <div className="landing-section-heading" data-reveal><div><p className="landing-kicker">Um sistema, cada detalhe</p><h2>O essencial da gestão.<br /><em>Em boas mãos.</em></h2></div><p>Ferramentas para acompanhar a rotina, cuidar da equipe e tomar decisões com mais clareza.</p></div>
        <div className="landing-feature-grid">{features.map(({ icon: Icon, index, title, text }) => <article className="landing-feature" data-reveal key={title}><span className="landing-feature-top"><Icon size={21} /><small>{index}</small></span><h3>{title}</h3><p>{text}</p><span className="landing-feature-rule" /></article>)}</div>
      </section>

      <section className="landing-story">
        <div className="landing-story-photo"><Image src="/atelier-space.webp" alt="Espaço de barbearia preparado para receber clientes" fill sizes="100vw" /></div>
        <div className="landing-story-copy" data-reveal><p className="landing-kicker">Da abertura ao fechamento</p><h2>Mais clareza para tocar <em>o seu negócio.</em></h2><p>Acompanhe agendamentos, pagamentos, serviços e equipe sem perder o ritmo do salão. As informações ficam organizadas para que você encontre o que precisa com facilidade.</p><Link className="landing-text-link" href="/register">Comece a organizar sua barbearia <ArrowRight size={17} /></Link></div>
      </section>

      <section className="landing-plans" id="planos">
        <div className="landing-section-heading" data-reveal><div><p className="landing-kicker">Planos</p><h2>Um começo simples.<br /><em>Espaço para crescer.</em></h2></div><div className="landing-billing"><button type="button" aria-pressed={billing === 'monthly'} onClick={() => setBilling('monthly')}>Mensal</button><button type="button" aria-pressed={billing === 'annual'} onClick={() => setBilling('annual')}>Anual</button></div></div>
        <div className="landing-plan-grid">{plans.map((plan) => <article key={plan.id} data-reveal className={`landing-plan${plan.popular ? ' is-popular' : ''}`}>
          {plan.popular && <span className="landing-plan-badge">Mais escolhido</span>}
          <p className="landing-plan-name">{plan.name}</p><p className="landing-plan-description">{plan.description}</p>
          <p className="landing-plan-price"><strong>R$ {billing === 'monthly' ? plan.monthly : plan.annual}</strong><span>{billing === 'monthly' ? ' / mês' : ' / mês no anual'}</span></p>
          <ul>{platformModules.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
          <Link href={`/checkout?plan=${plan.id}&billing=${billing}`} className="landing-plan-action">Criar conta <ArrowRight size={16} /></Link>
        </article>)}</div>
        <p className="landing-price-note" data-reveal>Os valores correspondem à tabela configurada no sistema. No anual, o preço é mostrado como equivalente mensal. Hoje, todos os planos compartilham os mesmos módulos e o checkout ainda não processa cobranças online.</p>
      </section>

      <section className="landing-faq">
        <div data-reveal><p className="landing-kicker">Dúvidas frequentes</p><h2>Vamos deixar<br /><em>tudo claro.</em></h2></div>
        <div className="landing-questions">{questions.map(([question, answer], index) => <article key={question} className="landing-question" data-reveal><button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{question}</span><ChevronDown size={19} /></button>{openFaq === index && <p>{answer}</p>}</article>)}</div>
      </section>

      <footer className="landing-footer"><div className="landing-footer-main"><a className="landing-brand" href="#inicio"><Image src={shopLogo} alt="" width={48} height={48} unoptimized /><span>{shopName}<small>GESTÃO PARA BARBEARIAS</small></span></a><p>Organização para a rotina. Clareza para crescer.</p><Link className="landing-button" href="/login">Entrar no sistema <ArrowRight size={17} /></Link></div><div className="landing-footer-bottom"><span>© 2026 {shopName}. Todos os direitos reservados.</span><a href="#recursos">Recursos</a><a href="#planos">Planos</a><a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18} /></a></div></footer>
    </main>
  );
}
