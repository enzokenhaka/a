'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setMessage('');
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (password !== confirmation) { setError('As senhas não conferem.'); return; }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      router.push('/login');
      return;
    }
    setMessage('Cadastro realizado. Verifique seu e-mail para confirmar a conta.');
    setLoading(false);
  };

  return (
    <AuthLayout>
      <div className="animate-rise rounded-2xl border border-white/5 bg-[#141517] p-6 sm:p-8">
        <div className="mb-8">
          <span className="inline-flex items-center rounded-full border border-[#FBC02D]/30 bg-[#FBC02D]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F7D36A]">
            Novo cadastro
          </span>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-[-0.05em] text-white">Crie sua conta</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">
            Organize a gestão da sua barbearia com uma conta profissional e segura.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">E-mail</label>
            <div className="relative flex items-center gap-3 rounded-xl border border-white/5 bg-[#1B1C1E] px-3 py-3 pr-11 transition-all duration-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
              <Mail className="h-4 w-4 text-[#FBC02D]" />
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Seu@email.com"
                className="w-full border-0 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Senha</label>
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#1B1C1E] px-3 py-3 transition-all duration-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
              <Lock className="h-4 w-4 text-[#FBC02D]" />
              <div className="relative flex w-full items-center">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  className="w-full border-0 bg-transparent pr-10 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                />
                <button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-white focus:outline-none">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Confirmar senha</label>
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#1B1C1E] px-3 py-3 pr-11 transition-all duration-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
              <Lock className="h-4 w-4 text-[#FBC02D]" />
              <div className="relative flex w-full items-center">
                <input
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  placeholder="••••••••••••"
                  className="w-full border-0 bg-transparent pr-10 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                />
                <button type="button" aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'} onClick={() => setShowConfirmPassword((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-white focus:outline-none">
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>}
          {message && <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{message}</p>}

          <button
            disabled={loading}
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FBC02D] px-4 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[#0b0b0d] shadow-[0_16px_30px_rgba(251,192,45,0.35)] transition-all duration-200 hover:bg-[#f5c94f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Registrando...' : 'Registrar-se'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-300">
          Já tem uma conta?{' '}
          <Link href="/login" className="font-semibold text-[#FBC02D] transition hover:text-[#f7d36a] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
