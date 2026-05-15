-- Add 'afore' to the investments type check constraint
ALTER TABLE public.investments
  DROP CONSTRAINT IF EXISTS investments_type_check;

ALTER TABLE public.investments
  ADD CONSTRAINT investments_type_check
  CHECK (type IN ('briq', 'fund', 'land', 'custom', 'afore'));

-- AFORE account details (1:1 with investments)
CREATE TABLE public.afore_details (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  investment_id  uuid REFERENCES public.investments(id) ON DELETE CASCADE NOT NULL UNIQUE,
  afore_name     text NOT NULL,         -- e.g. SURA, Citibanamex
  nsr            numeric(6,2) NOT NULL DEFAULT 0, -- rendimiento neto anual %
  account_number text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- AFORE movements (N:1 with afore_details)
CREATE TABLE public.afore_movements (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  afore_id      uuid REFERENCES public.afore_details(id) ON DELETE CASCADE NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('patron', 'trabajador', 'voluntario', 'gobierno', 'retiro')),
  amount        numeric(14,2) NOT NULL,
  movement_date date NOT NULL,
  balance_after numeric(14,2),          -- optional saldo snapshot
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- updated_at trigger for afore_details
CREATE TRIGGER set_afore_details_updated_at
  BEFORE UPDATE ON public.afore_details
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.afore_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afore_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own afore_details" ON public.afore_details
  USING (
    investment_id IN (
      SELECT id FROM public.investments WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users manage own afore_movements" ON public.afore_movements
  USING (
    afore_id IN (
      SELECT ad.id FROM public.afore_details ad
      JOIN public.investments i ON i.id = ad.investment_id
      WHERE i.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all afore_details" ON public.afore_details
  USING (public.is_admin());

CREATE POLICY "Admins manage all afore_movements" ON public.afore_movements
  USING (public.is_admin());
