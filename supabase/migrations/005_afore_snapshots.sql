-- Balance snapshots for AFORE sub-accounts (retiro + vivienda)
CREATE TABLE public.afore_balance_snapshots (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  afore_id        uuid REFERENCES public.afore_details(id) ON DELETE CASCADE NOT NULL,
  snapshot_date   date NOT NULL,
  balance_retiro  numeric(14,2) NOT NULL DEFAULT 0,
  balance_vivienda numeric(14,2) NOT NULL DEFAULT 0,
  balance_total   numeric(14,2) GENERATED ALWAYS AS (balance_retiro + balance_vivienda) STORED,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(afore_id, snapshot_date)
);

-- RLS
ALTER TABLE public.afore_balance_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own afore_balance_snapshots" ON public.afore_balance_snapshots
  USING (
    afore_id IN (
      SELECT ad.id FROM public.afore_details ad
      JOIN public.investments i ON i.id = ad.investment_id
      WHERE i.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins manage all afore_balance_snapshots" ON public.afore_balance_snapshots
  USING (public.is_admin());
