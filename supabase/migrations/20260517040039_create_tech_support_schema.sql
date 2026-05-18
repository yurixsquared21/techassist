/*
  # Technical Support System Schema

  ## Tables

  1. `clients`
     - id, name, email, phone, cpf_cnpj, address, city, state, notes, created_at
  
  2. `service_orders`
     - id, order_number, client_id, device_type, device_brand, device_model, serial_number
     - problem_description, diagnosis, solution, status, priority
     - technician_name, estimated_value, final_value, created_at, updated_at, completed_at
  
  3. `cash_flow_entries`
     - id, type (income/expense), category, description, amount, date
     - service_order_id (optional FK), created_at
  
  ## Security
     - RLS enabled on all tables
     - All authenticated users can access all records (single-company system)
*/

-- CLIENTS TABLE
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  cpf_cnpj text,
  address text,
  city text,
  state text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- SERVICE ORDERS TABLE
CREATE TABLE IF NOT EXISTS service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number serial UNIQUE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  device_type text NOT NULL DEFAULT '',
  device_brand text DEFAULT '',
  device_model text DEFAULT '',
  serial_number text DEFAULT '',
  problem_description text NOT NULL DEFAULT '',
  diagnosis text DEFAULT '',
  solution text DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_parts', 'completed', 'delivered', 'cancelled')),
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  technician_name text DEFAULT '',
  estimated_value numeric(10,2) DEFAULT 0,
  final_value numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select service_orders"
  ON service_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert service_orders"
  ON service_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service_orders"
  ON service_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete service_orders"
  ON service_orders FOR DELETE
  TO authenticated
  USING (true);

-- CASH FLOW TABLE
CREATE TABLE IF NOT EXISTS cash_flow_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  service_order_id uuid REFERENCES service_orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cash_flow_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select cash_flow_entries"
  ON cash_flow_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert cash_flow_entries"
  ON cash_flow_entries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update cash_flow_entries"
  ON cash_flow_entries FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete cash_flow_entries"
  ON cash_flow_entries FOR DELETE
  TO authenticated
  USING (true);

-- INDEX for performance
CREATE INDEX IF NOT EXISTS idx_service_orders_client_id ON service_orders(client_id);
CREATE INDEX IF NOT EXISTS idx_service_orders_status ON service_orders(status);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_date ON cash_flow_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_entries_type ON cash_flow_entries(type);
