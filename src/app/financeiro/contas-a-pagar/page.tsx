"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

type Payable = {
  id: string;
  description: string;
  due_date: string;
  value: number;
  status: string;
  type?: string | null;
  category?: string | null;
  product_id?: string | null;
};

type ProductOption = {
  id: string;
  name: string;
  quantity: number;
};

type PayableForm = {
  description: string;
  due_date: string;
  value: string;
  status: string;
  category: string;
  productId: string;
  quantity: string;
};

const statuses = ["Pendente", "Pago", "Atrasado"];
const categoryOptions = ["Despesa Operacional", "Compra de Estoque"];
const emptyForm: PayableForm = {
  description: "",
  due_date: "",
  value: "",
  status: "Pendente",
  category: "Despesa Operacional",
  productId: "",
  quantity: "1",
};
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const inputClass =
  "mt-1.5 h-9 w-full rounded-xl border border-zinc-800 bg-[#1B1C1E] px-3 py-1.5 text-sm text-white outline-none focus:border-gold";
const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
const statusBadgeClass = (status: string) =>
  status === "Pago"
    ? "bg-emerald-900/40 text-emerald-300 border border-emerald-500/30"
    : status === "Atrasado"
      ? "bg-rose-900/40 text-rose-300 border border-rose-500/30"
      : "bg-amber-900/40 text-amber-300 border border-amber-500/30";
const normalizeTransactionType = (value?: string | null) => {
  const normalized = String(value ?? "").trim().toUpperCase();
  const mapping: Record<string, string> = {
    DESPESA: "despesa",
    SAIDA: "despesa",
    SAÍDA: "despesa",
    RECEITA: "receita",
    RECEBIDO: "receita",
    PAGO: "despesa",
    PAGAMENTO: "despesa",
    VENDIDO: "receita",
    VENDA: "receita",
  };
  return mapping[normalized] ?? "despesa";
};

