'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export type ServiceOption = { id: string; name: string; price: number; duration: number; title?: string };
export type CustomerOption = { id: string; name: string; email?: string | null };
export type EmployeeOption = { id: string; name: string; role: string; status: string };
export type Appointment = { id: string; customer_id: string; barber_id: string; service_id: string; date: string; start_time: string; end_time: string; services?: ServiceOption | ServiceOption[] | null; customers?: CustomerOption | CustomerOption[] | null };
type Props = { initialDate: string; initialTime: string; appointment?: Appointment | null; services?: ServiceOption[]; onClose: () => void; onSave: (data: Omit<Appointment, 'id' | 'services'>) => Promise<void> };
const field = 'mt-1.5 w-full rounded-lg border border-gray-800 bg-surface p-2.5 text-sm text-white outline-none focus:border-gold';
const addDuration = (time: string, duration: number) => { const [hours, minutes] = time.split(':').map(Number); const totalMinutes = hours * 60 + minutes + duration; return `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`; };

export function ModalAppointment({ initialDate, initialTime, appointment, onClose, onSave }: Props) {
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [barberId, setBarberId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState(initialTime);
  const [endTime, setEndTime] = useState(initialTime);
  const [saving, setSaving] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);
  const [serviceError, setServiceError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow || 'unset'; };
  }, []);

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingServices(true);
      setServiceError('');

      const [{ data: serviceData, error: serviceFetchError }, { data: customerData, error: customerFetchError }, employeeResponse] = await Promise.all([
        supabase.from('services').select('id, name, price, duration').order('name'),
        supabase.from('customers').select('id, name, email').order('name'),
        supabase.from('employees').select('id, name, role, status').order('name'),
      ]);

      const employeeData = (employeeResponse.data || []) as EmployeeOption[];
      const employeeError = employeeResponse.error;
      const requestError = serviceFetchError || customerFetchError || employeeError;

      if (requestError) {
        setServiceError(requestError.message || 'Não foi possível carregar os dados.');
      }

      const normalizedEmployees = employeeData.filter((employee) => {
        const status = String(employee.status || '').trim().toLowerCase();
        return status === 'active' || status === 'ativo' || status === 'available' || status === 'disponível' || status === 'disponivel' || !status;
      });

      setServices((serviceData || []) as ServiceOption[]);
      setCustomers((customerData || []) as CustomerOption[]);
      setEmployees(normalizedEmployees);

      setServiceId(appointment?.service_id || (serviceData?.[0] as ServiceOption | undefined)?.id || '');
      setCustomerId(appointment?.customer_id || (customerData?.[0] as CustomerOption | undefined)?.id || '');
      setBarberId(appointment?.barber_id || (normalizedEmployees[0]?.id || ''));
      setLoadingServices(false);
    };
    void loadOptions();
  }, [appointment]);

  useEffect(() => {
    setDate(appointment?.date || initialDate);
    setStartTime(appointment?.start_time || initialTime);
    setEndTime(appointment?.end_time || initialTime);
  }, [appointment, initialDate, initialTime]);

  useEffect(() => {
    if (!appointment) {
      const service = services.find((item) => item.id === serviceId);
      if (service) setEndTime(addDuration(startTime, service.duration));
    }
  }, [appointment, serviceId, services, startTime]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    await onSave({ customer_id: customerId, barber_id: barberId, service_id: serviceId, date, start_time: startTime, end_time: endTime });
    setSaving(false);
  };

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <form onSubmit={submit} className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/5 bg-[#141517] p-6" role="dialog" aria-modal="true" aria-labelledby="appointment-modal-title">
        <div className="flex items-center justify-between"><div><h3 id="appointment-modal-title" className="text-lg font-bold text-white">{appointment ? 'Editar agendamento' : 'Novo agendamento'}</h3><p className="mt-1 text-xs text-gray-500">Escolha o serviço e o horário</p></div><button type="button" onClick={onClose} aria-label="Fechar modal" className="text-gray-500 hover:text-white"><X size={20} /></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="text-xs text-gray-400 sm:col-span-2">Cliente<select required value={customerId} onChange={(event) => setCustomerId(event.target.value)} disabled={loadingServices} className={field}><option value="">{loadingServices ? 'Carregando clientes...' : 'Selecione um cliente'}</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs text-gray-400 sm:col-span-2">Barbeiro<select required value={barberId} onChange={(event) => setBarberId(event.target.value)} disabled={loadingServices} className={field}><option value="">{loadingServices ? 'Carregando barbeiros...' : 'Selecione um barbeiro'}</option>{employees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-xs text-gray-400 sm:col-span-2">Serviço<select required value={serviceId} onChange={(event) => setServiceId(event.target.value)} disabled={loadingServices} className={field}><option value="">{loadingServices ? 'Carregando serviços...' : 'Selecione um serviço'}</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name} - R$ {item.price.toFixed(2).replace('.', ',')}</option>)}</select>{serviceError && <span className="mt-1 block text-xs text-red-400">{serviceError}</span>}</label>
          <label className="text-xs text-gray-400">Data<input required type="date" value={date} onChange={(event) => setDate(event.target.value)} className={field} /></label>
          <label className="text-xs text-gray-400">Início<input required type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className={field} /></label>
          <label className="text-xs text-gray-400">Fim<input required type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className={field} /></label>
        </div>
        <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={saving || loadingServices}>{saving ? 'Salvando...' : appointment ? 'Salvar alterações' : 'Criar agendamento'}</Button></div>
      </form>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
