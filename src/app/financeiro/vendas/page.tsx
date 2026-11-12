"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Minus, Plus, Search, TrendingUp, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SaleRecord = {
  id: string;
  customer_name: string | null;
  total_amount: number;
  payment_method: string | null;
  created_at: string | null;
  status: string | null;
  item_names: string[];
};

type ProductOption = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type CustomerOption = {
  id: string;
  name: string;
};

type DirectSaleItem = {
  id: string;
  kind: "product";
  name: string;
  quantity: number;
  unitPrice: number;
};

const registeredCustomers = (rows: CustomerOption[]) =>
  rows.filter((customer) => customer.name.trim().toLowerCase() !== "cliente avulso");

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatSaleDate = (value: string | null | undefined) => {
  if (!value) return "—";

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
};
const formatDirectSaleDescription = (customerName: string | null, itemNames: string[]) => {
  const items = itemNames.filter(Boolean).join(", ");
  return `Venda direta - ${customerName || "Cliente não informado"}${items ? ` - ${items}` : ""}`;
};

const paymentOptions = [
  { value: "pix", databaseValue: "PIX", label: "PIX" },
  { value: "credit_card", databaseValue: "CARTAO_CREDITO", label: "Cartão de Crédito" },
  { value: "debit_card", databaseValue: "CARTAO_DEBITO", label: "Cartão de Débito" },
  { value: "cash", databaseValue: "DINHEIRO", label: "Dinheiro" },
] as const;
type PaymentOption = (typeof paymentOptions)[number]["value"];

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

const statusClass = (status?: string | null) => {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "finalizada" || normalized === "recebido" || normalized === "pago") {
    return "bg-emerald-900/40 text-emerald-400";
  }
  if (normalized === "pendente") {
    return "bg-amber-900/40 text-amber-400";
  }
  return "bg-zinc-800 text-zinc-200";
};

