"use client";
import { useEffect, useState } from "react";
import { Clock3, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

type Service = { id: string; name: string; price: number; duration: number; descricao?: string | null };
const serviceColors = [
  "bg-gold",
  "bg-emerald-400",
  "bg-sky-400",
  "bg-rose-400",
];
const formatPrice = (price: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    price,
  );
const emptyForm = { nome: "", descricao: "", preco: "", duracao: "" };

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true);
      setError("");
      const { data, error: fetchError } = await supabase
        .from("services")
        .select("id, name, descricao, price, duration")
        .order("name");
      if (fetchError) {
        setError("Não foi possível carregar os serviços.");
        setServices([]);
      } else {
        setServices((data || []) as Service[]);
      }
      setLoading(false);
    };

    void loadServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setForm({
      nome: service.name,
      descricao: service.descricao || "",
      preco: String(service.price),
      duracao: String(service.duration),
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingService(null);
    setForm(emptyForm);
  };

  const saveService = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const nome = form.nome.trim();
    const preco = form.preco;
    const duracao = form.duracao;
    try {
      const result = editingService
        ? await supabase
            .from("services")
            .update({
              name: nome,
              descricao: form.descricao.trim() || null,
              price: parseFloat(String(preco).replace(",", ".")),
              duration: parseInt(duracao, 10),
            })
            .eq("id", editingService.id)
            .select("id, name, descricao, price, duration")
            .single()
        : await supabase
            .from("services")
            .insert([
              {
                name: nome,
                descricao: form.descricao.trim() || null,
                price: parseFloat(String(preco).replace(",", ".")),
                duration: parseInt(duracao, 10),
              },
            ])
            .select("id, name, descricao, price, duration")
            .single();

      if (result.error) {
        console.error("Erro retornado pelo Supabase ao salvar serviço:", result.error);
        throw result.error;
      }

      const savedService = result.data as Service;
      setServices((current) =>
        editingService
          ? current.map((service) =>
              service.id === savedService.id ? savedService : service,
            )
          : [...current, savedService],
      );
      setSaving(false);
      closeModal();
    } catch (error) {
      console.error("Erro completo do Supabase:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : String(error);
      setError(errorMessage);
      setSaving(false);
    }
  };

  return (
    <div className="animate-rise space-y-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Catálogo e preços</p>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Serviços
          </h2>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={17} /> Novo serviço
        </Button>
      </div>
      {loading && (
        <p className="text-sm text-gray-500">Carregando serviços...</p>
      )}
      {error && !modalOpen && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {services.map((service, index) => (
          <article
            key={service.id}
            className="rounded-xl border border-white/5 bg-[#16191E] p-5 transition-colors hover:bg-[#1B1C1E]"
          >
            <div
              className={`mb-6 h-1 w-10 rounded-full ${serviceColors[index % serviceColors.length]}`}
            />
            <h3 className="font-bold text-white">{service.name}</h3>
            {service.descricao && (
              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                {service.descricao}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
              <Clock3 size={14} /> {service.duration} min
            </div>
            <div className="mt-5 flex items-center justify-between">
              <strong className="text-lg text-gold">
                {formatPrice(service.price)}
              </strong>
              <button
                type="button"
                aria-label={`Editar ${service.name}`}
                onClick={() => openEditModal(service)}
                className="text-gray-500 hover:text-white"
              >
                <Pencil size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
          <form
            onSubmit={saveService}
            className="w-full max-w-lg rounded-xl border border-gray-700 bg-panel p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingService ? "Editar serviço" : "Novo serviço"}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Preencha os dados do serviço
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fechar modal"
                className="text-gray-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-xs text-gray-400 sm:col-span-2">
                Nome
                <input
                  required
                  value={form.nome}
                  onChange={(event) =>
                    setForm({ ...form, nome: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-gray-800 bg-surface p-2.5 text-sm text-white outline-none focus:border-gold"
                />
              </label>
              <label className="text-xs text-gray-400 sm:col-span-2">
                Descrição
                <textarea
                  rows={3}
                  value={form.descricao}
                  onChange={(event) =>
                    setForm({ ...form, descricao: event.target.value })
                  }
                  placeholder="Descreva brevemente este serviço"
                  className="mt-1.5 w-full resize-none rounded-lg border border-gray-800 bg-surface p-2.5 text-sm text-white outline-none focus:border-gold"
                />
              </label>
              <label className="text-xs text-gray-400">
                Preço
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.preco}
                  onChange={(event) =>
                    setForm({ ...form, preco: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-gray-800 bg-surface p-2.5 text-sm text-white outline-none focus:border-gold"
                />
              </label>
              <label className="text-xs text-gray-400">
                Duração (min)
                <input
                  required
                  min="1"
                  step="1"
                  type="number"
                  value={form.duracao}
                  onChange={(event) =>
                    setForm({ ...form, duracao: event.target.value })
                  }
                  className="mt-1.5 w-full rounded-lg border border-gray-800 bg-surface p-2.5 text-sm text-white outline-none focus:border-gold"
                />
              </label>
            </div>
            {modalOpen && error && (
              <p className="mt-4 text-sm text-red-400">{error}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancelar
              </Button>
              <Button disabled={saving} type="submit">
                {saving ? "Salvando..." : "Salvar serviço"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
