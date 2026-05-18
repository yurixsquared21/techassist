import { useEffect, useState, ReactNode } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X, ChevronDown } from 'lucide-react';
import { supabase, ServiceOrder, Client } from '../lib/supabase';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Aberta', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'in_progress', label: 'Em Andamento', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { value: 'waiting_parts', label: 'Aguard. Pecas', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { value: 'completed', label: 'Concluida', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'delivered', label: 'Entregue', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa', color: 'text-slate-400' },
  { value: 'normal', label: 'Normal', color: 'text-blue-400' },
  { value: 'high', label: 'Alta', color: 'text-orange-400' },
  { value: 'urgent', label: 'Urgente', color: 'text-red-400' },
];

const emptyForm = {
  client_id: '', device_type: '', device_brand: '', device_model: '', serial_number: '',
  problem_description: '', diagnosis: '', solution: '', status: 'open', priority: 'normal',
  technician_name: '', estimated_value: '', final_value: '',
};

export default function ServiceOrders() {
  const [orders, setOrders] = useState<(ServiceOrder & { client?: Client })[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const [ordersRes, clientsRes] = await Promise.all([
      supabase.from('service_orders').select('*, client:clients(*)').order('order_number', { ascending: false }),
      supabase.from('clients').select('*').order('name'),
    ]);
    setOrders((ordersRes.data ?? []) as any);
    setClients(clientsRes.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  }

  function openEdit(o: ServiceOrder) {
    setEditingId(o.id);
    setForm({
      client_id: o.client_id ?? '',
      device_type: o.device_type, device_brand: o.device_brand, device_model: o.device_model,
      serial_number: o.serial_number, problem_description: o.problem_description,
      diagnosis: o.diagnosis, solution: o.solution, status: o.status, priority: o.priority,
      technician_name: o.technician_name,
      estimated_value: o.estimated_value ? String(o.estimated_value) : '',
      final_value: o.final_value ? String(o.final_value) : '',
    });
    setError('');
    setShowModal(true);
  }

  async function save() {
    if (!form.device_type.trim()) { setError('Tipo de equipamento e obrigatorio'); return; }
    if (!form.problem_description.trim()) { setError('Descricao do problema e obrigatoria'); return; }
    setSaving(true);
    const payload: any = {
      client_id: form.client_id || null,
      device_type: form.device_type, device_brand: form.device_brand, device_model: form.device_model,
      serial_number: form.serial_number, problem_description: form.problem_description,
      diagnosis: form.diagnosis, solution: form.solution, status: form.status, priority: form.priority,
      technician_name: form.technician_name,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : 0,
      final_value: form.final_value ? parseFloat(form.final_value) : 0,
      updated_at: new Date().toISOString(),
    };
    if (form.status === 'completed' || form.status === 'delivered') {
      payload.completed_at = new Date().toISOString();
    }
    if (editingId) {
      await supabase.from('service_orders').update(payload).eq('id', editingId);
    } else {
      await supabase.from('service_orders').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Deseja excluir esta ordem de servico?')) return;
    await supabase.from('service_orders').delete().eq('id', id);
    load();
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      String(o.order_number).includes(search) ||
      o.device_type.toLowerCase().includes(search.toLowerCase()) ||
      ((o as any).client?.name ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const f = (val: string, key: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ordens de Servico</h1>
          <p className="text-slate-400 text-sm mt-0.5">{orders.length} ordens no total</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4" /> Nova Ordem
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por numero, equipamento ou cliente..." className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition" />
        </div>
        <div className="relative">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="appearance-none bg-slate-900 border border-slate-700 text-slate-300 rounded-xl pl-4 pr-9 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition cursor-pointer">
            <option value="">Todos os Status</option>
            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">Nenhuma ordem encontrada</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipamento</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Cliente</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Prioridade</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Valor Final</th>
                  <th className="w-24 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(o => {
                  const st = STATUS_OPTIONS.find(s => s.value === o.status);
                  const pr = PRIORITY_OPTIONS.find(p => p.value === o.priority);
                  return (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-mono font-semibold text-slate-300">#{o.order_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-sm font-medium text-white">{o.device_type}</div>
                        {(o.device_brand || o.device_model) && (
                          <div className="text-xs text-slate-500">{[o.device_brand, o.device_model].filter(Boolean).join(' ')}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-sm text-slate-300">{(o as any).client?.name ?? '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className={`text-xs font-medium ${pr?.color}`}>{pr?.label}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${st?.color}`}>{st?.label}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <span className="text-sm text-slate-300">
                          {o.final_value > 0 ? o.final_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(o)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => remove(o.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-white font-semibold">{editingId ? 'Editar Ordem' : 'Nova Ordem de Servico'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
              <Section title="Cliente e Equipamento">
                <Field label="Cliente">
                  <div className="relative">
                    <select value={form.client_id} onChange={e => f(e.target.value, 'client_id')} className={`${selCls} appearance-none pr-9`}>
                      <option value="">Selecionar cliente...</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  </div>
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3 sm:col-span-1">
                    <Field label="Tipo de Equipamento *">
                      <input value={form.device_type} onChange={e => f(e.target.value, 'device_type')} placeholder="Notebook, Celular..." className={inputCls} />
                    </Field>
                  </div>
                  <Field label="Marca">
                    <input value={form.device_brand} onChange={e => f(e.target.value, 'device_brand')} placeholder="Dell, Samsung..." className={inputCls} />
                  </Field>
                  <Field label="Modelo">
                    <input value={form.device_model} onChange={e => f(e.target.value, 'device_model')} placeholder="XPS 15, A52..." className={inputCls} />
                  </Field>
                </div>
                <Field label="Numero de Serie">
                  <input value={form.serial_number} onChange={e => f(e.target.value, 'serial_number')} placeholder="S/N ou IMEI" className={inputCls} />
                </Field>
              </Section>

              <Section title="Detalhes do Servico">
                <Field label="Descricao do Problema *">
                  <textarea value={form.problem_description} onChange={e => f(e.target.value, 'problem_description')} placeholder="Descreva o problema relatado pelo cliente..." rows={3} className={`${inputCls} resize-none`} />
                </Field>
                <Field label="Diagnostico">
                  <textarea value={form.diagnosis} onChange={e => f(e.target.value, 'diagnosis')} placeholder="Diagnostico tecnico..." rows={2} className={`${inputCls} resize-none`} />
                </Field>
                <Field label="Solucao Aplicada">
                  <textarea value={form.solution} onChange={e => f(e.target.value, 'solution')} placeholder="Descricao do servico realizado..." rows={2} className={`${inputCls} resize-none`} />
                </Field>
              </Section>

              <Section title="Status e Financeiro">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Status">
                    <div className="relative">
                      <select value={form.status} onChange={e => f(e.target.value, 'status')} className={`${selCls} appearance-none pr-9`}>
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="Prioridade">
                    <div className="relative">
                      <select value={form.priority} onChange={e => f(e.target.value, 'priority')} className={`${selCls} appearance-none pr-9`}>
                        {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </Field>
                </div>
                <Field label="Tecnico Responsavel">
                  <input value={form.technician_name} onChange={e => f(e.target.value, 'technician_name')} placeholder="Nome do tecnico" className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Valor Estimado (R$)">
                    <input type="number" min="0" step="0.01" value={form.estimated_value} onChange={e => f(e.target.value, 'estimated_value')} placeholder="0,00" className={inputCls} />
                  </Field>
                  <Field label="Valor Final (R$)">
                    <input type="number" min="0" step="0.01" value={form.final_value} onChange={e => f(e.target.value, 'final_value')} placeholder="0,00" className={inputCls} />
                  </Field>
                </div>
              </Section>

              {error && <p className="text-red-400 text-sm">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition">Cancelar</button>
              <button onClick={save} disabled={saving} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition";
const selCls = "w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition cursor-pointer";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-800">{title}</h3>
      {children}
    </div>
  );
}
