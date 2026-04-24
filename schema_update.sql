-- Tabla lotteries
CREATE TABLE lotteries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  prize_cop BIGINT NOT NULL,
  pieces_per_ticket INT NOT NULL,
  piece_price_cop BIGINT NOT NULL,
  piece_profit_cop BIGINT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'monthly')),
  draw_time TEXT NOT NULL CHECK (draw_time IN ('midday', 'night')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla tickets
CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lottery_id UUID NOT NULL REFERENCES lotteries(id),
  quantity INT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Modificar daily_assignments
ALTER TABLE daily_assignments
  DROP COLUMN IF EXISTS total_tickets,
  DROP COLUMN IF EXISTS ticket_value_cop,
  ADD COLUMN IF NOT EXISTS lottery_id UUID REFERENCES lotteries(id),
  ADD COLUMN IF NOT EXISTS pieces_assigned INT NOT NULL DEFAULT 0;

-- Modificar liquidations
ALTER TABLE liquidations
  DROP COLUMN IF EXISTS total_tickets,
  DROP COLUMN IF EXISTS unsold_tickets,
  DROP COLUMN IF EXISTS sold_tickets,
  DROP COLUMN IF EXISTS amount_due_cop,
  ADD COLUMN IF NOT EXISTS pieces_sold INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pieces_unsold INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profit_cop BIGINT NOT NULL DEFAULT 0;

-- Activar RLS
ALTER TABLE lotteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
