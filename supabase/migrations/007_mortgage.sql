-- Mortgage section
-- Extends the investments table (type = 'mortgage')

-- 1. Add 'mortgage' to the type check constraint
ALTER TABLE investments DROP CONSTRAINT IF EXISTS investments_type_check;
ALTER TABLE investments ADD CONSTRAINT investments_type_check
  CHECK (type IN ('briq', 'fund', 'land', 'afore', 'custom', 'mortgage'));

-- 2. mortgage_details (1:1 with investments)
CREATE TABLE IF NOT EXISTS mortgage_details (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  investment_id    UUID        NOT NULL REFERENCES investments(id) ON DELETE CASCADE UNIQUE,
  bank             VARCHAR(100) NOT NULL,
  original_amount  NUMERIC(15,2) NOT NULL,
  interest_rate    NUMERIC(6,4)  NOT NULL,   -- annual %
  term_months      INTEGER       NOT NULL,
  start_date       DATE          NOT NULL,
  monthly_payment  NUMERIC(15,2) NOT NULL,
  property_value   NUMERIC(15,2),
  account_number   VARCHAR(50),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 3. mortgage_payments
CREATE TABLE IF NOT EXISTS mortgage_payments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mortgage_id    UUID        NOT NULL REFERENCES mortgage_details(id) ON DELETE CASCADE,
  payment_date   DATE        NOT NULL,
  amount         NUMERIC(15,2) NOT NULL,
  principal      NUMERIC(15,2) NOT NULL DEFAULT 0,
  interest       NUMERIC(15,2) NOT NULL DEFAULT 0,
  balance        NUMERIC(15,2),          -- saldo insoluto after this payment
  payment_number INTEGER,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS mortgage_payments_mortgage_id_idx ON mortgage_payments(mortgage_id);
CREATE INDEX IF NOT EXISTS mortgage_payments_date_idx        ON mortgage_payments(payment_date);

-- 4. RLS
ALTER TABLE mortgage_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mortgage_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own mortgage_details"
  ON mortgage_details FOR ALL
  USING (investment_id IN (SELECT id FROM investments WHERE user_id = auth.uid()));

CREATE POLICY "Users manage own mortgage_payments"
  ON mortgage_payments FOR ALL
  USING (mortgage_id IN (
    SELECT md.id FROM mortgage_details md
    JOIN investments i ON i.id = md.investment_id
    WHERE i.user_id = auth.uid()
  ));
