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

type Receivable = {
  id: string;
  description: string;
  due_date: string;
  value: number;
  status: string;
  type: "recebido";
};
type ReceivableForm = {
  clientName: string;
  productId: string;
  quantity: string;
  dueDate: string;
  value: string;
  status: string;
};
type ClientOption = { id: string; name: string };
type ProductOption = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};
const statuses = ["Pendente", "Recebido", "Atrasado"];
const emptyForm: ReceivableForm = {
  clientName: "",
  productId: "",
  quantity: "1",
  dueDate: "",
  value: "",
  status: "Pendente",
};
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const inputClass =
  "mt-1.5 h-9 w-full rounded-xl border border-zinc-800 bg-[#1B1C1E] px-3 py-1.5 text-sm text-white outline-none focus:border-gold";
const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
const statusClass = (status: string) =>
  status === "Recebido"
    ? "bg-emerald-900/40 text-emerald-400"
    : status === "Atrasado"
      ? "bg-rose-900/40 text-rose-400"
      : "bg-amber-900/40 text-amber-400";
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
  return mapping[normalized] ?? "receita";
};
const splitDescription = (description: string) => {
  const [clientName, ...serviceParts] = description.split(" — ");
  return {
    clientName,
    serviceDescription: serviceParts.join(" — ") || "Serviço não informado",
  };
};

