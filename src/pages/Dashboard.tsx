import { useEffect, useState } from 'react';
import { Users, ClipboardList, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Stats = {
  totalClients: number;
  openOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  monthIncome: number;
  monthExpense: number;
  recentOrders: Array<{
    id: string;
    order_number: number;
    device_type: string;
    status: string;
    priority: string;
    client_name: string;
    created_at: string;
  }>;
};

const statusLabel: Record<string, { label: string; color: string }> = {
  open: { label: 'Aberta', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  in_progress: { label: 'Em Andamento', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  waiting_parts: { label: 'Aguard. Peças', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  completed: { label: 'Concluída', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  delivered: { label: 'Entregue', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  cancelled: { label: 'Cancelada', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

const priorityLabel: Record<string, { label: string; color: string }> = {
  low: { label: 'Baixa', color: 'text-slate-400' },
  normal: { label: 'Normal', color: 'text-blue-400' },
  high: { label: 'Alta', color: 'text-orange-400' },
  urgent: { label: 'Urgente', color: 'text-red-400' },
};

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    openOrders: 0,
    inProgressOrders: 0,
    completedOrders: 0,
    monthIncome: 0,
    monthExpense: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

      const [clientsRes, ordersRes, cashRes, recentRes] = await Promise.all([
        supabase.from('clients').select('id', { count: 'exact', head: true }),
        supabase.from('service_orders').select('status'),
        supabase.from('cash_flow_entries').select('type, amount').gte('entry_date', monthStart).lte('entry_date', monthEnd),
        supabase.from('service_orders')
          .select('id, order_number, device_type, status, priority, created_at, client:clients(name)')
          .order('created_at', { ascending: false })
          .limit(6),
      ]);

      const orders = ordersRes.data ?? [];
      const cash = cashRes.data ?? [];
      const recent = recentRes.data ?? [];

      setStats({
        totalClients: clientsRes.count ?? 0,
        openOrders: orders.filter(o => o.status === 'open').length,
        inProgressOrders: orders.filter(o => o.status === 'in_progress' || o.status === 'waiting_parts').length,
        completedOrders: orders.filter(o => o.status === 'completed' || o.status === 'delivered').length,
        monthIncome: cash.filter(c => c.type === 'income').reduce((s, c) => s + Number(c.amount), 0),
        monthExpense: cash.filter(c => c.type === 'expense').reduce((s, c) => s + Number(c.amount), 0),
        recentOrders: recent.map((o: any) => ({
          id: o.id,
          order_number: o.order_number,
          device_type: o.device_type,
          status: o.status,
          priority: o.priority,
          client_name: o.client?.name ?? 'Sem cliente',
          created_at: o.created_at,
        })),
      });
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">Visao geral do sistema</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Clientes" value={stats.totalClients} color="blue" />
        <StatCard icon={AlertCircle} label="Ordens Abertas" value={stats.openOrders} color="yellow" />
        <StatCard icon={Clock} label="Em Andamento" value={stats.inProgressOrders} color="orange" />
        <StatCard icon={CheckCircle} label="Concluidas" value={stats.completedOrders} color="green" />
      </div>

      {/* Cash summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-slate-400 text-sm">Receitas do Mes</span>
          </div>
          <div className="text-2xl font-bold text-green-400">{fmt(stats.monthIncome)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-slate-400 text-sm">Despesas do Mes</span>
          </div>
          <div className="text-2xl font-bold text-red-400">{fmt(stats.monthExpense)}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-slate-400 text-sm">Saldo do Mes</span>
          </div>
          <div className={`text-2xl font-bold ${stats.monthIncome - stats.monthExpense >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {fmt(stats.monthIncome - stats.monthExpense)}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="px-6 py-4 border-b border-slate-800">
          <h2 className="text-white font-semibold">Ordens Recentes</h2>
        </div>
        <div className="divide-y divide-slate-800">
          {stats.recentOrders.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-500 text-sm">Nenhuma ordem de servico</div>
          )}
          {stats.recentOrders.map(order => {
            const st = statusLabel[order.status] ?? statusLabel.open;
            const pr = priorityLabel[order.priority] ?? priorityLabel.normal;
            return (
              <div key={order.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-slate-300">#{order.order_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{order.device_type}</div>
                  <div className="text-xs text-slate-400 truncate">{order.client_name}</div>
                </div>
                <span className={`text-xs font-medium ${pr.color} hidden sm:block`}>{pr.label}</span>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${st.color}`}>{st.label}</span>
                <span className="text-xs text-slate-500 hidden md:block">
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof Users; label: string; value: number; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    orange: 'bg-orange-500/10 text-orange-400',
    green: 'bg-green-500/10 text-green-400',
  };
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-slate-400 text-xs mt-0.5">{label}</div>
    </div>
  );
}
