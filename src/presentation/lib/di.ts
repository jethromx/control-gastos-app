import { createClient } from '../../infrastructure/supabase/client';
import { SupabaseInvestmentRepository, SupabaseBriqRepository, SupabaseFundRepository, SupabaseLandRepository, SupabaseAforeRepository } from '../../infrastructure/repositories/investment.supabase.repository';
import { SupabaseUserRepository } from '../../infrastructure/repositories/user.supabase.repository';
import { InvestmentUseCases } from '../../application/use-cases/investment.use-cases';

// Module-level singletons — repositories are stateless wrappers around the
// Supabase client (which already manages its own auth session), so reusing
// them across calls is safe and avoids allocating new objects on every hook call.
let _investmentUseCases: InvestmentUseCases | null = null;
let _userRepository: SupabaseUserRepository | null = null;

export function getInvestmentUseCases(): InvestmentUseCases {
  if (!_investmentUseCases) {
    const supabase = createClient();
    _investmentUseCases = new InvestmentUseCases(
      new SupabaseInvestmentRepository(supabase),
      new SupabaseBriqRepository(supabase),
      new SupabaseFundRepository(supabase),
      new SupabaseLandRepository(supabase),
      new SupabaseAforeRepository(supabase)
    );
  }
  return _investmentUseCases;
}

export function getUserRepository(): SupabaseUserRepository {
  if (!_userRepository) {
    const supabase = createClient();
    _userRepository = new SupabaseUserRepository(supabase);
  }
  return _userRepository;
}

// Call on sign-out so the next session gets fresh instances.
export function resetDI() {
  _investmentUseCases = null;
  _userRepository = null;
}
