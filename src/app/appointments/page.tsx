"use client";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CreditCard, Edit3, GripVertical, Package, Plus, Search, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Appointment,
  ModalAppointment,
  ServiceOption,
} from "@/components/appointments/ModalAppointment";

const hours = Array.from({ length: 25 }, (_, index) => {
  const total = 8 * 60 + index * 30;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
});
const calendarStartMinutes = 8 * 60;
const slotHeight = 64;
const pixelsPerMinute = slotHeight / 30;
const minutes = (time: string) => {
  const [hour, minute] = time.split(":").map(Number);
  return (hour - 8) * 60 + minute;
};
const formatTime = (time: string) => time.split(":").slice(0, 2).join(":");
const startOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  result.setHours(0, 0, 0, 0);
  return result;
};
const isoDate = (date: Date) => date.toISOString().slice(0, 10);
const weekDays = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];
const weekDifference = (date: Date, reference: Date) =>
  Math.round(
    (startOfWeek(date).getTime() - startOfWeek(reference).getTime()) /
      (7 * 24 * 60 * 60 * 1000),
  );
const getWeekIndicator = (date: Date, today: Date) => {
  const difference = weekDifference(date, today);
  if (difference === 0) return "Semana atual";
  if (difference === 1) return "Semana que vem";
  if (difference === -1) return "Semana passada";
  if (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth()
  )
    return "Mês atual";
  if (difference > 0) return "Próximo mês";
  if (difference < 0) return "Mês passado";
  return date.toLocaleDateString("pt-BR", { month: "long" });
};
const buildAppointmentFinancialDescription = (
  customerName?: string | null,
  serviceName?: string | null,
) => `Agendamento - ${customerName || "Cliente"} - ${serviceName || "Serviço"}`;
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
const normalizePaymentMethod = (value?: string | null) => {
  const normalized = String(value ?? "").trim();
  const upper = normalized.toUpperCase();
  if (upper === "DINHEIRO") return "DINHEIRO";
  if (upper === "PIX") return "PIX";
  if (upper === "CARTAO_CREDITO" || upper === "CARTÃO DE CRÉDITO" || upper === "CARTAO CREDITO") return "CARTAO_CREDITO";
  if (upper === "CARTAO_DEBITO" || upper === "CARTÃO DE DÉBITO" || upper === "CARTAO DEBITO") return "CARTAO_DEBITO";
  return upper || "PIX";
};
type CalendarView = "day" | "week" | "month";
const shortDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const toMinutes = (time: string) => { const [hour, minute] = time.split(":").map(Number); return hour * 60 + minute; };
const fromMinutes = (value: number) => `${String(Math.floor(value / 60) % 24).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const formatDateLabel = (date: Date, view: CalendarView, end?: Date) => {
  if (view === "month") return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  if (view === "day") return date.toLocaleDateString("pt-BR", { month: "long", day: "numeric", year: "numeric" });
  return `${date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" })} – ${end?.toLocaleDateString("pt-BR", { month: "short", day: "numeric", year: "numeric" })}`;
};

type CheckoutProductOption = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CheckoutLine = {
  productId: string;
  quantity: number;
};

