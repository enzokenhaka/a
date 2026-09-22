"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  FileDown,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/lib/supabase";

type FinancialRecord = {
  id: string;
  type: string;
  status: string;
  value: number;
  description: string | null;
  created_at: string;
  due_date: string | null;
};
type ChartPoint = { day: string; entradas: number; saidas: number };
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const transactionDateKey = (value: string | null | undefined) =>
  String(value || "").split("T")[0];
const formatDate = (date: string | null | undefined) => {
  const [year, month, day] = transactionDateKey(date).split("-");
  return year && month && day ? `${day}/${month}/${year}` : "Data não informada";
};
const formatChartRangeDate = (date: Date) =>
  date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const getErrorMessage = (error: unknown) =>
  error && typeof error === "object" && "message" in error
    ? String(error.message) || "Erro ao carregar dados"
    : error instanceof Error
      ? error.message
      : "Erro ao carregar dados";
const isActiveFinancialRecord = (record: {
  status?: string | null;
  description?: string | null;
}) => {
  const status = String(record.status || "")
    .trim()
    .toUpperCase();
  const description = String(record.description || "").trim();
  return (
    status !== "CANCELADO" &&
    status !== "CANCELADA" &&
    !description.toLowerCase().includes("cancelado")
  );
};
const statusOptions = (record: FinancialRecord) => {
  const type = String(record.type || "").toLowerCase();
  const fallbackOptions = ["pago", "saída", "saida", "despesa"].includes(type)
    ? ["Pago", "Atrasado", "Pendente"]
    : ["Recebido", "Atrasado", "Pendente"];

  const currentStatus = String(record.status || "").trim();
  const options = currentStatus && fallbackOptions.includes(currentStatus)
    ? fallbackOptions
    : [currentStatus || "Pendente", ...fallbackOptions];

  return Array.from(new Set(options.filter(Boolean)));
};
const toDatabaseStatus = (status: string) => {
  const normalized = String(status || "").trim();
  const mapped = normalized.toLowerCase();

  if (["a receber", "pendente", "a pagar"].includes(mapped)) {
    return "Pendente";
  }

  if (["recebido", "pago"].includes(mapped)) {
    return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  }

  if (mapped === "atrasado") {
    return "Atrasado";
  }

  return normalized || "Pendente";
};
const toDisplayStatus = (status: string, type: string) => {
  const normalized = String(status || "").trim();
  const value = normalized.toLowerCase();

  if (["pendente", "a receber", "a pagar"].includes(value)) {
    return type === "pago" || type === "despesa" ? "Pendente" : "A Receber";
  }
  if (["recebido", "pago"].includes(value)) {
    return value === "recebido" ? "Recebido" : "Pago";
  }
  if (value === "atrasado") return "Atrasado";

  return normalized || "Pendente";
};
const statusBadgeClass = (status: string) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "recebido" || normalized === "pago") {
    return "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  }
  if (normalized === "a receber" || normalized === "pendente" || normalized === "a pagar") {
    return "border border-amber-500/40 bg-amber-500/10 text-amber-300";
  }
  if (normalized === "atrasado") {
    return "border border-rose-500/40 bg-rose-500/10 text-rose-300";
  }
  return "border border-zinc-500/40 bg-zinc-500/10 text-zinc-300";
};

