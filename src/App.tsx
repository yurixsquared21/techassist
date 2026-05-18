import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ServiceOrders from './pages/ServiceOrders';
import CashFlow from './pages/CashFlow';

type Page = 'dashboard' | 'clients' | 'orders' | 'cashflow';

function AppContent() {
  const { session, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <Layout currentPage={page} onNavigate={setPage}>
      {page === 'dashboard' && <Dashboard />}
      {page === 'clients' && <Clients />}
      {page === 'orders' && <ServiceOrders />}
      {page === 'cashflow' && <CashFlow />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
