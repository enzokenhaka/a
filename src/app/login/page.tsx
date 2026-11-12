"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { supabase } from "@/lib/supabase";
import { isValidEmail } from "@/lib/auth-validation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryToken, setRecoveryToken] = useState("");
  const [recoveryLinkVerified, setRecoveryLinkVerified] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryConfirmation, setRecoveryConfirmation] = useState("");
  const [showRecoveryNewPassword, setShowRecoveryNewPassword] = useState(false);
  const [showRecoveryConfirmPassword, setShowRecoveryConfirmPassword] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("recovery") !== "1") return;

    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const code = url.searchParams.get("code");
    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    if (!code && (fragment.get("type") !== "recovery" || accessToken === null || refreshToken === null)) return;
    window.history.replaceState(null, "", `${window.location.pathname}?recovery=1`);

    const finishRecoveryLink = async () => {
      const sessionResult = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : accessToken && refreshToken
          ? await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
          : null;
      if (!sessionResult) return;
      const { error: sessionError } = sessionResult;
      if (sessionError) {
        setRecoveryError(sessionError.message);
        return;
      }

      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) {
        setRecoveryError(userError.message);
        return;
      }

      setRecoveryEmail(data.user.email || "");
      setRecoveryLinkVerified(true);
      setRecoveryStep(2);
      setRecoveryMessage("Link verificado. Defina sua nova senha.");
      setShowRecovery(true);
    };

    void finishRecoveryLink();
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  };
  const openRecovery = () => {
    setRecoveryStep(1);
    setRecoveryEmail(email);
    setRecoveryToken("");
    setRecoveryLinkVerified(false);
    setRecoveryMessage("");
    setRecoveryError("");
    setShowRecovery(true);
  };
  const validateRecovery = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRecoveryLoading(true);
    setRecoveryError("");
    setRecoveryMessage("");
    const normalizedEmail = recoveryEmail.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setRecoveryError("Informe um e-mail válido.");
      setRecoveryLoading(false);
      return;
    }
    const { error: recoveryRequestError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: `${window.location.origin}/login?recovery=1`,
    });
    if (recoveryRequestError) {
      setRecoveryError(recoveryRequestError.message);
      setRecoveryLoading(false);
      return;
    }
    setRecoveryEmail(normalizedEmail);
    setRecoveryStep(2);
    setRecoveryMessage("Se o e-mail estiver cadastrado, enviaremos um código de recuperação.");
    setRecoveryLoading(false);
  };
  const updateRecoveryPassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    if (!recoveryPassword || recoveryPassword !== recoveryConfirmation) {
      setRecoveryError("As senhas não conferem.");
      return;
    }
    if (recoveryPassword.length < 6) {
      setRecoveryError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (!recoveryLinkVerified && !/^\d{6}$/.test(recoveryToken.trim())) {
      setRecoveryError("Informe o código de recuperação de 6 dígitos.");
      return;
    }
    setRecoveryLoading(true);
    setRecoveryError("");
    setRecoveryMessage("");
    if (!recoveryLinkVerified) {
      const { error: verificationError } = await supabase.auth.verifyOtp({
        email: recoveryEmail.trim().toLowerCase(),
        token: recoveryToken.trim(),
        type: "recovery",
      });
      if (verificationError) {
        setRecoveryError(verificationError.message);
        setRecoveryLoading(false);
        return;
      }
    }
    const { error: updateError } = await supabase.auth.updateUser({ password: recoveryPassword });
    if (updateError) {
      setRecoveryError(updateError.message);
      setRecoveryLoading(false);
      return;
    }
    setRecoveryPassword("");
    setRecoveryConfirmation("");
    setRecoveryToken("");
    setRecoveryLinkVerified(false);
    setShowRecovery(false);
    setSuccessToast("Senha alterada com sucesso!");
    window.setTimeout(() => setSuccessToast(""), 3500);
    setRecoveryLoading(false);
  };

  return (
    <AuthLayout>
      <div className="animate-rise rounded-2xl border border-white/5 bg-[#141517] p-6 sm:p-8">
        <div className="mb-8">
          <span className="inline-flex items-center rounded-full border border-[#FBC02D]/30 bg-[#FBC02D]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#F7D36A]">
            Acesso seguro
          </span>
          <h1 className="mt-4 text-3xl font-black uppercase tracking-[-0.05em] text-white">
            Acesse sua conta
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-300">
            Bem-vindo de volta. Continue gerenciando sua barbearia com
            eficiência.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              E-mail
            </label>
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
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
              Senha
            </label>
            <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-[#1B1C1E] px-3 py-3 transition-all duration-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20">
              <Lock className="h-4 w-4 text-[#FBC02D]" />
              <div className="relative w-full">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••••••"
                  className="w-full border-0 bg-transparent pr-10 text-sm text-white placeholder:text-gray-500 focus:outline-none"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-zinc-400 hover:text-amber-400 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={openRecovery}
              className="text-xs font-medium text-[#FBC02D] transition hover:text-[#f7d36a] hover:underline"
            >
              Esqueci minha senha
            </button>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            type="submit"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#FBC02D] px-4 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[#0b0b0d] shadow-[0_16px_30px_rgba(251,192,45,0.35)] transition-all duration-200 hover:bg-[#f5c94f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-300">
          Não tem conta?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#FBC02D] transition hover:text-[#f7d36a] hover:underline"
          >
            Criar conta
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-gray-300">
          <Link
            href="/"
            className="font-semibold text-[#FBC02D] transition hover:text-[#f7d36a] hover:underline"
          >
            Voltar para a página inicial
          </Link>
        </p>
      </div>
      {successToast && (
        <div className="fixed right-5 top-5 z-[60] rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-sm font-semibold text-emerald-200 shadow-2xl" role="status">
          {successToast}
        </div>
      )}
      {showRecovery && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowRecovery(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#141517] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Recuperar senha
                </h2>
                <p className="mt-1 text-xs text-gray-400">
                  {recoveryStep === 1
                    ? "Informe o e-mail cadastrado para receber um código"
                    : "Defina sua nova senha"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRecovery(false)}
                aria-label="Fechar recuperação"
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>
            {recoveryStep === 1 ? (
              <form onSubmit={validateRecovery} className="mt-6 space-y-4">
                <label className="block text-xs text-gray-400">
                  E-mail
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-white/5 bg-[#1B1C1E] p-3 text-sm text-white outline-none focus:border-[#FBC02D]"
                  />
                </label>
                <button
                  disabled={recoveryLoading}
                  type="submit"
                  className="w-full rounded-xl bg-[#FBC02D] px-4 py-3 text-sm font-bold text-[#0b0b0d] disabled:opacity-60"
                >
                  {recoveryLoading ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={updateRecoveryPassword}
                className="mt-6 space-y-4"
              >
                {!recoveryLinkVerified && (
                  <label className="block text-xs text-gray-400">
                    Código de 6 dígitos
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={recoveryToken}
                      onChange={(event) => setRecoveryToken(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="mt-1.5 w-full rounded-xl border border-white/5 bg-[#1B1C1E] p-3 text-sm text-white outline-none focus:border-[#FBC02D]"
                    />
                  </label>
                )}
                <label className="block text-xs text-gray-400">
                  Nova senha
                  <div className="relative w-full">
                    <input
                      required
                      type={showRecoveryNewPassword ? "text" : "password"}
                      value={recoveryPassword}
                      onChange={(event) => setRecoveryPassword(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/5 bg-[#1B1C1E] p-3 pr-10 text-sm text-white outline-none focus:border-[#FBC02D]"
                    />
                    <button type="button" aria-label={showRecoveryNewPassword ? "Ocultar nova senha" : "Mostrar nova senha"} onClick={() => setShowRecoveryNewPassword((current) => !current)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-zinc-400 hover:text-amber-400 focus:outline-none">
                      {showRecoveryNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
                <label className="block text-xs text-gray-400">
                  Confirmar nova senha
                  <div className="relative w-full">
                    <input
                      required
                      type={showRecoveryConfirmPassword ? "text" : "password"}
                      value={recoveryConfirmation}
                      onChange={(event) => setRecoveryConfirmation(event.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-white/5 bg-[#1B1C1E] p-3 pr-10 text-sm text-white outline-none focus:border-[#FBC02D]"
                    />
                    <button type="button" aria-label={showRecoveryConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"} onClick={() => setShowRecoveryConfirmPassword((current) => !current)} className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-zinc-400 hover:text-amber-400 focus:outline-none">
                      {showRecoveryConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
                <button
                  disabled={recoveryLoading}
                  type="submit"
                  className="w-full rounded-xl bg-[#FBC02D] px-4 py-3 text-sm font-bold text-[#0b0b0d] disabled:opacity-60"
                >
                  {recoveryLoading ? "Atualizando..." : "Salvar nova senha"}
                </button>
              </form>
            )}
            {recoveryError && (
              <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {recoveryError}
              </p>
            )}
            {recoveryMessage && (
              <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                {recoveryMessage}
              </p>
            )}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
