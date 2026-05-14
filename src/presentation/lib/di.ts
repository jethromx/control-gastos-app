import { createClient } from '../../infrastructure/supabase/client';
import { SupabaseInvestmentRepository } from '../../infrastructure/repositories/investment.supabase.repository';
import { SupabaseBriqRepository, SupabaseFundRepository, SupabaseLandRepository } from '../../infrastructure/repositories/investment.supabase.repository';
import { SupabaseUserRepository } from '../../infrastructure/repositories/user.supabase.repository';
import { InvestmentUseCases } from '../../application/use-cases/investment.use-cases';

export function getInvestmentUseCases() {
  const supabase = createClient();
  return new InvestmentUseCases(
    new SupabaseInvestmentRepository(supabase),
    new SupabaseBriqRepository(supabase),
    new SupabaseFundRepository(supabase),
    new SupabaseLandRepository(supabase)
  );
}

export function getUserRepository() {
  const supabase = createClient();
  return new SupabaseUserRepository(supabase);
}
