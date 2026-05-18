import { useEffect, useState, ReactNode } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X, User, Phone, Mail, MapPin, FileText } from 'lucide-react';
import { supabase, Client } from '../lib/supabase';

const emptyForm = {
  name: '', email: '', phone: '', cpf_cnpj: '', address: '', city: '', state: '', notes: ''
};

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('name');
    setClients(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  }

  function openEdit(c: Client) {
    setEditingId(c.id);
    setForm({ name: c.name, email: c.email ?? '', phone: c.phone ?? '', cpf_cnpj: c.cpf_cnpj ?? '', address: c.address ?? '', city: c.city ?? '', state: c.state ?? '', notes: c.notes ?? '' });
    setError('');
    setShowModal(true);
  }

  async function save() {
    if (!form.name.trim()) {
      setError('Nome e obrigatorio');
      return;
    }
  
    setSaving(true);
  
    const { data: { user } } = await supabase.auth.getUser();
  
    const payload = {
      ...form,
      user_id: user.id
    };
  
    if (editingId) {
      await supabase
        .from('clients')
        .update(payload)
        .eq('id', editingId);
    } else {
      await supabase
        .from('clients')
        .insert(payload);
    }
  
    setSaving(false);
    setShowModal(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Deseja excluir este cliente?')) return;
    await supabase.from('clients').delete().eq('id', id);
    load();
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone ?? '').includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-slate-400 text-sm mt-0.5">{clients.length} clientes cadastrados</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou telefone..."
          className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nome</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Contato</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Cidade</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">CPF/CNPJ</th>
                  <th className="w-24 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <User className="w-3.5 h-3.5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{c.name}</div>
                          <div className="text-xs text-slate-500 sm:hidden">{c.phone ?? c.email ?? ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <div className="space-y-0.5">
                        {c.phone && <div className="text-sm text-slate-300 flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-500" />{c.phone}</div>}
                        {c.email && <div className="text-xs text-slate-500 flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.email}</div>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-slate-300">
                        {[c.city, c.state].filter(Boolean).join(' - ') || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-sm text-slate-400">{c.cpf_cnpj || '—'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(c.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-white font-semibold">{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <Field label="Nome *" icon={User}>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome completo" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Telefone" icon={Phone}>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" className={inputCls} />
                </Field>
                <Field label="E-mail" icon={Mail}>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@dominio.com" type="email" className={inputCls} />
                </Field>
              </div>
              <Field label="CPF / CNPJ">
                <input value={form.cpf_cnpj} onChange={e => setForm(f => ({ ...f, cpf_cnpj: e.target.value }))} placeholder="000.000.000-00" className={inputCls} />
              </Field>
              <Field label="Endereco" icon={MapPin}>
                <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Rua, numero, bairro" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cidade">
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Cidade" className={inputCls} />
                </Field>
                <Field label="Estado">
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="UF" maxLength={2} className={inputCls} />
                </Field>
              </div>
              <Field label="Observacoes" icon={FileText}>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observacoes sobre o cliente..." rows={3} className={`${inputCls} resize-none`} />
              </Field>
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

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </label>
      {children}
    </div>
  );
}