export default function SalesPage() {
  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentOption>("pix");
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [saleItems, setSaleItems] = useState<DirectSaleItem[]>([]);

  const loadSales = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      const saleIds = (data || []).map((sale) => sale.id);
      const { data: saleItemsData, error: saleItemsError } = saleIds.length
        ? await supabase.from("sale_items").select("sale_id, description").in("sale_id", saleIds)
        : { data: [], error: null };

      if (saleItemsError) throw saleItemsError;

      const itemNamesBySaleId = (saleItemsData || []).reduce<Record<string, string[]>>(
        (itemsBySaleId, item) => {
          if (!itemsBySaleId[item.sale_id]) itemsBySaleId[item.sale_id] = [];
          if (item.description) itemsBySaleId[item.sale_id].push(item.description);
          return itemsBySaleId;
        },
        {},
      );

      const mapped = (data || []).map((sale) => ({
        id: sale.id,
        customer_name: sale.customer_name || "Cliente não informado",
        total_amount: Number(sale.total_amount || 0),
        payment_method: sale.payment_method || "PIX",
        created_at: sale.created_at,
        status: sale.status || "Pendente",
        item_names: itemNamesBySaleId[sale.id] || [],
      })) as SaleRecord[];

      setRecords(mapped);
    } catch (requestError) {
      console.error("Erro ao carregar vendas:", requestError);

      const message =
        requestError && typeof requestError === "object"
          ? ("message" in requestError && typeof requestError.message === "string" && requestError.message.trim()
              ? requestError.message
              : "details" in requestError && typeof requestError.details === "string" && requestError.details.trim()
                ? requestError.details
                : "Erro ao carregar vendas.")
          : requestError instanceof Error
            ? requestError.message
            : "Erro ao carregar vendas.";

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSales();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [modalOpen]);

  useEffect(() => {
    if (!modalOpen) return;

    const loadOptions = async () => {
      const customersQuery = await supabase.from("customers").select("id, name").order("name");
      if (customersQuery.error) {
        const fallbackQuery = await supabase.from("clients").select("id, name").order("name");
        if (fallbackQuery.error) throw fallbackQuery.error;
        const nextCustomers = registeredCustomers((fallbackQuery.data || []) as CustomerOption[]);
        setCustomers(nextCustomers);
        setSelectedCustomerId("");
        setSelectedCustomerName("");
      } else {
        const nextCustomers = registeredCustomers((customersQuery.data || []) as CustomerOption[]);
        setCustomers(nextCustomers);
        setSelectedCustomerId("");
        setSelectedCustomerName("");
      }

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, name, price, quantity")
        .gt("quantity", 0)
        .order("name");

      if (productsError) throw productsError;

      const nextProducts = (productsData || []) as ProductOption[];
      setProducts(nextProducts);
      setSelectedItemId(nextProducts[0]?.id ?? "");
    };

    void loadOptions().catch((loadError) => {
      console.error("Erro ao carregar itens da venda direta:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar itens da venda direta.");
    });
  }, [modalOpen]);

  const filteredRecords = useMemo(() => {
    const normalized = query.toLowerCase();
    return records.filter((record) => {
      const customerName = record.customer_name?.toLowerCase() || "";
      const paymentMethod = record.payment_method?.toLowerCase() || "";
      const status = record.status?.toLowerCase() || "";

      return (
        customerName.includes(normalized) ||
        paymentMethod.includes(normalized) ||
        status.includes(normalized)
      );
    });
  }, [records, query]);

  const totalDirectSale = saleItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
    0,
  );

  const addItemToSale = () => {
    if (!selectedItemId) return;

    const item = products.find((entry) => entry.id === selectedItemId);
    if (!item) return;

    const key = `product-${item.id}`;
    setSaleItems((current) => {
      const existing = current.find((entry) => `${entry.kind}-${entry.id}` === key);
      if (existing) {
        return current.map((entry) =>
          `${entry.kind}-${entry.id}` === key
            ? { ...entry, quantity: Number(entry.quantity) + Number(selectedQuantity) }
            : entry,
        );
      }

      return [
        ...current,
        {
          id: item.id,
          kind: "product",
          name: item.name,
          quantity: Number(selectedQuantity),
          unitPrice: Number(item.price || 0),
        },
      ];
    });
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
    setSaleItems((current) =>
      current
        .map((entry) =>
          entry.id === itemId
            ? { ...entry, quantity: Math.max(1, Number(entry.quantity) + delta) }
            : entry,
        )
        .filter((entry) => entry.quantity > 0),
    );
  };

  const removeItemFromSale = (itemId: string) => {
    setSaleItems((current) => current.filter((entry) => entry.id !== itemId));
  };

  const closeDirectSaleModal = () => {
    setModalOpen(false);
    setSelectedCustomerId("");
    setSelectedCustomerName("");
    setPaymentMethod("pix");
    setSelectedItemId("");
    setSelectedQuantity(1);
    setSaleItems([]);
    setError("");
  };

  const saveDirectSale = async () => {
    if (!selectedCustomerId || !selectedCustomerName.trim()) {
      setError("Selecione um cliente cadastrado para concluir a venda.");
      return;
    }
    if (!saleItems.length) {
      setError("Adicione pelo menos um item para concluir a venda.");
      return;
    }

    setSaving(true);
    setError("");

    const resolvedCustomerName = selectedCustomerName.trim();
    const paymentOption = paymentOptions.find((option) => option.value === paymentMethod);
    if (!paymentOption) {
      setError("Selecione uma forma de pagamento válida.");
      setSaving(false);
      return;
    }
    const paymentMethodEnum = paymentOption.databaseValue;

    try {
      const salePayload = {
        appointment_id: null,
        customer_name: resolvedCustomerName,
        total_amount: Number(totalDirectSale) || 0,
        payment_method: paymentMethodEnum,
        status: "Concluído",
      };

      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([salePayload])
        .select("id")
        .single();

      if (saleError) throw saleError;
      const saleId = saleData?.id;
      if (!saleId) throw new Error("Não foi possível registrar a venda direta.");

      const saleRows = saleItems.map((item) => ({
        sale_id: saleId,
        product_id: item.id,
        description: item.name,
        quantity: Number(item.quantity),
        unit_price: Number(item.unitPrice),
      }));

      const { error: saleItemsError } = await supabase.from("sale_items").insert(saleRows);
      if (saleItemsError) throw saleItemsError;

      for (const item of saleItems) {
        const { data: currentProductData, error: currentProductError } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", item.id)
          .single();

        if (currentProductError) throw currentProductError;

        const currentStock = Number(currentProductData?.quantity ?? 0);
        const soldQuantity = Number(item.quantity);
        const newQuantity = Math.max(0, currentStock - soldQuantity);

        const { error: stockError } = await supabase
          .from("products")
          .update({ quantity: newQuantity })
          .eq("id", item.id);

        if (stockError) throw stockError;
      }

      const { error: financialError } = await supabase.from("financial_records").insert({
        description: formatDirectSaleDescription(resolvedCustomerName, saleItems.map((item) => item.name)),
        value: Number(totalDirectSale) || 0,
        type: normalizeTransactionType("receita"),
        status: "Recebido",
        category: "Venda de Produto",
        payment_method: paymentMethodEnum,
        due_date: new Date().toISOString().slice(0, 10),
      });

      if (financialError) throw financialError;

      await loadSales();
      closeDirectSaleModal();
    } catch (err) {
      console.error("Erro ao concluir venda direta:", err);
      setError(
        err && typeof err === "object"
          ? ("message" in err && typeof err.message === "string" && err.message.trim()
              ? err.message
              : JSON.stringify(err) || "Erro ao concluir a venda.")
          : err instanceof Error
            ? err.message
            : JSON.stringify(err) || "Erro ao concluir a venda.",
      );
    } finally {
      setSaving(false);
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
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl">Vendas</h2>
          <p className="mt-1 text-sm text-zinc-400">Resumo de vendas e pagamentos realizados.</p>
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <TrendingUp size={16} /> Nova Venda Direta
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={17} className="absolute left-3 top-3 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por cliente ou status"
            className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none w-full pl-10"
          />
        </div>
      </div>

      <section className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/50 shadow-sm">
        <table className="w-full border-collapse min-w-[820px] text-left text-sm">
          <thead className="bg-zinc-900/80 text-[10px] uppercase tracking-[.12em] text-zinc-400">
            <tr>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Valor total</th>
              <th className="px-6 py-4">Forma de pagamento</th>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr key={record.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                <td className="px-6 py-4 font-semibold text-zinc-100">
                  {formatDirectSaleDescription(record.customer_name, record.item_names)}
                </td>
                <td className="px-6 py-4 font-bold text-white">{currency.format(record.total_amount)}</td>
                <td className="px-6 py-4 text-zinc-300">{record.payment_method}</td>
                <td className="px-6 py-4 text-zinc-400">
                  {formatSaleDate(record.created_at)}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(record.status)}`}>
                    {record.status || "Pendente"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-10 animate-pulse rounded-lg bg-zinc-800/70" />
            ))}
          </div>
        )}

        {!loading && filteredRecords.length === 0 && (
          <div className="text-center py-12 text-zinc-500 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800 m-6">
            Nenhuma venda encontrada.
          </div>
        )}
      </section>

      {modalOpen && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative my-auto w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#16191E] p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Venda Direta de Balcão</h3>
                <p className="mt-1 text-xs text-zinc-400">Registro rápido sem agendamento prévio.</p>
              </div>
              <button
                type="button"
                onClick={closeDirectSaleModal}
                className="text-zinc-400 hover:text-white transition-colors"
                aria-label="Fechar venda direta"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-zinc-300 md:col-span-2">
                Cliente
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    const nextCustomer = customers.find((customer) => customer.id === nextId);
                    setSelectedCustomerId(nextId);
                    setSelectedCustomerName(nextCustomer?.name || "");
                  }}
                  className="mt-2 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 w-full"
                >
                  <option value="" disabled>Selecione um cliente</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              </label>

              <div className="md:col-span-2">
                <div className="flex gap-3">
                  <select
                    value={selectedItemId}
                    onChange={(event) => setSelectedItemId(event.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 flex-1"
                  >
                    {products.length === 0 ? (
                      <option value="">Nenhum produto disponível</option>
                    ) : (
                      products.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))
                    )}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={selectedQuantity}
                    onChange={(event) => setSelectedQuantity(Math.max(1, Number(event.target.value) || 1))}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-500 w-20"
                  />

                  <button
                    type="button"
                    onClick={addItemToSale}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <label className="text-sm text-zinc-300 md:col-span-2">
                Forma de pagamento
                <select
                  value={paymentMethod}
                  onChange={(event) => {
                    const selected = paymentOptions.find((option) => option.value === event.target.value);
                    if (selected) setPaymentMethod(selected.value);
                  }}
                  className="mt-2 bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 outline-none w-full"
                >
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Resumo do pedido</h4>
                <span className="text-xs text-zinc-400">{saleItems.length} item(ns)</span>
              </div>

              <div className="space-y-3">
                {saleItems.length === 0 ? (
                  <p className="text-sm text-zinc-500">Nenhum item adicionado.</p>
                ) : (
                  saleItems.map((item) => (
                    <div key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-100">{item.name}</p>
                        <p className="text-xs text-zinc-400">{currency.format(item.unitPrice)} cada</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, -1)}
                          className="h-8 w-8 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"
                          aria-label={`Diminuir quantidade de ${item.name}`}
                        >
                          <Minus size={14} className="mx-auto" />
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-semibold text-white">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, 1)}
                          className="h-8 w-8 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-zinc-500"
                          aria-label={`Aumentar quantidade de ${item.name}`}
                        >
                          <Plus size={14} className="mx-auto" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">
                          {currency.format(Number(item.unitPrice) * Number(item.quantity))}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItemFromSale(item.id)}
                          className="text-zinc-400 hover:text-rose-400 transition-colors"
                          aria-label={`Remover ${item.name}`}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-zinc-800 pt-4">
                <span className="text-sm text-zinc-300">Total</span>
                <span className="text-xl font-bold text-white">{currency.format(totalDirectSale)}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDirectSaleModal}
                className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={saving || saleItems.length === 0}
                onClick={() => {
                  void saveDirectSale();
                }}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
              >
                {saving ? "Finalizando..." : "Concluir venda"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
