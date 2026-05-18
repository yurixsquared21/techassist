import { ReactNode, useState } from 'react';
import {
  Wrench, LayoutDashboard, Users, ClipboardList, TrendingUp,
  LogOut, Menu, X, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Page = 'dashboard' | 'clients' | 'orders' | 'cashflow';

type Props = {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  children: ReactNode;
};

const navItems: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'clients', label: 'Clientes', icon: Users },
  { page: 'orders', label: 'Ordens de Serviço', icon: ClipboardList },
  { page: 'cashflow', label: 'Fluxo de Caixa', icon: TrendingUp },
];

export default function Layout({ currentPage, onNavigate, children }: Props) {
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 left-0 z-30
        w-64 bg-slate-900 border-r border-slate-800 flex flex-col
        transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">TechAssist</div>
            <div className="text-slate-500 text-xs">Assistência Técnica</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ page, label, icon: Icon }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => { onNavigate(page); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                  active
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="flex-1 text-left">{label}</span>
                {active && <ChevronRight className="w-3 h-3 text-blue-500" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-800/50 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {user?.email?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-medium truncate">{user?.email}</div>
              <div className="text-slate-500 text-xs">Administrador</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-white font-semibold text-sm">
            {navItems.find(n => n.page === currentPage)?.label}
          </span>
          {sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-400 hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