export default function AccountsReceivablePage() {
  const [records, setRecords] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Receivable | null>(null);
  const [form, setForm] = useState<ReceivableForm>(emptyForm);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("financial_records")
        .select("id, description, due_date, value, status, type")
        .eq("type", normalizeTransactionType("recebido"))
        .order("due_date");
      if (fetchError) throw fetchError;
      setRecords((data || []) as Receivable[]);
    } catch (requestError) {
      console.error("Erro ao carregar contas a receber:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : String(requestError),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  useEffect(() => {
    const loadOptions = async () => {
      const [
        { data: clientData, error: clientError },
        { data: productData, error: productError },
      ] = await Promise.all([
        supabase.from("customers").select("id, name").order("name"),
        supabase
          .from("products")
          .select("id, name, price, quantity")
          .gt("quantity", 0)
          .order("name"),
      ]);
      if (clientError) setError(clientError.message);
      if (productError) setError(productError.message);
      setClients((clientData || []) as ClientOption[]);
      setProducts((productData || []) as ProductOption[]);
    };
    void loadOptions();
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
      records.filter(
        (record) =>
          record.description.toLowerCase().includes(query.toLowerCase()) &&
          (statusFilter === "Todos" || record.status === statusFilter),
      ),
    [records, query, statusFilter],
  );
  const totals = useMemo(
    () => ({
      total: filteredRecords.length,
      recebido: filteredRecords
        .filter((record) => record.status === "Recebido")
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
  const openEdit = (record: Receivable) => {
    const details = splitDescription(record.description);
    const client = clients.find((item) => item.name === details.clientName);
    const product = products.find(
      (item) => item.name === details.serviceDescription,
    );
    setEditingRecord(record);
    setForm({
      clientName: client?.id || "",
      productId: product?.id || "",
      quantity: "1",
      dueDate: record.due_date,
      value: String(record.value),
      status: record.status,
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

  const updateProductTotal = (productId: string, quantity: string) => {
    const product = products.find((item) => item.id === productId);
    const requestedQuantity = Math.max(1, Number(quantity) || 1);
    const safeQuantity = product
      ? Math.min(requestedQuantity, product.quantity)
      : requestedQuantity;
    setForm((current) => ({
      ...current,
      productId,
      quantity: String(safeQuantity),
      value: product ? String(product.price * safeQuantity) : "",
    }));
  };

  const saveRecord = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const client = clients.find((item) => item.id === form.clientName);
    const product = products.find((item) => item.id === form.productId);
    const quantity = Math.max(1, Number(form.quantity) || 1);
    if (product && quantity > product.quantity) {
      setError(`Quantidade indisponível. Restam ${product.quantity} unidades.`);
      setSaving(false);
      return;
    }
    const description = `${client?.name || form.clientName.trim()} — ${product?.name || "Produto não informado"}`;
    const payload = {
      description,
      due_date: form.dueDate,
      value: product
        ? product.price * quantity
        : Number(form.value.replace(",", ".")),
      status: form.status,
      type: normalizeTransactionType("recebido"),
    };
    try {
      const result = editingRecord
        ? await supabase
            .from("financial_records")
            .update(payload)
            .eq("id", editingRecord.id)
            .select("id, description, due_date, value, status, type")
            .single()
        : await supabase
            .from("financial_records")
            .insert([payload])
            .select("id, description, due_date, value, status, type")
            .single();
      if (result.error) throw result.error;
      const saved = result.data as Receivable;
      setRecords((current) =>
        editingRecord
          ? current.map((record) => (record.id === saved.id ? saved : record))
          : [...current, saved].sort((first, second) =>
              first.due_date.localeCompare(second.due_date),
            ),
      );
      setModalOpen(false);
      setEditingRecord(null);
      setForm(emptyForm);
    } catch (requestError) {
      console.error("Erro ao salvar conta a receber:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : String(requestError),
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!window.confirm("Excluir esta conta?")) return;
    try {
      const { error: deleteError } = await supabase
        .from("financial_records")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      setRecords((current) => current.filter((record) => record.id !== id));
    } catch (requestError) {
      console.error("Erro ao excluir conta a receber:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : String(requestError),
      );
    }
  };

  return (
    <div className="animate-rise space-y-6 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/finance"
            className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gold"
          >
            <ArrowLeft size={14} /> Financeiro
          </Link>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">
            Contas a receber
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe as receitas previstas
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={17} /> Nova Conta
        </Button>
      </div>
      {error && !modalOpen && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-[#16191E] p-5">
          <p className="text-xs uppercase tracking-widest text-gray-500">
            Total de contas
          </p>
          <p className="mt-3 text-2xl font-bold text-white">{totals.total}</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#16191E] p-5">
          <CheckCircle2 size={20} className="text-emerald-400" />
          <p className="mt-4 text-xs uppercase tracking-widest text-gray-500">
            Recebidas
          </p>
          <p className="mt-2 text-xl font-bold text-emerald-400">
            {currency.format(totals.recebido)}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#16191E] p-5">
          <Clock3 size={20} className="text-amber-400" />
          <p className="mt-4 text-xs uppercase tracking-widest text-gray-500">
            Pendentes
          </p>
          <p className="mt-2 text-xl font-bold text-amber-400">
            {currency.format(totals.pendente)}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#16191E] p-5">
          <Clock3 size={20} className="text-rose-400" />
          <p className="mt-4 text-xs uppercase tracking-widest text-gray-500">
            Atrasadas
          </p>
          <p className="mt-2 text-xl font-bold text-rose-400">
            {currency.format(totals.atrasado)}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={17} className="absolute left-3 top-3 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cliente ou serviço"
            className="w-full rounded-lg border border-gray-800 bg-surface py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-gold"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-800 bg-surface px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-gold"
        >
          <option>Todos</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </div>
      <section className="overflow-x-auto rounded-xl border border-gray-800 bg-panel">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-surface text-[10px] uppercase tracking-[.12em] text-gray-500">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Serviço realizado</th>
              <th className="px-6 py-4">Vencimento</th>
              <th className="px-6 py-4">Valor</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => {
              const details = splitDescription(record.description);
              return (
                <tr
                  key={record.id}
                  className="border-t border-white/5 hover:bg-zinc-800/40"
                >
                  <td className="px-6 py-4 font-semibold text-gray-200">
                    {details.clientName}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {details.serviceDescription}
                  </td>
                  <td className="px-6 py-4 text-gray-400">
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
                            setRecords((current) =>
                              current.map((item) =>
                                item.id === record.id
                                  ? { ...item, status: nextStatus }
                                  : item,
                              ),
                            );
                          } catch (requestError) {
                            console.error(
                              "Erro ao atualizar status:",
                              requestError,
                            );
                            setError(
                              requestError instanceof Error
                                ? requestError.message
                                : String(requestError),
                            );
                          }
                        })();
                      }}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold outline-none ${statusClass(record.status)}`}
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
                        className="text-gray-500 hover:text-white"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Excluir ${record.description}`}
                        onClick={() => void deleteRecord(record.id)}
                        className="text-gray-500 hover:text-rose-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {loading && (
          <p className="p-10 text-center text-sm text-gray-500">
            Carregando contas...
          </p>
        )}
        {!loading && filteredRecords.length === 0 && (
          <p className="p-10 text-center text-sm text-gray-500">
            Nenhuma conta encontrada.
          </p>
        )}
      </section>
      {modalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveRecord}
            className="relative my-auto flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#16191E] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingRecord ? "Editar conta" : "Nova conta"}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Informe cliente, serviço e cobrança
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
            <div className="space-y-3 overflow-y-auto overscroll-contain">
              <label className="text-xs text-gray-400">
                Cliente
                <select
                  required
                  value={form.clientName}
                  onChange={(event) =>
                    setForm({ ...form, clientName: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="col-span-2 text-xs text-gray-400">
                  Produto comprado
                  <select
                    required
                    value={form.productId}
                    onChange={(event) => updateProductTotal(event.target.value, form.quantity)}
                    className={inputClass}
                  >
                    <option value="">Selecione um produto</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {currency.format(product.price)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-gray-400">
                  Quantidade
                  <input
                    required
                    min="1"
                    max={products.find((item) => item.id === form.productId)?.quantity}
                    step="1"
                    type="number"
                    value={form.quantity}
                    onChange={(event) => updateProductTotal(form.productId, event.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
              {form.productId && (
                <p className="-mt-2 text-[11px] text-gray-500">
                  Disponível: {products.find((item) => item.id === form.productId)?.quantity || 0} un.
                </p>
              )}
              <div className="grid grid-cols-3 gap-3">
                <label className="text-xs text-gray-400">
                  Vencimento
                  <input
                    required
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-gray-400">
                  Valor
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={form.value}
                    onChange={(event) => setForm({ ...form, value: event.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-gray-400">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value })}
                    className={inputClass}
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>
              {error && <p className="text-sm text-rose-400">{error}</p>}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="ghost" className="h-9 px-4 text-sm" onClick={closeModal}>
                Cancelar
              </Button>
              <Button disabled={saving} type="submit" className="h-9 px-4 text-sm">
                {saving ? "Salvando..." : "Salvar conta"}
              </Button>
            </div>
          </form>
        </div>,
        document.body,
      )}
    </div>
  );
}