export default function AccountsPayablePage() {
  const [purchases, setPurchases] = useState<Payable[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [categoryFilter, setCategoryFilter] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Payable | null>(null);
  const [form, setForm] = useState<PayableForm>(emptyForm);

  const loadProducts = async () => {
    const { data, error: productError } = await supabase
      .from("products")
      .select("id, name, quantity")
      .order("name");

    if (productError) {
      throw productError;
    }

    setProducts((data || []) as ProductOption[]);
  };

  const loadPurchases = async () => {
    try {
      setIsLoading(true);
      setError("");
      await loadProducts();
      const { data, error } = await supabase
        .from("financial_records")
        .select("*")
        .eq("type", normalizeTransactionType("despesa"));

      if (error) throw error;
      setPurchases(data || []);
    } catch (err) {
      console.error("Purchases fetch error:", err);
      setPurchases([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPurchases();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  const filteredRecords = useMemo(
    () =>
      purchases.filter((record) => {
        const matchText = record.description
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchStatus =
          statusFilter === "Todos" || record.status === statusFilter;
        const matchCategory =
          categoryFilter === "Todos" ||
          (record.category || "Despesa Operacional") === categoryFilter;
        return matchText && matchStatus && matchCategory;
      }),
    [purchases, query, statusFilter, categoryFilter],
  );

  const totals = useMemo(
    () => ({
      total: filteredRecords.length,
      pago: filteredRecords
        .filter((record) => record.status === "Pago")
        .reduce((sum, record) => sum + Number(record.value), 0),
      pendente: filteredRecords
        .filter((record) => record.status === "Pendente")
        .reduce((sum, record) => sum + Number(record.value), 0),
      atrasado: filteredRecords
        .filter((record) => record.status === "Atrasado")
        .reduce((sum, record) => sum + Number(record.value), 0),
    }),
    [filteredRecords],
  );

  const openCreate = () => {
    setEditingRecord(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (record: Payable) => {
    setEditingRecord(record);
    setForm({
      description: record.description,
      due_date: record.due_date,
      value: String(record.value),
      status: record.status,
      category: record.category || "Despesa Operacional",
      productId: record.product_id || "",
      quantity: "1",
    });
    setError("");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingRecord(null);
    setForm(emptyForm);
  };

  const saveRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const normalizedCategory = form.category || "Despesa Operacional";
    const purchaseQuantity = Number(form.quantity || "1");

    if (normalizedCategory === "Compra de Estoque") {
      if (!form.productId) {
        setError("Selecione o produto para registrar a compra de estoque.");
        setSaving(false);
        return;
      }
      if (!Number.isFinite(purchaseQuantity) || purchaseQuantity <= 0) {
        setError("Informe uma quantidade válida para a compra de estoque.");
        setSaving(false);
        return;
      }
    }

    const rawAmount = Number(String(form.value).replace(",", "."));
    const financialRecordPayload = {
      description: form.description.trim(),
      due_date: form.due_date,
      value: Number.isFinite(rawAmount) ? rawAmount : 0,
      type: normalizeTransactionType("despesa"),
      category: normalizedCategory,
      status: form.status,
    };

    try {
      if (!form.description.trim()) {
        throw new Error("Informe a descrição do lançamento.");
      }

      const result = editingRecord
        ? await supabase
            .from("financial_records")
            .update(financialRecordPayload)
            .eq("id", editingRecord.id)
            .select("id, description, due_date, value, status, type, category")
            .single()
        : await supabase
            .from("financial_records")
            .insert([financialRecordPayload])
            .select("id, description, due_date, value, status, type, category")
            .single();

      if (result.error) throw result.error;

      if (normalizedCategory === "Compra de Estoque" && form.productId) {
        const { data: productData, error: productLookupError } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", form.productId)
          .single();

        if (productLookupError) throw productLookupError;

        const currentQuantity = Number(productData?.quantity || 0);
        const newQuantity = currentQuantity + Number(purchaseQuantity || 0);

        const { error: stockError } = await supabase
          .from("products")
          .update({ quantity: newQuantity })
          .eq("id", form.productId);

        if (stockError) throw stockError;
      }

      const saved = result.data as Payable;
      setPurchases((current) =>
        editingRecord
          ? current.map((record) => (record.id === saved.id ? saved : record))
          : [...current, saved].sort((first, second) =>
              first.due_date.localeCompare(second.due_date),
            ),
      );

      await loadPurchases();
      setError("");
      setModalOpen(false);
      setEditingRecord(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("Full submission payload error:", err);
      const submissionError = err as { message?: string; hint?: string };
      setError(
        submissionError?.message ||
          submissionError?.hint ||
          JSON.stringify(err) ||
          "Erro ao salvar lançamento.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!window.confirm("Excluir este lançamento?")) return;
    try {
      const { error: deleteError } = await supabase
        .from("financial_records")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      setPurchases((current) => current.filter((record) => record.id !== id));
    } catch (requestError) {
      console.error("Erro ao excluir fluxo de compras:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : String(requestError),
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0e14] text-zinc-100 p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/finance"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 transition-colors hover:text-amber-300"
          >
            <ArrowLeft size={14} /> Financeiro
          </Link>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Fluxo de compras
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Controle de despesas e compras de estoque
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus size={17} /> Novo lançamento
        </button>
      </div>

      {error && !modalOpen && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl shadow-sm">
          <p className="text-xs uppercase tracking-widest text-zinc-400">
            Total de lançamentos
          </p>
          <p className="mt-3 text-2xl font-bold text-white">{totals.total}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl shadow-sm">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <p className="mt-4 text-xs uppercase tracking-widest text-zinc-400">
            Pagas
          </p>
          <p className="mt-2 text-xl font-bold text-emerald-400">
            {currency.format(totals.pago)}
          </p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl shadow-sm">
          <Clock3 size={20} className="text-amber-400" />
          <p className="mt-4 text-xs uppercase tracking-widest text-zinc-400">
            Pendentes
          </p>
          <p className="mt-2 text-xl font-bold text-amber-400">
            {currency.format(totals.pendente)}
          </p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-xl shadow-sm">
          <Clock3 size={20} className="text-rose-400" />
          <p className="mt-4 text-xs uppercase tracking-widest text-zinc-400">
            Atrasadas
          </p>
          <p className="mt-2 text-xl font-bold text-rose-400">
            {currency.format(totals.atrasado)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={17} className="absolute left-3 top-3 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por descrição"
            className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none w-full pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
        >
          <option>Todos</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none"
        >
          <option>Todos</option>
          {categoryOptions.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </div>

      <section className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/50 shadow-sm">
        <table className="w-full border-collapse min-w-[820px] text-left text-sm">
          <thead className="bg-zinc-900/80 text-[10px] uppercase tracking-[.12em] text-zinc-400">
            <tr>
              <th className="px-6 py-4">Descrição</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4">Vencimento</th>
              <th className="px-6 py-4">Valor</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-6 py-4 font-semibold text-zinc-100">
                  {record.description}
                </td>
                <td className="px-6 py-4 text-zinc-300">
                  {record.category || "Despesa Operacional"}
                </td>
                <td className="px-6 py-4 text-zinc-400">
                  {formatDate(record.due_date)}
                </td>
                <td className="px-6 py-4 font-bold text-white">
                  {currency.format(record.value)}
                </td>
                <td className="px-6 py-4">
                  <select
                    value={record.status}
                    onChange={(event) => {
                      const nextStatus = event.target.value;
                      void (async () => {
                        try {
                          const { error: updateError } = await supabase
                            .from("financial_records")
                            .update({ status: nextStatus })
                            .eq("id", record.id);
                          if (updateError) throw updateError;
                          setPurchases((current) =>
                            current.map((item) =>
                              item.id === record.id
                                ? { ...item, status: nextStatus }
                                : item,
                            ),
                          );
                        } catch (requestError) {
                          console.error("Erro ao atualizar status:", requestError);
                          setError(
                            requestError instanceof Error
                              ? requestError.message
                              : String(requestError),
                          );
                        }
                      })();
                    }}
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold outline-none ${statusBadgeClass(record.status)}`}
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      aria-label={`Editar ${record.description}`}
                      onClick={() => openEdit(record)}
                      className="text-zinc-400 hover:text-white transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Excluir ${record.description}`}
                      onClick={() => void deleteRecord(record.id)}
                      className="text-zinc-400 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isLoading && (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-10 animate-pulse rounded-lg bg-zinc-800/70"
              />
            ))}
          </div>
        )}

        {!isLoading && filteredRecords.length === 0 && (
          <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800 m-6">
            Nenhuma compra ou despesa registrada.
          </div>
        )}
      </section>

      {modalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveRecord}
            className="relative my-auto w-full max-w-lg rounded-xl border border-zinc-800 bg-[#16191E] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingRecord ? "Editar lançamento" : "Novo lançamento"}
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Cadastre despesas ou compras de estoque
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Fechar modal"
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-3">
              <label className="text-xs text-zinc-400">
                Categoria
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none mt-1.5 h-9 w-full"
                >
                  {categoryOptions.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </label>

              {form.category === "Compra de Estoque" && (
                <>
                  <label className="text-xs text-zinc-400">
                    Produto
                    <select
                      value={form.productId}
                      onChange={(event) =>
                        setForm({ ...form, productId: event.target.value })
                      }
                      className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none mt-1.5 h-9 w-full"
                    >
                      <option value="">Selecione um produto</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-zinc-400">
                    Quantidade comprada
                    <input
                      min="1"
                      type="number"
                      value={form.quantity}
                      onChange={(event) =>
                        setForm({ ...form, quantity: event.target.value })
                      }
                      className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none mt-1.5 h-9 w-full"
                    />
                  </label>
                </>
              )}

              <label className="text-xs text-zinc-400">
                Descrição
                <input
                  required
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none mt-1.5 h-9 w-full"
                />
              </label>

              <label className="text-xs text-zinc-400">
                Vencimento
                <input
                  required
                  type="date"
                  value={form.due_date}
                  onChange={(event) =>
                    setForm({ ...form, due_date: event.target.value })
                  }
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none mt-1.5 h-9 w-full"
                />
              </label>

              <label className="text-xs text-zinc-400">
                Valor
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.value}
                  onChange={(event) =>
                    setForm({ ...form, value: event.target.value })
                  }
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none mt-1.5 h-9 w-full"
                />
              </label>

              <label className="text-xs text-zinc-400">
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                  className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none mt-1.5 h-9 w-full"
                >
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
            </div>

            {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar lançamento"}
              </button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </div>
  );
}
