'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

type Employee = { id: string; name: string; role: string; phone: string; email: string; status: string; salario: number | null };
type EmployeeForm = { name: string; role: string; phone: string; email: string; status: string; salario: string };
const emptyForm: EmployeeForm = { name: '', role: 'Barbeiro', phone: '', email: '', status: 'Ativo', salario: '' };
const roles = ['Todos', 'Barbeiro', 'Assistente', 'Recepção'];
const statuses = ['Ativo', 'Inativo'];
const pageSize = 8;
const inputClass = 'mt-1.5 w-full rounded-lg border border-gray-800 bg-surface p-2.5 text-sm text-white outline-none focus:border-gold';
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const initials = (name: string) => name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const phoneMask = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('Todos');
  const [sortOrder, setSortOrder] = useState('A-Z');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(emptyForm);

  const loadEmployees = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase.from('employees').select('id, name, role, phone, email, status, salario').order('name');
      if (fetchError) throw fetchError;
      setEmployees((data || []) as Employee[]);
    } catch (requestError) {
      console.error('Erro ao carregar funcionários:', requestError);
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadEmployees(); }, []);

  const filteredEmployees = useMemo(() => employees.filter((employee) => {
    const search = query.toLowerCase();
    return (employee.name.toLowerCase().includes(search) || employee.email.toLowerCase().includes(search)) && (role === 'Todos' || employee.role === role);
  }).sort((first, second) => sortOrder === 'A-Z' ? first.name.localeCompare(second.name) : second.name.localeCompare(first.name)), [employees, query, role, sortOrder]);
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const visibleEmployees = filteredEmployees.slice((page - 1) * pageSize, page * pageSize);
  const updateFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1); };
  const openCreate = () => { setEditingEmployee(null); setForm(emptyForm); setError(''); setModalOpen(true); };
  const openEdit = (employee: Employee) => { setEditingEmployee(employee); setForm({ name: employee.name, role: employee.role, phone: phoneMask(employee.phone), email: employee.email, status: employee.status, salario: employee.salario == null ? '' : String(employee.salario) }); setError(''); setModalOpen(true); };
  const closeModal = () => { if (saving) return; setModalOpen(false); setEditingEmployee(null); setForm(emptyForm); };

  const saveEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { name: form.name.trim(), role: form.role, phone: form.phone.trim(), email: form.email.trim(), status: form.status, salario: form.salario === '' ? null : Number(form.salario) };
    try {
      const result = editingEmployee ? await supabase.from('employees').update(payload).eq('id', editingEmployee.id).select('id, name, role, phone, email, status, salario').single() : await supabase.from('employees').insert([payload]).select('id, name, role, phone, email, status, salario').single();
      if (result.error) throw result.error;
      const saved = result.data as Employee;
      setEmployees((current) => editingEmployee ? current.map((employee) => employee.id === saved.id ? saved : employee) : [...current, saved]);
      setModalOpen(false);
      setEditingEmployee(null);
      setForm(emptyForm);
    } catch (requestError) {
      console.error('Erro ao salvar funcionário:', requestError);
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setSaving(false);
    }
  };

  const deleteEmployee = async (id: string) => {
    if (!window.confirm('Excluir este funcionário?')) return;
    try {
      const { error: deleteError } = await supabase.from('employees').delete().eq('id', id);
      if (deleteError) throw deleteError;
      setEmployees((current) => current.filter((employee) => employee.id !== id));
    } catch (requestError) {
      console.error('Erro ao excluir funcionário:', requestError);
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    }
  };

  return <div className="animate-rise space-y-4 p-3 sm:p-4">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-gray-500">Equipe e permissões</p><h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Funcionários</h2></div><Button onClick={openCreate}><Plus size={17} /> Novo funcionário</Button></div>
    {error && !modalOpen && <p className="rounded-lg border border-red-900/60 bg-red-950/30 px-4 py-3 text-sm text-red-400">{error}</p>}
    <div className="flex flex-wrap gap-3"><div className="relative min-w-[240px] flex-1"><Search size={17} className="absolute left-3 top-3 text-gray-500" /><input value={query} onChange={(event) => updateFilter(setQuery, event.target.value)} placeholder="Buscar por nome ou e-mail" className="w-full rounded-lg border border-gray-800 bg-surface py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-gold" /></div><select value={role} onChange={(event) => updateFilter(setRole, event.target.value)} className="rounded-lg border border-gray-800 bg-surface px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-gold">{roles.map((item) => <option key={item}>{item}</option>)}</select><select value={sortOrder} onChange={(event) => updateFilter(setSortOrder, event.target.value)} className="rounded-lg border border-gray-800 bg-surface px-3 py-2.5 text-sm text-gray-300 outline-none focus:border-gold"><option>A-Z</option><option>Z-A</option></select></div>
    <section className="overflow-x-auto rounded-xl border border-gray-800 bg-panel"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-surface text-[10px] uppercase tracking-[.12em] text-gray-500"><tr><th className="px-6 py-4">Funcionário</th><th className="px-6 py-4">Contato</th><th className="px-6 py-4">Salário</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Ações</th></tr></thead><tbody>{visibleEmployees.map((employee) => <tr key={employee.id} className="border-t border-gray-800/70 hover:bg-white/[.02]"><td className="px-6 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-gold/15 text-xs font-bold text-gold">{initials(employee.name)}</span><div><p className="font-bold text-white">{employee.name}</p><p className="mt-1 text-xs text-gold">{employee.role}</p></div></div></td><td className="px-6 py-4"><p className="text-gray-300">{phoneMask(employee.phone)}</p><p className="text-xs text-gray-500">{employee.email}</p></td><td className="px-6 py-4 font-semibold text-gold">{employee.salario == null ? 'Não informado' : currency.format(employee.salario)}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${['ativo', 'active'].includes(employee.status.toLowerCase()) ? 'bg-emerald-900/40 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>{employee.status}</span></td><td className="px-6 py-4"><div className="flex justify-end gap-3"><button type="button" aria-label={`Editar ${employee.name}`} onClick={() => openEdit(employee)} className="text-gray-500 hover:text-white"><Pencil size={16} /></button><button type="button" aria-label={`Excluir ${employee.name}`} onClick={() => void deleteEmployee(employee.id)} className="text-gray-500 hover:text-rose-400"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{loading && <p className="p-10 text-center text-sm text-gray-500">Carregando funcionários...</p>}{!loading && visibleEmployees.length === 0 && <p className="p-10 text-center text-sm text-gray-500">Nenhum funcionário encontrado.</p>}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 px-6 py-4"><p className="text-xs text-gray-500">Mostrando {visibleEmployees.length} de {filteredEmployees.length} funcionários</p><div className="flex items-center gap-1"><button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-gray-800 p-2 text-gray-400 hover:text-white disabled:opacity-40"><ChevronLeft size={16} /></button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button type="button" key={pageNumber} onClick={() => setPage(pageNumber)} className={`h-8 min-w-8 rounded-lg px-2 text-xs ${page === pageNumber ? 'bg-gold text-ink' : 'border border-gray-800 text-gray-400 hover:text-white'}`}>{pageNumber}</button>)}<button type="button" aria-label="Próxima página" disabled={page === totalPages} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-gray-800 p-2 text-gray-400 hover:text-white disabled:opacity-40"><ChevronRight size={16} /></button></div></div></section>
    {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-4"><form onSubmit={saveEmployee} className="w-full max-w-lg rounded-xl border border-gray-700 bg-panel p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h3 className="text-lg font-bold text-white">{editingEmployee ? 'Editar funcionário' : 'Novo funcionário'}</h3><p className="mt-1 text-xs text-gray-500">Cadastre os dados da equipe</p></div><button type="button" onClick={closeModal} aria-label="Fechar modal" className="text-gray-500 hover:text-white"><X size={20} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs text-gray-400 sm:col-span-2">Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={inputClass} /></label><label className="text-xs text-gray-400">Função<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className={inputClass}>{roles.slice(1).map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs text-gray-400">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className={inputClass}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs text-gray-400">Telefone<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: phoneMask(event.target.value) })} placeholder="(15) 99999-9999" maxLength={15} inputMode="tel" className={inputClass} /></label><label className="text-xs text-gray-400">E-mail<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className={inputClass} /></label><label className="text-xs text-gray-400 sm:col-span-2">Salário<input type="number" min="0" step="0.01" value={form.salario} onChange={(event) => setForm({ ...form, salario: event.target.value })} placeholder="0,00" className={inputClass} /></label></div>{error && <p className="mt-4 text-sm text-rose-400">{error}</p>}<div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={closeModal}>Cancelar</Button><Button disabled={saving} type="submit">{saving ? 'Salvando...' : 'Salvar funcionário'}</Button></div></form></div>}
  </div>;
}
