'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { supabase } from '@/lib/supabase';
import { isValidEmail } from '@/lib/auth-validation';
import { subscriptionPlans, type PlanId } from '@/lib/plans';

type BillingCycle = 'monthly' | 'annual';
type PaymentMethod = 'card' | 'pix';

type CheckoutFormProps = {
  initialPlan: PlanId | '';
  initialBilling: BillingCycle;
  startAtPayment: boolean;
};

export default function CheckoutForm({
  initialPlan,
  initialBilling,
  startAtPayment,
}: CheckoutFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [planId, setPlanId] = useState<PlanId | ''>(initialPlan);
  const [billing, setBilling] = useState<BillingCycle>(initialBilling);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [step, setStep] = useState<'registration' | 'payment'>(
    startAtPayment ? 'payment' : 'registration',
  );
  const [accountCreated, setAccountCreated] = useState(startAtPayment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedRegistration = window.sessionStorage.getItem('checkout-registration');
    if (storedRegistration) {
      try {
        const parsed = JSON.parse(storedRegistration) as { name?: unknown; email?: unknown };
        if (typeof parsed.name === 'string') setName(parsed.name);
        if (typeof parsed.email === 'string') setEmail(parsed.email);
      } catch {
        setError('Não foi possível recuperar os dados do cadastro. Confira seus dados para continuar.');
      } finally {
        window.sessionStorage.removeItem('checkout-registration');
      }
    }

    if (startAtPayment) {
      void supabase.auth.getUser().then(({ data, error: authError }) => {
        if (authError) {
          setError(`Não foi possível verificar a conta: ${authError.message}`);
          return;
        }
        if (data.user) {
          setName((current) => current || String(data.user.user_metadata.full_name || ''));
          setEmail((current) => current || data.user.email || '');
        }
      });
    }
  }, [startAtPayment]);

  const selectedPlan = subscriptionPlans.find((plan) => plan.id === planId);
  const price = selectedPlan
    ? billing === 'monthly' ? selectedPlan.monthly : selectedPlan.annual
    : null;

  const register = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!planId) {
      setError('Selecione um plano para continuar.');
      return;
    }
    if (!name.trim()) {
      setError('Informe seu nome completo.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim() } },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setPassword('');
    setAccountCreated(true);
    setStep('payment');
  };

  return (
    <AuthLayout>
      <div className="rounded-2xl border border-white/5 bg-[#141517] p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">Checkout</p>
        <h1 className="mt-3 text-3xl font-black text-white">Configure sua conta</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Cadastro e escolha do meio de pagamento em um só lugar.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-zinc-400">
            Plano
            <select
              value={planId}
              onChange={(event) => {
                const nextPlan = subscriptionPlans.find((plan) => plan.id === event.target.value);
                setPlanId(nextPlan?.id ?? '');
              }}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#1B1C1E] px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
            >
              <option value="">Selecione um plano</option>
              {subscriptionPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-zinc-400">
            Cobrança
            <select
              value={billing}
              onChange={(event) => setBilling(event.target.value === 'annual' ? 'annual' : 'monthly')}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#1B1C1E] px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
            >
              <option value="monthly">Mensal</option>
              <option value="annual">Anual</option>
            </select>
          </label>
        </div>

        {selectedPlan && price !== null && (
          <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="font-semibold text-white">{selectedPlan.name}</p>
            <p className="mt-1 text-sm text-zinc-300">R$ {price} / mês</p>
          </div>
        )}

        {step === 'registration' ? (
          <form onSubmit={register} className="mt-6 space-y-4">
            <label className="block text-xs text-zinc-400">
              Nome completo
              <input
                required
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#1B1C1E] px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
              />
            </label>
            <label className="block text-xs text-zinc-400">
              E-mail
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#1B1C1E] px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
              />
            </label>
            <label className="block text-xs text-zinc-400">
              Senha
              <input
                required
                type="password"
                autoComplete="new-password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#1B1C1E] px-3 py-3 text-sm text-white outline-none focus:border-amber-400"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#FBBF24] px-4 py-3 text-sm font-bold text-zinc-900 transition hover:bg-[#F59E0B] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Criando conta...' : 'Criar conta e continuar'}
            </button>
          </form>
        ) : (
          <section className="mt-6 space-y-4">
            <div className="rounded-xl border border-zinc-700 bg-[#1B1C1E] p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Dados da conta</p>
              <p className="mt-2 text-sm text-white">{name || 'Nome não informado'}</p>
              <p className="mt-1 text-sm text-zinc-400">{email || 'E-mail não informado'}</p>
            </div>
            <fieldset>
              <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Meio de pagamento
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-700 bg-[#1B1C1E] p-4 text-sm text-white">
                  <input
                    type="radio"
                    name="payment-method"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="accent-amber-400"
                  />
                  Cartão de crédito
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-700 bg-[#1B1C1E] p-4 text-sm text-white">
                  <input
                    type="radio"
                    name="payment-method"
                    value="pix"
                    checked={paymentMethod === 'pix'}
                    onChange={() => setPaymentMethod('pix')}
                    className="accent-amber-400"
                  />
                  PIX
                </label>
              </div>
            </fieldset>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6 text-amber-100">
              {paymentMethod === 'card'
                ? 'A cobrança por cartão ainda não está habilitada. Não informe nem envie dados do cartão nesta página.'
                : 'A geração de cobrança PIX ainda não está habilitada. Nenhum pagamento será iniciado.'}
            </div>
            {accountCreated && (
              <p className="text-sm text-zinc-400">
                Conta criada. Se você precisar confirmar o e-mail, conclua a confirmação antes de entrar.
              </p>
            )}
            <Link
              href="/login"
              className="block w-full rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm font-semibold text-zinc-100 transition hover:bg-white/5"
            >
              Ir para Entrar
            </Link>
          </section>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-zinc-400">
          Já tem conta? <Link href="/login" className="font-semibold text-amber-300 hover:underline">Entrar</Link>
          {' · '}
          <Link href="/register" className="font-semibold text-amber-300 hover:underline">Cadastro separado</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
