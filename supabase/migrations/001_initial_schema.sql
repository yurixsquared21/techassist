-- TechAssist: schema inicial
-- Execute no Supabase: SQL Editor → New query → Run

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  cpf_cnpj text,
  address text,
  city text,
  state text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ordens de serviço
CREATE SEQUENCE IF NOT EXISTS public.service_orders_order_number_seq;

CREATE TABLE IF NOT EXISTS public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number integer NOT NULL DEFAULT nextval('public.service_orders_order_number_seq'),
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  device_type text NOT NULL DEFAULT '',
  device_brand text NOT NULL DEFAULT '',
  device_model text NOT NULL DEFAULT '',
  serial_number text NOT NULL DEFAULT '',
  problem_description text NOT NULL DEFAULT '',
  diagnosis text NOT NULL DEFAULT '',
  solution text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  technician_name text NOT NULL DEFAULT '',
  estimated_value numeric(12, 2) NOT NULL DEFAULT 0,
  final_value numeric(12, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER SEQUENCE public.service_orders_order_number_seq OWNED BY public.service_orders.order_number;

-- Fluxo de caixa
CREATE TABLE IF NOT EXISTS public.cash_flow_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  description text NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  service_order_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients (name);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON public.service_orders (status);
CREATE INDEX IF NOT EXISTS idx_service_orders_client_id ON public.service_orders (client_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entry_date ON public.cash_flow_entries (entry_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_type ON public.cash_flow_entries (type);

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS service_orders_updated_at ON public.service_orders;
CREATE TRIGGER service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security (apenas usuários autenticados)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_flow_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.clients;
CREATE POLICY "Authenticated users can manage clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage service_orders" ON public.service_orders;
CREATE POLICY "Authenticated users can manage service_orders"
  ON public.service_orders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can manage cash_flow_entries" ON public.cash_flow_entries;
CREATE POLICY "Authenticated users can manage cash_flow_entries"
  ON public.cash_flow_entries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
