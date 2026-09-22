"use client";
import { useEffect, useState } from "react";
import { MoreHorizontal, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  created_at: string | null;
  lastVisit: string;
  spent: string;
  status: "Ativo" | "Inativo";
};
type CustomerAppointment = { customer_id: string; date: string; status?: string | null; services?: { price?: number } | { price?: number }[] | null };
type CustomerForm = { name: string; phone: string; email: string; status: "ativo" | "inativo" };
const emptyForm: CustomerForm = { name: "", phone: "", email: "", status: "ativo" };
const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const isCompleted = (status?: string | null) => ["completed", "complete", "confirmed", "concluído", "concluido", "confirmado"].includes(String(status || "").toLowerCase());
const getService = (services: CustomerAppointment["services"]) => Array.isArray(services) ? services[0] : services;
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};
const formatDate = (value?: string | null) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime())
    ? new Date().toLocaleDateString("pt-BR")
    : date.toLocaleDateString("pt-BR");
};
const getErrorMessage = (requestError: unknown, fallback: string) => {
  if (requestError && typeof requestError === "object" && "message" in requestError) {
    return String(requestError.message) || fallback;
  }
  return requestError instanceof Error ? requestError.message || fallback : fallback;
};

const fetchCustomers = async (): Promise<Customer[]> => {
  const [{ data, error: fetchError }, { data: appointmentData, error: appointmentError }] = await Promise.all([
    supabase.from("customers").select("id, name, phone, email, status, created_at").order("name"),
    supabase.from("appointments").select("customer_id, date, status, services(price)").lte("date", new Date().toISOString().slice(0, 10)),
  ]);
  if (fetchError) throw fetchError;
  if (appointmentError) throw appointmentError;
  const appointments = (appointmentData || []) as CustomerAppointment[];
  const today = new Date().toISOString().slice(0, 10);
  return (data || []).map((customer) => {
    const customerAppointments = appointments.filter((appointment) => appointment.customer_id === customer.id && appointment.date <= today);
    const lastVisit = customerAppointments.reduce<string | null>((latest, appointment) => !latest || appointment.date > latest ? appointment.date : latest, null);
    const spent = customerAppointments.filter((appointment) => isCompleted(appointment.status)).reduce((total, appointment) => total + Number(getService(appointment.services)?.price || 0), 0);
    return { ...customer, lastVisit: lastVisit ? new Date(`${lastVisit}T12:00:00`).toLocaleDateString("pt-BR") : "Ainda não", spent: currency.format(spent), status: customer.status?.toLowerCase() === "inativo" ? "Inativo" : "Ativo" };
  });
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [modal, setModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const loadCustomers = async () => {
      setLoading(true);
      try {
        setCustomers(await fetchCustomers());
      } catch (requestError) {
        console.error("Erro ao carregar clientes:", requestError);
        setError(getErrorMessage(requestError, "Erro ao carregar clientes"));
      } finally {
        setLoading(false);
      }
    };
    void loadCustomers();
  }, []);
  const filtered = customers.filter(
    (customer) =>
      (customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.includes(query) ||
        customer.email.toLowerCase().includes(query.toLowerCase())) &&
      (status === "Todos" || customer.status === status),
  );
  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setError("");
    setModal(true);
  };
  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({ name: customer.name, phone: customer.phone, email: customer.email, status: customer.status.toLowerCase() as "ativo" | "inativo" });
    setError("");
    setModal(true);
  };
  const closeModal = () => {
    if (saving) return;
    setModal(false);
    setEditingCustomer(null);
    setForm(emptyForm);
  };
  const saveCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim(), status: form.status.toLowerCase() };
    try {
      const result = editingCustomer
        ? await supabase.from("customers").update(payload).eq("id", editingCustomer.id)
        : await supabase.from("customers").insert([payload]);
      if (result.error) throw result.error;
      setCustomers(await fetchCustomers());
      setModal(false);
      setEditingCustomer(null);
      setForm(emptyForm);
    } catch (requestError) {
      console.error("Erro ao salvar cliente:", requestError);
      setError(getErrorMessage(requestError, "Erro ao salvar cliente"));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="animate-rise space-y-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Relacionamento e histórico</p>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Clientes
          </h2>
        </div>
        <Button onClick={openCreateModal}>
          <Plus size={17} /> Cadastrar cliente
        </Button>
      </div>
      {loading && <p className="text-sm text-gray-500">Carregando clientes...</p>}
      {error && !modal && <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={17} className="absolute left-3 top-3 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, CPF ou telefone"
            className="w-full rounded-lg border border-gray-800 bg-surface py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-gold"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-lg border border-gray-800 bg-surface px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-gold"
        >
          <option>Todos</option>
          <option>Ativo</option>
          <option>Inativo</option>
        </select>
      </div>
      <section className="overflow-x-auto rounded-xl border border-gray-800 bg-panel">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-surface text-[10px] uppercase tracking-[.12em] text-gray-500">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Contato</th>
              <th className="px-6 py-4">Última visita</th>
              <th className="px-6 py-4">Total gasto</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => (
              <tr
                key={customer.id}
                className="border-t border-gray-800/70 hover:bg-zinc-800/40"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                      {customer.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <p className="font-bold text-white">{customer.name}</p>
                      <p className="text-xs text-gray-500">
                        Cliente desde {formatDate(customer.created_at)}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-gray-300">{customer.phone}</p>
                  <p className="text-xs text-gray-500">{customer.email}</p>
                </td>
                <td className="px-6 py-4 text-gray-400">
                  {customer.lastVisit}
                </td>
                <td className="px-6 py-4 font-bold text-gold">
                  {customer.spent}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${customer.status === "Ativo" ? "bg-emerald-900/40 text-emerald-400" : "bg-gray-800 text-gray-500"}`}
                  >
                    {customer.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    aria-label={`Ações de ${customer.name}`}
                    onClick={() => openEditModal(customer)}
                    className="text-gray-500 hover:text-white"
                  >
                    <MoreHorizontal size={19} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-10 text-center text-sm text-gray-500">
            Nenhum cliente encontrado.
          </p>
        )}
      </section>
      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5">
          <form
            onSubmit={saveCustomer}
            className="w-full max-w-md rounded-xl border border-gray-700 bg-panel p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingCustomer ? "Editar cliente" : "Cadastrar cliente"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-500"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-6 space-y-3">
              <input
                required
                name="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Nome completo"
                className="w-full rounded-lg border border-gray-800 bg-surface p-3 text-sm text-white outline-none focus:border-gold"
              />
              <input
                required
                name="phone"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: formatPhone(event.target.value) })}
                placeholder="(15) 99999-9999"
                maxLength={15}
                inputMode="tel"
                className="w-full rounded-lg border border-gray-800 bg-surface p-3 text-sm text-white outline-none focus:border-gold"
              />
              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="E-mail"
                className="w-full rounded-lg border border-gray-800 bg-surface p-3 text-sm text-white outline-none focus:border-gold"
              />
              <label className="block text-xs text-gray-400">
                Status
                <select
                  value={form.status}
                    onChange={(event) => setForm({ ...form, status: event.target.value as "ativo" | "inativo" })}
                  className="mt-1.5 w-full rounded-lg border border-gray-800 bg-surface p-3 text-sm text-white outline-none focus:border-gold"
                >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={closeModal}
              >
                Cancelar
              </Button>
              <Button disabled={saving} type="submit">{saving ? "Salvando..." : editingCustomer ? "Salvar alterações" : "Cadastrar"}</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
