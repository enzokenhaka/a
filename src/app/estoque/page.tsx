"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DollarSign,
  Edit3,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  quantity: number;
  price: number;
};

type ProductForm = {
  name: string;
  description: string;
  category: string;
  quantity: string;
  price: string;
};
const emptyForm: ProductForm = {
  name: "",
  description: "",
  category: "",
  quantity: "",
  price: "",
};
const productCategories = ["para o cabelo", "para a barba", "conveniência"];
const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/5 bg-[#20242C] p-2.5 text-sm text-white outline-none focus:border-gold";

const formatPrice = (value: number) => currency.format(value);
const stockLabel = (quantity: number) =>
  quantity === 0
    ? "Sem estoque"
    : quantity <= 10
      ? "Estoque baixo"
      : "Em estoque";
const stockClass = (quantity: number) =>
  quantity === 0
    ? "bg-rose-900/40 text-rose-400"
    : quantity <= 10
      ? "bg-amber-900/40 text-amber-400"
      : "bg-emerald-900/40 text-emerald-400";

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [stockStatus, setStockStatus] = useState("Todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);

  const loadProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("id, name, description, category, quantity, price")
        .order("name");
      if (fetchError) throw fetchError;
      setProducts((data || []) as Product[]);
    } catch (requestError) {
      console.error("Erro ao carregar produtos:", requestError);
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
    void loadProducts();
  }, []);

  const categories = ["Todas", ...productCategories];
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const normalizedQuery = query.toLowerCase();
        const matchesQuery =
          product.name.toLowerCase().includes(normalizedQuery) ||
          (product.description || "").toLowerCase().includes(normalizedQuery);
        const matchesCategory =
          category === "Todas" || product.category === category;
        const matchesStatus =
          stockStatus === "Todos" ||
          (stockStatus === "Em estoque" && product.quantity > 10) ||
          (stockStatus === "Estoque baixo" &&
            product.quantity >= 1 &&
            product.quantity <= 10) ||
          (stockStatus === "Sem estoque" && product.quantity === 0);
        return matchesQuery && matchesCategory && matchesStatus;
      }),
    [products, query, category, stockStatus],
  );
  const metrics = useMemo(
    () => ({
      total: products.length,
      inStock: products.filter((product) => product.quantity > 10).length,
      lowStock: products.filter(
        (product) => product.quantity >= 1 && product.quantity <= 10,
      ).length,
      outOfStock: products.filter((product) => product.quantity === 0).length,
      value: products.reduce(
        (total, product) => total + product.quantity * product.price,
        0,
      ),
    }),
    [products],
  );
  const categoryBreakdown = useMemo(
    () =>
      categories
        .slice(1)
        .map((name) => {
          const items = products.filter((product) => product.category === name);
          return {
            name,
            quantity: items.reduce(
              (total, product) => total + product.quantity,
              0,
            ),
            value: items.reduce(
              (total, product) => total + product.quantity * product.price,
              0,
            ),
          };
        })
        .sort((first, second) => second.quantity - first.quantity),
    [categories, products],
  );
  const maxCategoryQuantity = Math.max(
    ...categoryBreakdown.map((item) => item.quantity),
    1,
  );
  const metricCards: {
    label: string;
    value: number;
    Icon: LucideIcon;
    color: string;
  }[] = [
    ["Total de produtos", metrics.total, Package, "text-gold"],
    ["Em estoque", metrics.inStock, Package, "text-emerald-400"],
    ["Estoque baixo", metrics.lowStock, Package, "text-amber-400"],
    ["Sem estoque", metrics.outOfStock, Package, "text-rose-400"],
  ].map(([label, value, Icon, color]) => ({
    label: String(label),
    value: Number(value),
    Icon: Icon as LucideIcon,
    color: String(color),
  }));

  const openCreate = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };
  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      category: product.category,
      quantity: String(product.quantity),
      price: String(product.price),
    });
    setError("");
    setModalOpen(true);
  };
  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingProduct(null);
    setForm(emptyForm);
  };

  const saveProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      quantity: Number(form.quantity),
      price: Number(form.price.replace(",", ".")),
    };
    try {
      const result = editingProduct
        ? await supabase
            .from("products")
            .update(payload)
            .eq("id", editingProduct.id)
            .select("id, name, description, category, quantity, price")
            .single()
        : await supabase
            .from("products")
            .insert([payload])
            .select("id, name, description, category, quantity, price")
            .single();
      if (result.error) throw result.error;
      const saved = result.data as Product;
      setProducts((current) =>
        editingProduct
          ? current.map((product) =>
              product.id === saved.id ? saved : product,
            )
          : [...current, saved].sort((first, second) =>
              first.name.localeCompare(second.name),
            ),
      );
      setModalOpen(false);
      setEditingProduct(null);
      setForm(emptyForm);
    } catch (requestError) {
      console.error("Erro ao salvar produto:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : String(requestError),
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm("Excluir este produto?")) return;
    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      setProducts((current) => current.filter((product) => product.id !== id));
    } catch (requestError) {
      console.error("Erro ao excluir produto:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : String(requestError),
      );
    }
  };

  return (
    <div className="animate-rise space-y-4 p-3 sm:p-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            Controle de produtos e insumos
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            Estoque
          </h2>
        </div>
        <Button onClick={openCreate}>
          <Plus size={17} /> Novo produto
        </Button>
      </div>
      {error && !modalOpen && (
        <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map(({ label, value, Icon, color }) => (
          <div
            key={label}
            className="rounded-xl border border-white/5 bg-[#16191E] p-5 transition-colors hover:bg-[#1B1C1E]"
          >
            <Icon size={20} className={color} />
            <p className="mt-5 text-xs uppercase tracking-widest text-gray-500">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search size={17} className="absolute left-3 top-3 text-gray-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por produto ou descrição"
            className="w-full rounded-lg border border-white/5 bg-[#20242C] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-gold"
          />
        </div>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-lg border border-white/5 bg-[#20242C] px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-gold"
        >
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={stockStatus}
          onChange={(event) => setStockStatus(event.target.value)}
          className="rounded-lg border border-white/5 bg-[#20242C] px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-gold"
        >
          <option>Todos</option>
          <option>Em estoque</option>
          <option>Estoque baixo</option>
          <option>Sem estoque</option>
        </select>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.75fr)]">
        <section className="overflow-x-auto rounded-xl border border-white/5 bg-[#16191E]">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-[#1B1C1E] text-[10px] uppercase tracking-[.12em] text-gray-500">
              <tr>
                <th className="px-6 py-4">Produto</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Quantidade</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-white/5 hover:bg-zinc-800/40"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-white">{product.name}</p>
                    <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                      {product.description || "Sem descrição"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-gray-400">
                    {product.category || "Sem categoria"}
                  </td>
                  <td className="px-6 py-4 text-gray-300">
                    {product.quantity} un.{" "}
                    <span className="text-xs text-gray-500">
                      {formatPrice(product.price)}/un.
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${stockClass(product.quantity)}`}
                    >
                      {stockLabel(product.quantity)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label={`Editar ${product.name}`}
                        onClick={() => openEdit(product)}
                        className="text-gray-500 hover:text-white"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Excluir ${product.name}`}
                        onClick={() => void deleteProduct(product.id)}
                        className="text-gray-500 hover:text-rose-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {loading && (
            <p className="p-10 text-center text-sm text-gray-500">
              Carregando produtos...
            </p>
          )}
          {!loading && filteredProducts.length === 0 && (
            <p className="p-10 text-center text-sm text-gray-500">
              Nenhum produto encontrado.
            </p>
          )}
        </section>
        <aside className="rounded-xl border border-white/5 bg-[#16191E] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500">
                Resumo financeiro
              </p>
              <h3 className="mt-1 text-lg font-bold text-white">
                Valor do inventário
              </h3>
            </div>
            <DollarSign size={20} className="text-gold" />
          </div>
          <p className="mt-5 text-3xl font-bold text-gold">
            {formatPrice(metrics.value)}
          </p>
          <div className="mt-8 border-t border-white/5 pt-5">
            <p className="text-xs uppercase tracking-widest text-gray-500">
              Estoque por categoria
            </p>
            <div className="mt-5 space-y-4">
              {categoryBreakdown.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between gap-3 text-xs">
                    <span className="truncate text-gray-300">{item.name}</span>
                    <span className="text-gray-500">{item.quantity} un.</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#20242C]">
                    <div
                      className="h-full rounded-full bg-gold"
                      style={{
                        width: `${Math.max((item.quantity / maxCategoryQuantity) * 100, item.quantity ? 8 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {categoryBreakdown.length === 0 && (
                <p className="text-sm text-gray-500">
                  Sem categorias cadastradas.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4">
          <form
            onSubmit={saveProduct}
            className="w-full max-w-lg rounded-2xl border border-white/5 bg-[#16191E] p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingProduct ? "Editar produto" : "Novo produto"}
                </h3>
                <p className="mt-1 text-xs text-gray-500">
                  Preencha os dados do item
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
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="text-xs text-gray-400 sm:col-span-2">
                Descrição
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className={`${inputClass} min-h-20`}
                />
              </label>
              <label className="text-xs text-gray-400">
                Categoria
                <select
                  required
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  className={inputClass}
                >
                  <option value="">Selecione uma categoria</option>
                  {productCategories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-gray-400">
                Quantidade
                <input
                  required
                  min="0"
                  step="1"
                  type="number"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: event.target.value })
                  }
                  className={inputClass}
                />
              </label>
              <label className="text-xs text-gray-400 sm:col-span-2">
                Preço unitário
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.price}
                  onChange={(event) =>
                    setForm({ ...form, price: event.target.value })
                  }
                  className={inputClass}
                />
              </label>
            </div>
            {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancelar
              </Button>
              <Button disabled={saving} type="submit">
                {saving ? "Salvando..." : "Salvar produto"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
