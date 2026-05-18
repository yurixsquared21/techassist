import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas. ' +
      'Copie .env.example para .env e preencha com as credenciais do Supabase.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

export type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cpf_cnpj: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  created_at: string;
};

export type ServiceOrder = {
  id: string;
  order_number: number;
  client_id: string | null;
  device_type: string;
  device_brand: string;
  device_model: string;
  serial_number: string;
  problem_description: string;
  diagnosis: string;
  solution: string;
  status: 'open' | 'in_progress' | 'waiting_parts' | 'completed' | 'delivered' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  technician_name: string;
  estimated_value: number;
  final_value: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  client?: Client;
};

export type CashFlowEntry = {
  id: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  entry_date: string;
  service_order_id: string | null;
  created_at: string;
  service_order?: ServiceOrder;
};