function CheckoutModal({
  appointment,
  onClose,
  onComplete,
}: {
  appointment: Appointment & { status?: string | null };
  onClose: () => void;
  onComplete: () => Promise<void>;
}) {
  const [products, setProducts] = useState<CheckoutProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("PIX");
  const [lines, setLines] = useState<CheckoutLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const customer = Array.isArray(appointment.customers)
    ? appointment.customers[0]
    : appointment.customers;
  const service = Array.isArray(appointment.services)
    ? appointment.services[0]
    : appointment.services;

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow || 'unset'; };
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      const { data, error: productError } = await supabase
        .from('products')
        .select('id, name, price, quantity')
        .gt('quantity', 0)
        .order('name');

      if (productError) {
        setError(productError.message || 'Não foi possível carregar os produtos.');
        return;
      }

      setProducts((data || []) as CheckoutProductOption[]);
      if ((data || []).length > 0) {
        setSelectedProductId((data || [])[0].id);
      }
    };

    void loadProducts();
  }, []);

  const serviceTotal = Number(service?.price || 0);
  const lineTotal = lines.reduce((sum, line) => {
    const product = products.find((item) => item.id === line.productId);
    if (!product) return sum;
    return sum + product.price * line.quantity;
  }, 0);
  const total = serviceTotal + lineTotal;

  const addProduct = () => {
    if (!selectedProductId) return;
    const product = products.find((item) => item.id === selectedProductId);
    if (!product) return;
    const alreadySelected = lines.find((item) => item.productId === selectedProductId);
    if (alreadySelected) {
      setLines((current) => current.map((item) => item.productId === selectedProductId ? { ...item, quantity: item.quantity + selectedQuantity } : item));
      return;
    }
    setLines((current) => [...current, { productId: selectedProductId, quantity: selectedQuantity }]);
  };

  const updateLineQuantity = (productId: string, delta: number) => {
    setLines((current) => current.map((item) => item.productId === productId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item).filter((item) => item.quantity > 0));
  };

  const removeLine = (productId: string) => {
    setLines((current) => current.filter((item) => item.productId !== productId));
  };

  const saveCheckout = async () => {
    if (!paymentMethod) {
      setError('Selecione uma forma de pagamento.');
      return;
    }

    setSaving(true);
    setError('');

    const paymentEnumValue = normalizePaymentMethod(paymentMethod);
    const customerName = customer?.name || 'Cliente Avulso';

    try {
      const salePayload = {
        appointment_id: appointment.id,
        customer_name: customerName,
        total_amount: Number(total) || 0,
        payment_method: paymentEnumValue,
        status: 'Concluído',
      };

      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert(salePayload)
        .select('id')
        .single();

      if (saleError) throw saleError;

      const saleId = saleData?.id;

      for (const line of lines) {
        const product = products.find((item) => item.id === line.productId);
        if (!product) continue;

        const { error: itemError } = await supabase.from('sale_items').insert({
          sale_id: saleId,
          product_id: line.productId,
          description: product.name,
          quantity: Number(line.quantity),
          unit_price: Number(product.price),
        });

        if (itemError) throw itemError;

        const { data: currentProductData, error: currentProductError } = await supabase
          .from('products')
          .select('quantity')
          .eq('id', line.productId)
          .single();

        if (currentProductError) throw currentProductError;

        const currentStock = Number(currentProductData?.quantity ?? 0);
        const soldQuantity = Number(line.quantity);
        const newQuantity = Math.max(0, currentStock - soldQuantity);

        const { error: stockError } = await supabase
          .from('products')
          .update({ quantity: newQuantity })
          .eq('id', line.productId);

        if (stockError) throw stockError;
      }

      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({ status: 'Concluído' })
        .eq('id', appointment.id);

      if (appointmentError) throw appointmentError;

      const financialDescription = `Venda de serviço - ${customerName} - ${service?.name || 'Serviço'}`;
      const { error: financialError } = await supabase.from('financial_records').insert({
        description: financialDescription,
        type: normalizeTransactionType('receita'),
        status: 'Recebido',
        value: Number(total) || 0,
        due_date: appointment.date,
        category: 'Venda de Serviço',
        payment_method: paymentEnumValue,
      });

      if (financialError) throw financialError;

      setLines([]);
      setSelectedProductId(products[0]?.id ?? '');
      setSelectedQuantity(1);
      setPaymentMethod('PIX');
      await onComplete();
      onClose();
    } catch (err) {
      console.error('Checkout execution error details:', err);
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message || (err as { details?: string }).details || JSON.stringify(err) || 'Erro ao concluir a venda.')
          : err instanceof Error
            ? err.message
            : JSON.stringify(err) || 'Erro ao concluir a venda.'
      );
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/5 bg-[#141517] p-6" role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 id="checkout-modal-title" className="text-xl font-bold text-white">Finalizar venda</h3>
            <p className="mt-1 text-xs text-gray-500">Resumo do serviço e produtos adicionais</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar checkout" className="text-gray-500 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 grid gap-4 rounded-xl border border-white/5 bg-[#181a1d] p-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Cliente</p>
            <p className="mt-2 text-base font-semibold text-white">{customer?.name || 'Cliente não identificado'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Serviço</p>
            <p className="mt-2 text-base font-semibold text-white">{service?.name || 'Serviço agendado'}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Valor do serviço</p>
            <p className="mt-2 text-lg font-bold text-gold">{Number(service?.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500">Data do agendamento</p>
            <p className="mt-2 text-base font-semibold text-white">{new Date(`${appointment.date}T00:00:00`).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/5 bg-[#181a1d] p-4">
          <div className="mb-3 flex items-center gap-2 text-white">
            <Package size={16} className="text-gold" />
            <h4 className="text-base font-semibold">Adicionar produtos</h4>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-800 bg-[#20242C] p-2.5 text-sm text-white outline-none focus:border-gold">
              <option value="">Selecione um produto</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name} • {product.quantity} em estoque • {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</option>
              ))}
            </select>
            <input type="number" min={1} value={selectedQuantity} onChange={(event) => setSelectedQuantity(Math.max(1, Number(event.target.value) || 1))} className="mt-1.5 w-24 rounded-lg border border-gray-800 bg-[#20242C] p-2.5 text-sm text-white outline-none focus:border-gold" />
            <button type="button" onClick={addProduct} className="mt-1.5 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-ink hover:bg-gold-soft">Adicionar</button>
          </div>

          {lines.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Nenhum produto adicionado.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {lines.map((line) => {
                const product = products.find((item) => item.id === line.productId);
                if (!product) return null;
                return (
                  <div key={line.productId} className="flex flex-col gap-3 rounded-lg border border-white/5 bg-[#111315] p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-white">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} cada</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateLineQuantity(line.productId, -1)} className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-[#20242C] text-white">-</button>
                      <span className="min-w-8 text-center text-sm font-semibold text-white">{line.quantity}</span>
                      <button type="button" onClick={() => updateLineQuantity(line.productId, 1)} className="grid h-8 w-8 place-items-center rounded-md border border-white/10 bg-[#20242C] text-white">+</button>
                      <button type="button" onClick={() => removeLine(line.productId)} className="ml-2 text-red-400 hover:text-red-300">Remover</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-white/5 bg-[#181a1d] p-4">
          <label className="block text-xs text-gray-400">
            Forma de pagamento
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1.5 w-full rounded-lg border border-gray-800 bg-[#20242C] p-2.5 text-sm text-white outline-none focus:border-gold">
              <option value="PIX">PIX</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Dinheiro">Dinheiro</option>
            </select>
          </label>

          <div className="mt-4 space-y-2 border-t border-white/5 pt-4 text-sm text-zinc-300">
            <div className="flex items-center justify-between"><span>Serviço</span><span>{serviceTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            <div className="flex items-center justify-between"><span>Produtos</span><span>{lineTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
            <div className="flex items-center justify-between text-base font-bold text-white"><span>Total</span><span>{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-white/5">Cancelar</button>
          <button type="button" onClick={() => void saveCheckout()} disabled={saving} className="rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ink hover:bg-gold-soft disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'Processando...' : 'Salvar venda'}
          </button>
        </div>
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services] = useState<ServiceOption[]>([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [modal, setModal] = useState<{ date: string; time: string } | null>(
    null,
  );
  const [checkoutAppointment, setCheckoutAppointment] = useState<(Appointment & { status?: string | null }) | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<CalendarView>("week");
  const [search, setSearch] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const today = useMemo(() => new Date(), []);
  const week = useMemo(
    () =>
      weekDays.map((day, index) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + index);
        return {
          day,
          date: isoDate(date),
          label: date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          }),
        };
      }),
    [weekStart],
  );
  const weekIndicator = getWeekIndicator(weekStart, today);
  const visibleDays = view === "day" ? week.filter((day) => day.date === isoDate(selectedDate)) : week;
  const dateLabel = formatDateLabel(view === "week" ? weekStart : selectedDate, view, new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6));
  const monthCells = useMemo(() => {
    const first = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(first);
      date.setDate(index - offset + 1);
      return { date: isoDate(date), day: date.getDate(), current: date.getMonth() === weekStart.getMonth() };
    });
  }, [weekStart]);
  const loadData = async () => {
    setLoading(true);
    setError("");
    const { data: appointmentData, error: appointmentError } = await supabase
      .from("appointments")
      .select('*, services(*), customers!fk_appointments_customer(name)')
      .order("date")
      .order("start_time");
    if (appointmentError)
      setError(
        appointmentError.message || "Não foi possível carregar a agenda.",
      );
    else setError("");
    setAppointments((appointmentData || []) as Appointment[]);
    setLoading(false);
  };
  useEffect(() => {
    void loadData();
  }, []);
  const save = async (data: Omit<Appointment, "id" | "services">) => {
    if (!data.customer_id || !data.barber_id) {
      setError("Selecione um cliente e um barbeiro para criar o agendamento.");
      return;
    }
    if (editingAppointment) {
      const { data: updated, error: updateError } = await supabase
        .from("appointments")
        .update(data)
        .eq("id", editingAppointment.id)
        .select('*, services(*), customers!fk_appointments_customer(name)')
        .single();
      if (updateError) { setError(updateError.message); return; }
      setAppointments((current) => current.map((item) => item.id === editingAppointment.id ? updated as Appointment : item));
      setEditingAppointment(null);
      setModal(null);
      return;
    }
    const { data: created, error: insertError } = await supabase
      .from("appointments")
      .insert({
        customer_id: data.customer_id,
        barber_id: data.barber_id,
        service_id: data.service_id,
        date: data.date,
        start_time: data.start_time,
        end_time: data.end_time,
      })
      .select('*, services(*), customers!customer_id(name)')
      .single();
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (created)
      setAppointments((current) => [...current, created as Appointment]);

    try {
      const appointment = created as Appointment;
      const serviceRelation = Array.isArray(appointment.services)
        ? appointment.services[0]
        : appointment.services;
      const customerRelation = Array.isArray(appointment.customers)
        ? appointment.customers[0]
        : appointment.customers;

      const [{ data: serviceData, error: serviceError }, { data: customerData, error: customerError }] = await Promise.all([
        serviceRelation?.name && typeof serviceRelation.price === 'number'
          ? Promise.resolve({ data: serviceRelation, error: null })
          : supabase.from('services').select('name, price').eq('id', data.service_id).maybeSingle(),
        customerRelation?.name
          ? Promise.resolve({ data: customerRelation, error: null })
          : supabase.from('customers').select('name').eq('id', data.customer_id).maybeSingle(),
      ]);

      if (serviceError) throw serviceError;
      if (customerError) throw customerError;

      const financialDescription = buildAppointmentFinancialDescription(
        customerData?.name || customerRelation?.name || 'Cliente',
        serviceData?.name || serviceRelation?.name || 'Serviço',
      );

      const financialValue = Number(serviceData?.price || serviceRelation?.price || 0);

      const financialPayload = {
        description: financialDescription,
        type: normalizeTransactionType('recebido'),
        status: 'Pendente',
        value: financialValue,
        due_date: data.date,
      };

      const { error: financialError } = await supabase
        .from('financial_records')
        .insert([financialPayload]);

      if (financialError) {
        const fallbackResult = await supabase.from('financial_records').insert([
          {
            description: financialDescription,
            type: normalizeTransactionType('recebido'),
            status: 'Pendente',
            value: financialValue,
            due_date: data.date,
          },
        ]);
        if (fallbackResult.error) throw fallbackResult.error;
      }
    } catch (financialError) {
      console.warn('Erro ao criar registro financeiro do agendamento:', financialError);
    }
    setModal(null);
    setEditingAppointment(null);
  };
  const handleDelete = async (id: string) => {
    setError("");
    try {
      const appointmentToDelete = appointments.find((appointment) => appointment.id === id);
      const serviceName = Array.isArray(appointmentToDelete?.services)
        ? appointmentToDelete.services[0]?.name
        : appointmentToDelete?.services?.name;
      const customerName = Array.isArray(appointmentToDelete?.customers)
        ? appointmentToDelete.customers[0]?.name
        : appointmentToDelete?.customers?.name;

      const { error: deleteError } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;

      const descriptionPattern = buildAppointmentFinancialDescription(customerName, serviceName);
      const deleteByDescription = await supabase
        .from("financial_records")
        .delete()
        .or(`description.eq.${descriptionPattern},description.ilike.%Agendamento - ${customerName || "Cliente"} - ${serviceName || "Serviço"}%`)
        .eq("type", normalizeTransactionType("recebido"));

      if (deleteByDescription.error) {
        console.warn("Não foi possível remover a movimentação financeira do agendamento apagado:", {
          descriptionError: deleteByDescription.error,
        });
      }

      setAppointments((current) => current.filter((appointment) => appointment.id !== id));
    } catch (deleteError) {
      console.error("Erro ao excluir agendamento:", deleteError);
      setError(deleteError instanceof Error ? deleteError.message : String(deleteError));
    }
  };
  const handleDrop = async (date: string, time: string) => {
    if (!draggedId) return;
    const appointment = appointments.find((item) => item.id === draggedId);
    if (!appointment) return;
    const duration = Math.max(30, toMinutes(appointment.end_time) - toMinutes(appointment.start_time));
    const endTime = fromMinutes(toMinutes(time) + duration);
    setAppointments((current) => current.map((item) => item.id === draggedId ? { ...item, date, start_time: time, end_time: endTime } : item));
    const { error: updateError } = await supabase.from("appointments").update({ date, start_time: time, end_time: endTime }).eq("id", draggedId);
    if (updateError) { setError(updateError.message); void loadData(); }
    setDraggedId(null);
  };
  const shown = appointments.filter((item) => {
    const customer = Array.isArray(item.customers) ? item.customers[0] : item.customers;
    const service = Array.isArray(item.services) ? item.services[0] : item.services;
    const query = search.toLowerCase();
    return visibleDays.some((day) => day.date === item.date) && (!query || `${customer?.name} ${service?.name}`.toLowerCase().includes(query));
  });
  const shiftWeek = (amount: number) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + amount * (view === "month" ? 28 : view === "day" ? 1 : 7));
    setSelectedDate(next);
    setWeekStart(view === "month" ? new Date(next.getFullYear(), next.getMonth(), 1) : startOfWeek(next));
  };
  const goToday = () => { const next = new Date(); setSelectedDate(next); setWeekStart(startOfWeek(next)); };
  return (
    <div className="animate-rise space-y-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-gold text-ink"><CalendarDays size={21} /></div><div><p className="text-xs uppercase tracking-[.18em] text-gray-500">Gestão de horários</p><h2 className="text-2xl font-bold text-white">Agenda</h2></div></div>
        <button type="button" onClick={() => { setEditingAppointment(null); setModal({ date: isoDate(selectedDate), time: "09:00" }); }} className="inline-flex items-center gap-2 rounded-xl bg-gold px-4 py-2.5 text-sm font-bold text-ink hover:bg-gold-soft"><Plus size={17} /> Novo agendamento</button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#16191E] p-3">
        <div className="flex items-center gap-2">
        <button
          aria-label="Semana anterior"
          onClick={() => shiftWeek(-1)}
          className="rounded-lg border border-white/5 p-2 text-gray-400 hover:text-gold"
        >
          <ChevronLeft size={17} />
        </button>
        <button type="button" onClick={goToday} className="rounded-lg border border-white/5 px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white">Hoje</button>
        <span className="min-w-40 px-2 text-center text-sm font-semibold capitalize text-white">{dateLabel}</span>
        <button
          aria-label="Próxima semana"
          onClick={() => shiftWeek(1)}
          className="rounded-lg border border-white/5 p-2 text-gray-400 hover:text-gold"
        >
          <ChevronRight size={17} />
        </button>
      </div><div className="flex items-center gap-2"><label className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#20242C] px-3 py-2 text-gray-500"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente ou serviço" aria-label="Buscar agendamento" className="w-44 bg-transparent text-sm text-white outline-none placeholder:text-gray-600" />{search && <button type="button" onClick={() => setSearch("")} aria-label="Limpar busca"><X size={14} /></button>}</label><div className="flex rounded-lg border border-white/5 bg-[#20242C] p-1">{(["day", "week", "month"] as CalendarView[]).map((option) => <button type="button" key={option} onClick={() => setView(option)} className={`rounded-md px-3 py-1.5 text-xs font-bold ${view === option ? "bg-gold text-ink" : "text-gray-400 hover:text-white"}`}>{option === "day" ? "Dia" : option === "week" ? "Semana" : "Mês"}</button>)}</div></div>
      </div>
      {error && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
      <section className={`overflow-x-auto rounded-xl border border-white/5 bg-[#16191E] ${view === "month" ? "" : "hidden"}`}>
        <div className="grid min-w-[700px] grid-cols-7">
          {shortDays.map((day) => <div key={day} className="border-b border-white/5 bg-[#16191E] p-3 text-center text-xs font-bold uppercase tracking-widest text-gray-500">{day}</div>)}
          {monthCells.map((cell) => {
            const dayAppointments = appointments.filter((item) => item.date === cell.date && (!search || JSON.stringify(item).toLowerCase().includes(search.toLowerCase())));
            return <div key={cell.date} onDoubleClick={() => setModal({ date: cell.date, time: "09:00" })} className={`min-h-28 border-b border-l border-white/5 bg-[#16191E] p-2 ${!cell.current ? "bg-black/10" : ""}`}><span className={`text-xs ${cell.date === isoDate(today) ? "grid h-6 w-6 place-items-center rounded-full bg-gold font-bold text-ink" : cell.current ? "text-gray-300" : "text-gray-700"}`}>{cell.day}</span>{dayAppointments.slice(0, 3).map((item) => { const customer = Array.isArray(item.customers) ? item.customers[0] : item.customers; return <button type="button" key={item.id} draggable onDragStart={() => setDraggedId(item.id)} onClick={() => setModal({ date: item.date, time: item.start_time })} className="mt-1 block w-full truncate rounded-md border-l-2 border-gold bg-gold/15 px-1.5 py-1 text-left text-[10px] text-gold">{formatTime(item.start_time)} {customer?.name || "Cliente"}</button>; })}</div>;
          })}
        </div>
      </section>
      <section className={`overflow-x-auto rounded-xl border border-white/5 bg-[#16191E] ${view === "month" ? "hidden" : ""}`}>
        <div className="min-w-[1040px]">
          <div className="grid border-b border-white/5 bg-[#16191E]" style={{ gridTemplateColumns: `68px repeat(${visibleDays.length}, minmax(140px, 1fr))` }}>
            <div className="p-3 text-[10px] uppercase tracking-widest text-gray-600">
              Horário
            </div>
            {visibleDays.map((item) => (
              <div
                key={item.date}
                className={`border-l border-white/5 bg-[#16191E] p-3 ${item.date === isoDate(today) ? "border-t-2 border-t-gold bg-gold/5" : ""}`}
              >
                <p
                  className={`text-xs font-bold ${item.date === isoDate(today) ? "text-gold" : "text-white"}`}
                >
                  {item.day}
                </p>
                <p className="mt-1 text-[11px] text-gold">{item.label}</p>
              </div>
            ))}
          </div>
          <div className="grid" style={{ gridTemplateColumns: `68px repeat(${visibleDays.length}, minmax(140px, 1fr))` }}>
            <div>
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b border-zinc-800/50 p-2 text-[10px] text-gray-600"
                >
                  {hour}
                </div>
              ))}
            </div>
            {visibleDays.map((day) => {
              const dayAppointments = shown.filter((item) => item.date === day.date);
              return (
                <div
                  key={day.date}
                  className="relative overflow-hidden border-l border-white/5 bg-[#16191E]"
                >
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => void handleDrop(day.date, hour)}
                      className="relative h-16 border-b border-zinc-800/50 p-1"
                    >
                      <button
                        type="button"
                        aria-label={`Agendar ${day.day} às ${hour}`}
                        onClick={() => setModal({ date: day.date, time: hour })}
                        className="absolute inset-0 z-0 h-full w-full hover:bg-gold/[.04]"
                      />
                    </div>
                  ))}
                  {dayAppointments.map((item) => {
                    const relation = Array.isArray(item.services)
                      ? item.services[0]
                      : item.services;
                    const customer = Array.isArray(item.customers)
                      ? item.customers[0]
                      : item.customers;
                    const customerName = loading
                      ? "Carregando cliente..."
                      : customer?.name || "Cliente não identificado";
                    const startMinutes = toMinutes(item.start_time);
                    const durationMinutes = Math.max(30, toMinutes(item.end_time) - startMinutes);
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={() => setDraggedId(item.id)}
                        role="button"
                        tabIndex={0}
                        onClick={() => { setEditingAppointment(item); setModal({ date: item.date, time: item.start_time }); }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") { setEditingAppointment(item); setModal({ date: item.date, time: item.start_time }); }
                        }}
                        style={{
                          top: `${Math.max(0, startMinutes - calendarStartMinutes) * pixelsPerMinute + 4}px`,
                          height: `${Math.max(48, durationMinutes * pixelsPerMinute - 8)}px`,
                        }}
                        className="absolute inset-x-1 z-10 cursor-grab overflow-hidden rounded-r-lg border-l-4 border-gold bg-[#20242C] p-2.5 text-left shadow-lg hover:bg-zinc-800/40 active:cursor-grabbing"
                      >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">
                                  {customerName}
                                </p>
                                <p className="mt-1 truncate text-xs text-gray-400">
                                  {formatTime(item.start_time)} - {formatTime(item.end_time)} | {relation?.name || relation?.title || "Serviço agendado"}
                                </p>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <button
                                  type="button"
                                  aria-label={`Finalizar agendamento de ${customerName}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setCheckoutAppointment(item as Appointment & { status?: string | null });
                                  }}
                                  className="text-gray-500 hover:text-emerald-400"
                                >
                                  <CheckCircle2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Editar agendamento de ${customerName}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setEditingAppointment(item);
                                    setModal({ date: item.date, time: item.start_time });
                                  }}
                                  className="text-gray-500 hover:text-gold"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Excluir agendamento de ${customerName}`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    void handleDelete(item.id);
                                  }}
                                  className="text-gray-500 hover:text-red-400"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {loading && (
        <p className="text-center text-sm text-gray-500">
          Carregando agenda...
        </p>
      )}
      {checkoutAppointment && (
        <CheckoutModal
          appointment={checkoutAppointment}
          onClose={() => setCheckoutAppointment(null)}
          onComplete={async () => {
            await loadData();
            setCheckoutAppointment(null);
          }}
        />
      )}
      {modal && (
        <ModalAppointment
          initialDate={modal.date}
          initialTime={modal.time}
          services={services}
          appointment={editingAppointment}
          onClose={() => { setModal(null); setEditingAppointment(null); }}
          onSave={save}
        />
      )}
    </div>
  );
}


