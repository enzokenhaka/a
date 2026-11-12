"use client";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ImageIcon, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCurrentProfile } from "@/components/layout/PanelShell";
import { useShop } from "@/components/layout/shop-context";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { isPlanId, subscriptionPlans, type PlanId } from "@/lib/plans";

const inputClass =
  "mt-2 w-full rounded-xl border border-white/5 bg-[#1B1C1E] px-3.5 py-3 text-sm text-zinc-100 outline-none transition focus:border-amber-400";

const formatRole = (role?: string | null) => {
  if (!role) return "Não informado";
  const normalizedRole = role.toLowerCase();
  if (normalizedRole === "admin" || normalizedRole === "barber") {
    return "Administrador";
  }
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

type Subscription = {
  plan_id: PlanId;
  status: "active" | "cancelled";
  renewal_date: string | null;
};

const formatRenewalDate = (value: string | null) => {
  if (!value) return "Não informada";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Não informada" : date.toLocaleDateString("pt-BR");
};

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saved, setSaved] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [shopName, setShopName] = useState("Mister Manager OS");
  const [shopLogoUrl, setShopLogoUrl] = useState("/logo.png");
  const [shopSettingsId, setShopSettingsId] = useState<string | null>(null);
  const [savingShopSettings, setSavingShopSettings] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionFeedback, setSubscriptionFeedback] = useState("");
  const [subscriptionBusy, setSubscriptionBusy] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const profile = useCurrentProfile();
  const { refreshShop } = useShop();

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name || profile.email.split("@")[0]);
    setEmail(profile.email);
    setPhone(profile.phone || "");
    setAvatarUrl(profile.avatar_url || "");
  }, [profile]);

  useEffect(() => {
    const loadShopSettings = async () => {
      if (!isSupabaseConfigured) return;
      const { data, error } = await supabase
        .from("shop_settings")
        .select("id, shop_name, logo_url")
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setShopSettingsId(data.id ?? null);
        setShopName(data.shop_name || "Mister Manager OS");
        setShopLogoUrl(data.logo_url || "/logo.png");
      }
    };

    void loadShopSettings();
  }, []);

  useEffect(() => {
    if (!profile) return;
    if (!isSupabaseConfigured) {
      setSubscriptionFeedback("Configuração do Supabase indisponível.");
      setSubscriptionLoading(false);
      return;
    }
    let active = true;

    const loadSubscription = async () => {
      setSubscriptionLoading(true);
      setSubscriptionFeedback("");
      const { data, error } = await supabase
        .from("subscriptions")
        .select("plan_id, status, renewal_date")
        .eq("user_id", profile.id)
        .maybeSingle();

      if (!active) return;
      if (error) {
        setSubscriptionFeedback(`Não foi possível carregar o plano: ${error.message}`);
      } else if (data) {
        if (
          isPlanId(data.plan_id) &&
          (data.status === "active" || data.status === "cancelled") &&
          (data.renewal_date === null || typeof data.renewal_date === "string")
        ) {
          setSubscription({
            plan_id: data.plan_id,
            status: data.status,
            renewal_date: data.renewal_date,
          });
        } else {
          setSubscriptionFeedback("Os dados do plano têm um formato inválido.");
        }
      } else {
        setSubscription(null);
      }
      setSubscriptionLoading(false);
    };

    void loadSubscription();
    return () => {
      active = false;
    };
  }, [profile?.id]);

  const save = (message: string) => {
    setSaved(message);
    window.setTimeout(() => setSaved(""), 2500);
  };
  const logout = () => router.push("/login");
  const handleSaveChanges = async () => {
    if (!profile) {
      setSaved("Não foi possível identificar o usuário logado.");
      return;
    }
    setSavingChanges(true);
    setSaved("");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name, phone })
      .eq("id", profile.id);
    if (error) setSaved(`Erro ao salvar alterações: ${error.message}`);
    else setSaved("Alterações salvas com sucesso!");
    setSavingChanges(false);
  };
  const handlePasswordUpdate = async () => {
    if (!newPassword || !confirmPassword) {
      save("Preencha a nova senha e a confirmação.");
      return;
    }
    if (newPassword !== confirmPassword) {
      save("As senhas não conferem.");
      return;
    }
    if (newPassword.length < 6) {
      save("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setSavingChanges(true);
    setSaved("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setSaved(`Erro ao atualizar senha: ${error.message}`);
    } else {
      setSaved("Senha atualizada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingChanges(false);
  };
  const cancelSubscription = async () => {
    if (!window.confirm("Deseja cancelar seu plano atual?")) return;
    setSubscriptionBusy(true);
    setSubscriptionFeedback("");
    const { data, error } = await supabase.rpc("cancel_my_subscription");
    if (error) {
      setSubscriptionFeedback(`Não foi possível cancelar o plano: ${error.message}`);
    } else if (!data) {
      setSubscriptionFeedback("Não há um plano ativo para cancelar.");
    } else {
      setSubscription((current) => current ? { ...current, status: "cancelled" } : current);
      setSubscriptionFeedback("Plano cancelado.");
    }
    setSubscriptionBusy(false);
  };
  const handleSaveBranding = async () => {
    if (!isSupabaseConfigured) {
      setSaved("Configuração do Supabase indisponível.");
      return;
    }

    const payload = {
      shop_name: shopName.trim() || "Mister Manager OS",
      logo_url: shopLogoUrl || "/logo.png",
    };

    setSavingShopSettings(true);
    setSaved("");

    try {
      if (shopSettingsId) {
        const { error } = await supabase
          .from("shop_settings")
          .update(payload)
          .eq("id", shopSettingsId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("shop_settings")
          .insert(payload)
          .select("id")
          .single();

        if (error) throw error;
        if (data?.id) setShopSettingsId(data.id);
      }

      await refreshShop();
      setSaved("Configurações salvas com sucesso!");
    } catch (error) {
      setSaved(
        error instanceof Error ? `Erro ao salvar personalização: ${error.message}` : "Erro ao salvar personalização.",
      );
    } finally {
      setSavingShopSettings(false);
    }
  };
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    setUploadingAvatar(true);
    setSaved("");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profile.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: false, contentType: file.type });
    if (uploadError) {
      setSaved(`Não foi possível enviar a foto: ${uploadError.message}`);
      setUploadingAvatar(false);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", profile.id);
    if (profileError)
      setSaved(
        `Foto enviada, mas não foi possível salvar o perfil: ${profileError.message}`,
      );
    else {
      setAvatarUrl(data.publicUrl);
      setSaved("Foto atualizada");
    }
    setUploadingAvatar(false);
    event.target.value = "";
  };
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setShopLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  return (
    <div className="animate-rise space-y-4 p-3 sm:p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Minha Conta</h2>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>
      </div>
      {saved && (
        <p className="rounded-lg border border-emerald-900/60 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400">
          {saved}
        </p>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="flex flex-col items-center rounded-xl bg-[#1F1F1F] p-6 text-center shadow-lg">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_25%,#d9b76a,#7a5424_75%)] text-3xl font-bold uppercase text-white">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name || "Foto do perfil"}
                className="h-full w-full rounded-full object-cover"
              />
            ) : name ? (
              name.slice(0, 2)
            ) : (
              <span className="h-10 w-10 animate-pulse rounded-full bg-white/20" />
            )}
          </div>
          <h3 className="mt-4 text-xl font-bold text-white">
            {name || (
              <span className="inline-block h-6 w-32 animate-pulse rounded bg-gray-700" />
            )}
          </h3>
          <p className="mt-1 text-xs font-semibold tracking-wider text-[#FBC02D]">
            {profile ? formatRole(profile.role) : "..."}
          </p>
          <p className="mt-1 break-all text-xs text-gray-500">
            {email || (
              <span className="inline-block h-3 w-44 animate-pulse rounded bg-gray-700" />
            )}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={uploadAvatar}
            className="hidden"
          />
          <button
            disabled={!profile || uploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 rounded-md border border-gray-700 bg-transparent px-3 py-1.5 text-xs text-gray-300 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploadingAvatar ? "Enviando..." : "Alterar foto"}
          </button>
          <button
            onClick={logout}
            className="mt-6 w-full rounded-lg border border-red-900/50 bg-transparent py-2.5 text-sm text-red-500 transition hover:bg-red-950/20"
          >
            Sair da conta
          </button>
        </aside>
        <div className="space-y-6">
          <section className="rounded-xl bg-[#1F1F1F] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold text-white">Meu Plano</h3>
                <p className="mt-1 text-xs text-gray-500">Status e gerenciamento da assinatura</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                subscription?.status === "active"
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-zinc-700/60 text-zinc-300"
              }`}>
                {subscriptionLoading ? "Carregando..." : subscription?.status === "active" ? "Ativo" : subscription?.status === "cancelled" ? "Cancelado" : subscriptionFeedback ? "Indisponível" : "Sem plano"}
              </span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Plano</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {subscriptionPlans.find((plan) => plan.id === subscription?.plan_id)?.name ?? "Nenhum plano ativo"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Renovação</p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {subscription?.status === "active" ? formatRenewalDate(subscription.renewal_date) : "—"}
                </p>
              </div>
            </div>
            {subscriptionFeedback && (
              <p role="status" className="mt-4 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300">
                {subscriptionFeedback}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setPlanModalOpen(true)}
                className="rounded-lg bg-[#FBBF24] px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-[#F59E0B]"
              >
                Mudar de Plano
              </button>
              {subscription?.status === "active" && (
                <button
                  type="button"
                  disabled={subscriptionBusy}
                  onClick={() => void cancelSubscription()}
                  className="rounded-lg border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {subscriptionBusy ? "Cancelando..." : "Cancelar Plano"}
                </button>
              )}
            </div>
          </section>

          <section className="rounded-xl bg-[#1F1F1F] p-6">
            <h3 className="mb-4 text-base font-semibold text-white">
              Dados pessoais
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-gray-400">
                Nome completo
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-xs text-gray-400">
                Cargo
                <input
                  value={profile ? formatRole(profile.role) : ""}
                  readOnly
                  placeholder={profile ? "Não informado" : "Carregando..."}
                  className={`${inputClass} cursor-not-allowed opacity-60`}
                />
              </label>
              <label className="text-xs text-gray-400">
                E-mail
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="text-xs text-gray-400">
                Telefone
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={profile ? "Não informado" : "Carregando..."}
                  className={inputClass}
                />
              </label>
            </div>
            <button
              disabled={savingChanges || !profile}
              onClick={handleSaveChanges}
              className="mt-4 rounded-lg bg-[#FBC02D] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#D4AC0D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingChanges ? "Salvando..." : "Salvar alterações"}
            </button>
          </section>

          <section className="rounded-xl bg-[#1F1F1F] p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FBC02D]/10 text-[#FBC02D] ring-1 ring-[#FBC02D]/20">
                <ImageIcon size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Personalização</h3>
                <p className="text-xs text-gray-500">Logo e identidade visual da sua barbearia</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-gray-400 sm:col-span-2">
                Nome da Barbearia
                <input
                  value={shopName}
                  onChange={(event) => setShopName(event.target.value)}
                  placeholder="Mister Manager OS"
                  className={inputClass}
                />
              </label>

              <label className="text-xs text-gray-400 sm:col-span-2">
                URL da Logo
                <input
                  value={shopLogoUrl}
                  onChange={(event) => setShopLogoUrl(event.target.value)}
                  placeholder="https://.../logo.png"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src={shopLogoUrl || "/logo.png"}
                  alt="Pré-visualização da logo"
                  width={48}
                  height={48}
                  priority
                  unoptimized
                  className="h-12 w-12 rounded-xl border border-white/5 bg-[#0D0F12] object-contain p-1"
                  onError={(event) => {
                    event.currentTarget.src = "/logo.png";
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-white">{shopName || "Mister Manager OS"}</p>
                  <p className="text-xs text-gray-500">Pré-visualização</p>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-white/5"
                >
                  Enviar imagem
                </button>
                <button
                  type="button"
                  disabled={savingShopSettings}
                  onClick={handleSaveBranding}
                  className="rounded-lg bg-[#FBC02D] px-4 py-2 text-sm font-semibold text-black transition hover:bg-[#D4AC0D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingShopSettings ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-xl bg-[#1F1F1F] p-6">
            <h3 className="mb-4 text-base font-semibold text-white">
              Segurança
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-gray-400 sm:col-span-2">
                Senha atual
                <div className="relative w-full">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Digite sua senha atual"
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" aria-label={showCurrent ? "Ocultar senha atual" : "Mostrar senha atual"} onClick={() => setShowCurrent((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 z-10 focus:outline-none">
                    {showCurrent ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label className="text-xs text-gray-400">
                Nova senha
                <div className="relative w-full">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Digite a nova senha"
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" aria-label={showNew ? "Ocultar nova senha" : "Mostrar nova senha"} onClick={() => setShowNew((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 z-10 focus:outline-none">
                    {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
              <label className="text-xs text-gray-400">
                Confirmar nova senha
                <div className="relative w-full">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repita a nova senha"
                    className={`${inputClass} pr-10`}
                  />
                  <button type="button" aria-label={showConfirm ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"} onClick={() => setShowConfirm((current) => !current)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-amber-400 z-10 focus:outline-none">
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
            </div>
            <button
              type="button"
              disabled={savingChanges}
              onClick={() => void handlePasswordUpdate()}
              className="mt-4 rounded-lg bg-[#FBC02D] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-[#D4AC0D] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingChanges ? "Atualizando..." : "Atualizar senha"}
            </button>
          </section>
        </div>
      </div>
      {planModalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPlanModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#16191E] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Escolha um plano</h3>
              <button type="button" onClick={() => setPlanModalOpen(false)} aria-label="Fechar" className="text-zinc-400 hover:text-white">×</button>
            </div>
            <p className="mt-2 text-sm text-zinc-400">Você continuará no checkout para revisar a opção escolhida.</p>
            <div className="mt-5 space-y-3">
              {subscriptionPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => router.push(`/checkout?plan=${plan.id}&step=payment`)}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-3 text-left transition hover:border-amber-400/60"
                >
                  <span className="font-semibold text-white">{plan.name}</span>
                  <span className="text-sm text-zinc-400">R$ {plan.monthly}/mês</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
