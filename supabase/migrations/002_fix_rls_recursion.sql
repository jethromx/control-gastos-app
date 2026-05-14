-- Fix: infinite recursion in RLS policies caused by policies querying profiles
-- to check admin role from within policies that are themselves on profiles.
--
-- Solution: SECURITY DEFINER function that bypasses RLS when checking admin role.

-- 1. Create helper function (runs as postgres, bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Fix profiles policies (these were the direct cause of recursion)
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_insert" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Fix investments policies
DROP POLICY IF EXISTS "investments_select" ON public.investments;
DROP POLICY IF EXISTS "investments_insert" ON public.investments;
DROP POLICY IF EXISTS "investments_update" ON public.investments;
DROP POLICY IF EXISTS "investments_delete" ON public.investments;

CREATE POLICY "investments_select" ON public.investments FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "investments_insert" ON public.investments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "investments_update" ON public.investments FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "investments_delete" ON public.investments FOR DELETE
  USING (user_id = auth.uid() OR public.is_admin());

-- 4. Fix briq_investments
DROP POLICY IF EXISTS "briq_all" ON public.briq_investments;

CREATE POLICY "briq_all" ON public.briq_investments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.investments i
    WHERE i.id = investment_id AND (i.user_id = auth.uid() OR public.is_admin())
  ));

-- 5. Fix fund_transactions
DROP POLICY IF EXISTS "fund_transactions_all" ON public.fund_transactions;

CREATE POLICY "fund_transactions_all" ON public.fund_transactions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.investments i
    WHERE i.id = fund_id AND (i.user_id = auth.uid() OR public.is_admin())
  ));

-- 6. Fix fund_title_history
DROP POLICY IF EXISTS "fund_title_history_all" ON public.fund_title_history;

CREATE POLICY "fund_title_history_all" ON public.fund_title_history FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.investments i
    WHERE i.id = fund_id AND (i.user_id = auth.uid() OR public.is_admin())
  ));

-- 7. Fix land_details
DROP POLICY IF EXISTS "land_details_all" ON public.land_details;

CREATE POLICY "land_details_all" ON public.land_details FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.investments i
    WHERE i.id = investment_id AND (i.user_id = auth.uid() OR public.is_admin())
  ));

-- 8. Fix land_payments
DROP POLICY IF EXISTS "land_payments_all" ON public.land_payments;

CREATE POLICY "land_payments_all" ON public.land_payments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.land_details ld
    JOIN public.investments i ON i.id = ld.investment_id
    WHERE ld.id = land_id AND (i.user_id = auth.uid() OR public.is_admin())
  ));