export default function FinancePage() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [chartWeekOffset, setChartWeekOffset] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    if (!historyOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [historyOpen]);

  const loadRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("financial_records")
        .select("id, type, status, value, description, created_at, due_date")
        .order("created_at", { ascending: false });
      if (fetchError) throw fetchError;
      setRecords(
        (data || [])
          .filter((record) => isActiveFinancialRecord(record as FinancialRecord))
          .map((record) => ({
            ...(record as FinancialRecord),
            status: toDisplayStatus(
              String(record.status || ""),
              String(record.type || "").toLowerCase(),
            ),
          })),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRecords();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const record = records.find((item) => item.id === id);
    const previous = record?.status;
    const nextStatus = status || "Pendente";
    const databaseStatus = toDatabaseStatus(nextStatus);

    setRecords((current) =>
      current.map((record) =>
        record.id === id ? { ...record, status: nextStatus } : record,
      ),
    );

    const { error: updateError } = await supabase
      .from("financial_records")
      .update({ status: databaseStatus })
      .eq("id", id);

    if (updateError) {
      setError(getErrorMessage(updateError));
      if (previous) {
        setRecords((current) =>
          current.map((record) =>
            record.id === id ? { ...record, status: previous } : record,
          ),
        );
      } else {
        void loadRecords();
      }
      return;
    }
  };

  const totals = useMemo(() => {
    const entradas = records
      .filter(
        (record) => record.type === "recebido" && record.status === "Recebido",
      )
      .reduce((total, record) => total + Number(record.value || 0), 0);
    const saidas = records
      .filter((record) => record.type === "pago" && record.status === "Pago")
      .reduce((total, record) => total + Number(record.value || 0), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [records]);
  const recentRecords = records.slice(0, 5);
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const pagedRecords = records.slice(
    (historyPage - 1) * pageSize,
    historyPage * pageSize,
  );
  const chartData = useMemo<ChartPoint[]>(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6 + chartWeekOffset * 7);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      return date;
    });
    const dailyTotals = new Map<string, { entradas: number; saidas: number }>();
    let cumulativeEntradas = 0;
    let cumulativeSaidas = 0;

    records.forEach((record) => {
      const dateKey = transactionDateKey(record.due_date || record.created_at);
      const value = Number(record.value || 0);
      const isEntrada = record.type === "recebido" && record.status === "Recebido";
      const isSaida = record.type === "pago" && record.status === "Pago";
      if (!isEntrada && !isSaida) return;
      const current = dailyTotals.get(dateKey) || { entradas: 0, saidas: 0 };
      if (isEntrada) current.entradas += value;
      if (isSaida) current.saidas += value;
      dailyTotals.set(dateKey, current);
    });

    return days.map((date) => {
      const daily = dailyTotals.get(localDateKey(date)) || { entradas: 0, saidas: 0 };
      cumulativeEntradas += daily.entradas;
      cumulativeSaidas += daily.saidas;
      return {
        day: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        entradas: cumulativeEntradas,
        saidas: cumulativeSaidas,
      };
    });
  }, [records, chartWeekOffset]);

  const chartRange = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6 + chartWeekOffset * 7);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return { startDate, endDate };
  }, [chartWeekOffset]);

  const recordRow = (record: FinancialRecord) => {
    const outgoing = ["pago", "saída", "saida", "despesa"].includes(
      String(record.type || "").toLowerCase(),
    );
    return (
      <div
        key={record.id}
        className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800/70 px-5 py-4 last:border-0"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {record.description || "Movimentação financeira"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {formatDate(record.due_date || record.created_at)}
          </p>
        </div>
        <p
          className={`text-sm font-bold ${outgoing ? "text-rose-400" : "text-emerald-400"}`}
        >
          {outgoing ? "-" : "+"} {currency.format(Number(record.value || 0))}
        </p>
        <div className="flex items-center gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusBadgeClass(record.status)}`}>
            {record.status}
          </span>
          <select
            aria-label={`Status de ${record.description || "movimentação"}`}
            value={record.status}
            onChange={(event) => void updateStatus(record.id, event.target.value)}
            className="rounded-xl border border-white/10 bg-[#18191E] px-2.5 py-2 text-xs font-semibold text-zinc-200 outline-none focus:border-amber-400 focus:bg-zinc-800"
          >
            {statusOptions(record).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-rise space-y-6 p-5 sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Acompanhe os resultados</p>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Financeiro
          </h2>
        </div>
        <div className="flex gap-2">
          <Link
            href="/financeiro/contas-a-pagar"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-800 bg-surface px-4 py-2.5 text-sm font-bold text-gray-300 hover:border-gold/50 hover:text-white"
          >
            <Eye size={16} /> Compras
          </Link>
          <Link
            href="/financeiro/vendas"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-ink hover:bg-gold-deep"
          >
            <FileDown size={16} /> Vendas
          </Link>
        </div>
      </div>
      {error && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-[#16191E] p-5 transition-colors hover:bg-[#1B1C1E]">
          <CircleDollarSign className="text-gold" size={21} />
          <p className="mt-5 text-xs uppercase tracking-widest text-gray-500">
            Saldo do mês
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {loading ? "Carregando..." : currency.format(totals.saldo)}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#16191E] p-5 transition-colors hover:bg-[#1B1C1E]">
          <ArrowUpRight className="text-emerald-400" size={21} />
          <p className="mt-5 text-xs uppercase tracking-widest text-gray-500">
            Entradas
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {loading ? "Carregando..." : currency.format(totals.entradas)}
          </p>
        </div>
        <div className="rounded-xl border border-white/5 bg-[#16191E] p-5 transition-colors hover:bg-[#1B1C1E]">
          <ArrowDownRight className="text-rose-400" size={21} />
          <p className="mt-5 text-xs uppercase tracking-widest text-gray-500">
            Saídas
          </p>
          <p className="mt-2 text-2xl font-bold text-white">
            {loading ? "Carregando..." : currency.format(totals.saidas)}
          </p>
        </div>
      </div>
      <section className="rounded-xl border border-gray-800 bg-panel p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">Andamento financeiro</p>
            <p className="mt-1 text-xs text-gray-500">
              {formatChartRangeDate(chartRange.startDate)} - {formatChartRangeDate(chartRange.endDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Período anterior"
              onClick={() => setChartWeekOffset((offset) => offset - 1)}
              className="rounded-lg border border-zinc-800 bg-[#1B1C1E] p-2 text-gray-300 transition hover:bg-zinc-800 hover:text-white"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="hidden text-xs text-gray-400 sm:inline">Últimos 7 dias</span>
            <button
              type="button"
              aria-label="Próximo período"
              disabled={chartWeekOffset >= 0}
              onClick={() => setChartWeekOffset((offset) => Math.min(0, offset + 1))}
              className="rounded-lg border border-zinc-800 bg-[#1B1C1E] p-2 text-gray-300 transition hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="28%">
              <CartesianGrid
                vertical={false}
                stroke="#303640"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#727b87", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#727b87", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `R$${value / 1000}k`}
                width={45}
              />
              <Tooltip
                formatter={(value: number) => currency.format(value)}
                contentStyle={{
                  background: "#121212",
                  border: "1px solid #3a3f47",
                  borderRadius: 8,
                  color: "#fff",
                }}
              />
              <Legend />
              <Bar
                dataKey="entradas"
                name="Entradas"
                fill="#FBC02D"
                radius={[5, 5, 0, 0]}
              />
              <Bar
                dataKey="saidas"
                name="Saídas"
                fill="#fb7185"
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <section className="rounded-xl border border-gray-800 bg-panel">
        <div className="flex items-center justify-between border-b border-gray-800 px-5 py-4">
          <div>
            <p className="text-sm font-bold text-white">
              Movimentações recentes
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Últimas entradas e saídas
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setHistoryPage(1);
              setHistoryOpen(true);
            }}
            className="rounded-lg border border-gray-800 bg-surface px-3 py-2 text-xs font-bold text-gray-300 hover:border-gold/50 hover:text-white"
          >
            Ver lista completa
          </button>
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-500">
            Carregando movimentações...
          </p>
        ) : recentRecords.length ? (
          recentRecords.map(recordRow)
        ) : (
          <p className="p-8 text-center text-sm text-gray-500">
            Nenhuma movimentação encontrada.
          </p>
        )}
      </section>
      {historyOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative my-auto flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#16191E] shadow-2xl">
            <div className="flex flex-none items-center justify-between border-b border-zinc-800/60 p-5 pb-3">
              <div>
                <h3 className="font-bold text-white">Histórico financeiro</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {records.length} movimentações
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Fechar histórico"
                className="text-gray-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5 overscroll-contain">
              {pagedRecords.map(recordRow)}
            </div>
            <div className="flex flex-none items-center justify-between border-t border-zinc-800/60 px-5 py-4">
              <p className="text-xs text-gray-500">
                Página {historyPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Página anterior"
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage((page) => page - 1)}
                  className="rounded-lg border border-gray-800 p-2 text-gray-400 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Próxima página"
                  disabled={historyPage === totalPages}
                  onClick={() => setHistoryPage((page) => page + 1)}
                  className="rounded-lg border border-gray-800 p-2 text-gray-400 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
