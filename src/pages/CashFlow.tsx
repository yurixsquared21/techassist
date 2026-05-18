import { useEffect, useState, ReactNode } from 'react';
import { Plus, Search, CreditCard as Edit2, Trash2, X, TrendingUp, TrendingDown, DollarSign, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase, CashFlowEntry } from '../lib/supabase';

const INCOME_CATEGORIES = ['Servico de Reparo', 'Venda de Pecas', 'Venda de Produto', 'Consultoria', 'Outros'];
const EXPENSE_CATEGORIES = ['Pecas e Componentes', 'Aluguel', 'Energia Eletrica', 'Internet', 'Salarios', 'Ferramentas', 'Marketing', 'Impostos', 'Outros'];

const emptyForm = { type: 'income', category: '', description: '', amount: '', entry_date: new Date().toISOString().split('T')[0], service_order_id: '' };

export default function CashFlow() {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
  const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('cash_flow_entries')
      .select('*')
      .gte('entry_date', monthStart)
      .lte('entry_date', monthEnd)
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });
    setEntries(data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [monthStart, monthEnd]);

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError('');
    setShowModal(true);
  }

  function openEdit(e: CashFlowEntry) {
    setEditingId(e.id);
    setForm({ type: e.type, category: e.category, description: e.description, amount: String(e.amount), entry_date: e.entry_date, service_order_id: e.service_order_id ?? '' });
    setError('');
    setShowModal(true);
  }

  async function save() {
    if (!form.description.trim()) { setError('Descricao e obrigatoria'); return; }
    if (!form.amount || parseFloat(form.amount) <= 0) { setError('Valor deve ser maior que zero'); return; }
    if (!form.category) { setError('Categoria e obrigatoria'); return; }
    setSaving(true);
    const payload = { type: form.type as 'income' | 'expense', category: form.category, description: form.description, amount: parseFloat(form.amount), entry_date: form.entry_date, service_order_id: form.service_order_id || null };
    if (editingId) {
      await supabase.from('cash_flow_entries').update(payload).eq('id', editingId);
    } else {
      await supabase.from('cash_flow_entries').insert(payload);
    }
    setSaving(false);
    setShowModal(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm('Deseja excluir este lancamento?')) return;
    await supabase.from('cash_flow_entries').delete().eq('id', id);
    load();
  }

  const filtered = entries.filter(e => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || e.type === filterType;
    return matchSearch && matchType;
  });

  const totalIncome = entries.filter(e => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const totalExpense = entries.filter(e => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;
  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function prevMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); }
  function nextMonth() { setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Fluxo de Caixa</h1>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={prevMonth} className="text-slate-400 hover:text-white transition p-0.5">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-400 text-sm capitalize">{monthName}</span>
            <button onClick={nextMonth} className="text-slate-400 hover:text-white transition p-0.5">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20">
          <Plus className="w-4 h-4" /> Lancamento
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">Receitas</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{fmt(totalIncome)}</div>
          <div className="text-xs text-slate-500 mt-0.5">{entries.filter(e => e.type === 'income').length} lancamentos</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-slate-400 text-sm">Despesas</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{fmt(totalExpense)}</div>
          <div className="text-xs text-slate-500 mt-0.5">{entries.filter(e => e.type === 'expense').length} lancamentos</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${balance >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'}`}>
              <DollarSign className={`w-4 h-4 ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`} />
            </div>
            <span className="text-slate-400 text-sm">Saldo</span>
          </div>
          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{fmt(balance)}</div>
          <div className="text-xs text-slate-500 mt-0.5">{entries.length} lancamentos no mes</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por descricao ou categoria..." className="w-full bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition" />
        </div>
        <div className="relative">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="appearance-none bg-slate-900 border border-slate-700 text-slate-300 rounded-xl pl-4 pr-9 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition cursor-pointer">
            <option value="">Todos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
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
          <div className="text-center py-12 text-slate-500 text-sm">Nenhum lancamento encontrado</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Descricao</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:table-cell">Categoria</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</th>
                  <th className="w-24 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-400">{new Date(e.entry_date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-white">{e.description}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">{e.category}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      {e.type === 'income' ? (
                        <span className="text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg">Receita</span>
                      ) : (
                        <span className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">Despesa</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-sm font-semibold ${e.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {e.type === 'expense' ? '- ' : '+ '}{fmt(Number(e.amount))}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(e)} className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(e.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition">
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
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h2 className="text-white font-semibold">{editingId ? 'Editar Lancamento' : 'Novo Lancamento'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 bg-slate-800 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: 'income', category: '' }))}
                  className={`py-2 rounded-lg text-sm font-semibold transition ${form.type === 'income' ? 'bg-green-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: 'expense', category: '' }))}
                  className={`py-2 rounded-lg text-sm font-semibold transition ${form.type === 'expense' ? 'bg-red-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Despesa
                </button>
              </div>

              <Field label="Categoria *">
                <div className="relative">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={`${selCls} appearance-none pr-9`}>
                    <option value="">Selecionar categoria...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </Field>

              <Field label="Descricao *">
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descricao do lancamento" className={inputCls} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor (R$) *">
                  <input type="number" min="0.01" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" className={inputCls} />
                </Field>
                <Field label="Data *">
                  <input type="date" value={form.entry_date} onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))} className={inputCls} />
                </Field>
              </div>

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
