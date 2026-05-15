// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { SupabaseClient } from '@supabase/supabase-js';
import {
  Investment,
  BriqInvestment,
  FundTransaction,
  FundTitleValue,
  LandPayment,
  LandInvestmentDetails,
  AforeDetails,
  AforeMovement,
  AforeBalanceSnapshot,
  MortgageDetails,
  MortgagePayment,
} from '../../domain/entities/investment.entity';
import {
  InvestmentRepository,
  BriqRepository,
  FundRepository,
  LandRepository,
  AforeRepository,
  MortgageRepository,
} from '../../domain/repositories/investment.repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function mapInvestment(row: Row): Investment {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    description: row.description ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapBriq(row: Row): BriqInvestment {
  return {
    id: row.id,
    investmentId: row.investment_id,
    annualInterestRate: Number(row.annual_interest_rate),
    investedAmount: Number(row.invested_amount),
    investmentDate: new Date(row.investment_date),
    termMonths: row.term_months ?? undefined,
  };
}

function mapFundTransaction(row: Row): FundTransaction {
  return {
    id: row.id,
    fundId: row.fund_id,
    transactionDate: new Date(row.transaction_date),
    titlesQuantity: Number(row.titles_quantity),
    titleCost: Number(row.title_cost),
    totalAmount: Number(row.total_amount),
    notes: row.notes ?? undefined,
  };
}

function mapFundTitleValue(row: Row): FundTitleValue {
  return {
    id: row.id,
    fundId: row.fund_id,
    date: new Date(row.date),
    titleValue: Number(row.title_value),
  };
}

function mapLandDetails(row: Row): LandInvestmentDetails {
  return {
    id: row.id,
    investmentId: row.investment_id,
    totalPrice: Number(row.total_price),
    purchaseDate: new Date(row.purchase_date),
    paymentFrequency: row.payment_frequency,
  };
}

function mapLandPayment(row: Row): LandPayment {
  return {
    id: row.id,
    landId: row.land_id,
    paymentDate: new Date(row.payment_date),
    amount: Number(row.amount),
    paymentType: row.payment_type,
    description: row.description ?? undefined,
  };
}

function mapAforeDetails(row: Row): AforeDetails {
  return {
    id: row.id,
    investmentId: row.investment_id,
    aforeName: row.afore_name,
    nsr: Number(row.nsr),
    accountNumber: row.account_number ?? undefined,
  };
}

function mapAforeSnapshot(row: Row): AforeBalanceSnapshot {
  return {
    id: row.id,
    aforeId: row.afore_id,
    snapshotDate: new Date(row.snapshot_date),
    balanceRetiro: Number(row.balance_retiro),
    balanceVivienda: Number(row.balance_vivienda),
    balanceTotal: Number(row.balance_total),
    notes: row.notes ?? undefined,
  };
}

function mapAforeMovement(row: Row): AforeMovement {
  return {
    id: row.id,
    aforeId: row.afore_id,
    movementType: row.movement_type,
    amount: Number(row.amount),
    movementDate: new Date(row.movement_date),
    balanceAfter: row.balance_after != null ? Number(row.balance_after) : undefined,
    description: row.description ?? undefined,
  };
}

export class SupabaseInvestmentRepository implements InvestmentRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private supabase: SupabaseClient<any>) {}

  async findById(id: string): Promise<Investment | null> {
    const { data } = await this.supabase.from('investments').select('*').eq('id', id).single();
    return data ? mapInvestment(data) : null;
  }

  async findByUserId(userId: string): Promise<Investment[]> {
    const { data } = await this.supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(mapInvestment);
  }

  async create(data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Investment> {
    const { data: row, error } = await this.supabase
      .from('investments')
      .insert({ user_id: data.userId, name: data.name, type: data.type, description: data.description, status: data.status })
      .select()
      .single();
    if (error) throw error;
    return mapInvestment(row);
  }

  async update(id: string, data: Partial<Investment>): Promise<Investment> {
    const { data: row, error } = await this.supabase
      .from('investments')
      .update({ name: data.name, description: data.description, status: data.status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapInvestment(row);
  }

  async delete(id: string): Promise<void> {
    await this.supabase.from('investments').delete().eq('id', id);
  }
}

export class SupabaseBriqRepository implements BriqRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private supabase: SupabaseClient<any>) {}

  async findByInvestmentId(investmentId: string): Promise<BriqInvestment | null> {
    const { data } = await this.supabase
      .from('briq_investments')
      .select('*')
      .eq('investment_id', investmentId)
      .single();
    return data ? mapBriq(data) : null;
  }

  async create(data: Omit<BriqInvestment, 'id'>): Promise<BriqInvestment> {
    const { data: row, error } = await this.supabase
      .from('briq_investments')
      .insert({
        investment_id: data.investmentId,
        annual_interest_rate: data.annualInterestRate,
        invested_amount: data.investedAmount,
        investment_date: data.investmentDate.toISOString().split('T')[0],
        term_months: data.termMonths,
      })
      .select()
      .single();
    if (error) throw error;
    return mapBriq(row);
  }

  async update(id: string, data: Partial<BriqInvestment>): Promise<BriqInvestment> {
    const updateData: Record<string, unknown> = {};
    if (data.annualInterestRate !== undefined) updateData.annual_interest_rate = data.annualInterestRate;
    if (data.investedAmount !== undefined) updateData.invested_amount = data.investedAmount;
    if (data.investmentDate) updateData.investment_date = data.investmentDate.toISOString().split('T')[0];
    if (data.termMonths !== undefined) updateData.term_months = data.termMonths;
    const { data: row, error } = await this.supabase
      .from('briq_investments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapBriq(row);
  }

  async delete(id: string): Promise<void> {
    await this.supabase.from('briq_investments').delete().eq('id', id);
  }
}

export class SupabaseFundRepository implements FundRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private supabase: SupabaseClient<any>) {}

  async findTransactionsByFundId(fundId: string): Promise<FundTransaction[]> {
    const { data } = await this.supabase
      .from('fund_transactions')
      .select('*')
      .eq('fund_id', fundId)
      .order('transaction_date', { ascending: true });
    return (data ?? []).map(mapFundTransaction);
  }

  async createTransaction(data: Omit<FundTransaction, 'id'>): Promise<FundTransaction> {
    const { data: row, error } = await this.supabase
      .from('fund_transactions')
      .insert({
        fund_id: data.fundId,
        transaction_date: data.transactionDate.toISOString().split('T')[0],
        titles_quantity: data.titlesQuantity,
        title_cost: data.titleCost,
        total_amount: data.totalAmount,
        notes: data.notes,
      })
      .select()
      .single();
    if (error) throw error;
    return mapFundTransaction(row);
  }

  async updateTransaction(id: string, data: Partial<FundTransaction>): Promise<FundTransaction> {
    const updateData: Record<string, unknown> = {};
    if (data.transactionDate) updateData.transaction_date = data.transactionDate.toISOString().split('T')[0];
    if (data.titlesQuantity !== undefined) updateData.titles_quantity = data.titlesQuantity;
    if (data.titleCost !== undefined) updateData.title_cost = data.titleCost;
    if (data.totalAmount !== undefined) updateData.total_amount = data.totalAmount;
    if (data.notes !== undefined) updateData.notes = data.notes;
    const { data: row, error } = await this.supabase
      .from('fund_transactions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapFundTransaction(row);
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.supabase.from('fund_transactions').delete().eq('id', id);
  }

  async findTitleHistoryByFundId(fundId: string): Promise<FundTitleValue[]> {
    const { data } = await this.supabase
      .from('fund_title_history')
      .select('*')
      .eq('fund_id', fundId)
      .order('date', { ascending: true });
    return (data ?? []).map(mapFundTitleValue);
  }

  async addTitleValue(data: Omit<FundTitleValue, 'id'>): Promise<FundTitleValue> {
    const { data: row, error } = await this.supabase
      .from('fund_title_history')
      .upsert({
        fund_id: data.fundId,
        date: data.date.toISOString().split('T')[0],
        title_value: data.titleValue,
      }, { onConflict: 'fund_id,date' })
      .select()
      .single();
    if (error) throw error;
    return mapFundTitleValue(row);
  }

  async updateTitleValue(id: string, data: Partial<FundTitleValue>): Promise<FundTitleValue> {
    const { data: row, error } = await this.supabase
      .from('fund_title_history')
      .update({ title_value: data.titleValue })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapFundTitleValue(row);
  }

  async deleteTitleValue(id: string): Promise<void> {
    await this.supabase.from('fund_title_history').delete().eq('id', id);
  }
}

export class SupabaseLandRepository implements LandRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private supabase: SupabaseClient<any>) {}

  async findDetailsByInvestmentId(investmentId: string): Promise<LandInvestmentDetails | null> {
    const { data } = await this.supabase
      .from('land_details')
      .select('*')
      .eq('investment_id', investmentId)
      .single();
    return data ? mapLandDetails(data) : null;
  }

  async createDetails(data: Omit<LandInvestmentDetails, 'id'>): Promise<LandInvestmentDetails> {
    const { data: row, error } = await this.supabase
      .from('land_details')
      .insert({
        investment_id: data.investmentId,
        total_price: data.totalPrice,
        purchase_date: data.purchaseDate.toISOString().split('T')[0],
        payment_frequency: data.paymentFrequency,
      })
      .select()
      .single();
    if (error) throw error;
    return mapLandDetails(row);
  }

  async updateDetails(id: string, data: Partial<LandInvestmentDetails>): Promise<LandInvestmentDetails> {
    const updateData: Record<string, unknown> = {};
    if (data.totalPrice !== undefined) updateData.total_price = data.totalPrice;
    if (data.purchaseDate) updateData.purchase_date = data.purchaseDate.toISOString().split('T')[0];
    if (data.paymentFrequency) updateData.payment_frequency = data.paymentFrequency;
    const { data: row, error } = await this.supabase
      .from('land_details')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapLandDetails(row);
  }

  async findPaymentsByLandId(landId: string): Promise<LandPayment[]> {
    const { data } = await this.supabase
      .from('land_payments')
      .select('*')
      .eq('land_id', landId)
      .order('payment_date', { ascending: true });
    return (data ?? []).map(mapLandPayment);
  }

  async createPayment(data: Omit<LandPayment, 'id'>): Promise<LandPayment> {
    const { data: row, error } = await this.supabase
      .from('land_payments')
      .insert({
        land_id: data.landId,
        payment_date: data.paymentDate.toISOString().split('T')[0],
        amount: data.amount,
        payment_type: data.paymentType,
        description: data.description,
      })
      .select()
      .single();
    if (error) throw error;
    return mapLandPayment(row);
  }

  async updatePayment(id: string, data: Partial<LandPayment>): Promise<LandPayment> {
    const updateData: Record<string, unknown> = {};
    if (data.paymentDate) updateData.payment_date = data.paymentDate.toISOString().split('T')[0];
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.paymentType) updateData.payment_type = data.paymentType;
    if (data.description !== undefined) updateData.description = data.description;
    const { data: row, error } = await this.supabase
      .from('land_payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapLandPayment(row);
  }

  async deletePayment(id: string): Promise<void> {
    await this.supabase.from('land_payments').delete().eq('id', id);
  }
}

export class SupabaseAforeRepository implements AforeRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private supabase: SupabaseClient<any>) {}

  async findDetailsByInvestmentId(investmentId: string): Promise<AforeDetails | null> {
    const { data } = await this.supabase
      .from('afore_details')
      .select('*')
      .eq('investment_id', investmentId)
      .single();
    return data ? mapAforeDetails(data) : null;
  }

  async createDetails(data: Omit<AforeDetails, 'id'>): Promise<AforeDetails> {
    const { data: row, error } = await this.supabase
      .from('afore_details')
      .insert({
        investment_id: data.investmentId,
        afore_name: data.aforeName,
        nsr: data.nsr,
        account_number: data.accountNumber ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapAforeDetails(row);
  }

  async updateDetails(id: string, data: Partial<AforeDetails>): Promise<AforeDetails> {
    const updateData: Record<string, unknown> = {};
    if (data.aforeName !== undefined) updateData.afore_name = data.aforeName;
    if (data.nsr !== undefined) updateData.nsr = data.nsr;
    if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber;
    const { data: row, error } = await this.supabase
      .from('afore_details')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapAforeDetails(row);
  }

  async findMovementsByAforeId(aforeId: string): Promise<AforeMovement[]> {
    const { data } = await this.supabase
      .from('afore_movements')
      .select('*')
      .eq('afore_id', aforeId)
      .order('movement_date', { ascending: true });
    return (data ?? []).map(mapAforeMovement);
  }

  async createMovement(data: Omit<AforeMovement, 'id'>): Promise<AforeMovement> {
    const { data: row, error } = await this.supabase
      .from('afore_movements')
      .insert({
        afore_id: data.aforeId,
        movement_type: data.movementType,
        amount: data.amount,
        movement_date: data.movementDate.toISOString().split('T')[0],
        balance_after: data.balanceAfter ?? null,
        description: data.description ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapAforeMovement(row);
  }

  async updateMovement(id: string, data: Partial<AforeMovement>): Promise<AforeMovement> {
    const updateData: Record<string, unknown> = {};
    if (data.movementType !== undefined) updateData.movement_type = data.movementType;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.movementDate) updateData.movement_date = data.movementDate.toISOString().split('T')[0];
    if (data.balanceAfter !== undefined) updateData.balance_after = data.balanceAfter ?? null;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    const { data: row, error } = await this.supabase
      .from('afore_movements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapAforeMovement(row);
  }

  async deleteMovement(id: string): Promise<void> {
    await this.supabase.from('afore_movements').delete().eq('id', id);
  }

  async findSnapshotsByAforeId(aforeId: string): Promise<AforeBalanceSnapshot[]> {
    const { data } = await this.supabase
      .from('afore_balance_snapshots')
      .select('*')
      .eq('afore_id', aforeId)
      .order('snapshot_date', { ascending: true });
    return (data ?? []).map(mapAforeSnapshot);
  }

  async upsertSnapshot(data: Omit<AforeBalanceSnapshot, 'id' | 'balanceTotal'>): Promise<AforeBalanceSnapshot> {
    const { data: row, error } = await this.supabase
      .from('afore_balance_snapshots')
      .upsert({
        afore_id: data.aforeId,
        snapshot_date: data.snapshotDate.toISOString().split('T')[0],
        balance_retiro: data.balanceRetiro,
        balance_vivienda: data.balanceVivienda,
        notes: data.notes ?? null,
      }, { onConflict: 'afore_id,snapshot_date' })
      .select()
      .single();
    if (error) throw error;
    return mapAforeSnapshot(row);
  }

  async deleteSnapshot(id: string): Promise<void> {
    await this.supabase.from('afore_balance_snapshots').delete().eq('id', id);
  }
}

// ── Mappers ────────────────────────────────────────────────────────────────
function mapMortgageDetails(row: Row): MortgageDetails {
  return {
    id: row.id,
    investmentId: row.investment_id,
    bank: row.bank,
    originalAmount: Number(row.original_amount),
    interestRate: Number(row.interest_rate),
    termMonths: Number(row.term_months),
    startDate: new Date(row.start_date),
    monthlyPayment: Number(row.monthly_payment),
    propertyValue: row.property_value != null ? Number(row.property_value) : undefined,
    accountNumber: row.account_number ?? undefined,
  };
}

function mapMortgagePayment(row: Row): MortgagePayment {
  return {
    id: row.id,
    mortgageId: row.mortgage_id,
    paymentDate: new Date(row.payment_date),
    amount: Number(row.amount),
    principal: Number(row.principal),
    interest: Number(row.interest),
    balance: row.balance != null ? Number(row.balance) : undefined,
    paymentNumber: row.payment_number ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export class SupabaseMortgageRepository implements MortgageRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private supabase: SupabaseClient<any>) {}

  async findDetailsByInvestmentId(investmentId: string): Promise<MortgageDetails | null> {
    const { data } = await this.supabase
      .from('mortgage_details')
      .select('*')
      .eq('investment_id', investmentId)
      .single();
    return data ? mapMortgageDetails(data) : null;
  }

  async createDetails(data: Omit<MortgageDetails, 'id'>): Promise<MortgageDetails> {
    const { data: row, error } = await this.supabase
      .from('mortgage_details')
      .insert({
        investment_id: data.investmentId,
        bank: data.bank,
        original_amount: data.originalAmount,
        interest_rate: data.interestRate,
        term_months: data.termMonths,
        start_date: data.startDate.toISOString().split('T')[0],
        monthly_payment: data.monthlyPayment,
        property_value: data.propertyValue ?? null,
        account_number: data.accountNumber ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapMortgageDetails(row);
  }

  async updateDetails(id: string, data: Partial<Omit<MortgageDetails, 'id' | 'investmentId'>>): Promise<MortgageDetails> {
    const u: Row = {};
    if (data.bank !== undefined) u.bank = data.bank;
    if (data.originalAmount !== undefined) u.original_amount = data.originalAmount;
    if (data.interestRate !== undefined) u.interest_rate = data.interestRate;
    if (data.termMonths !== undefined) u.term_months = data.termMonths;
    if (data.startDate !== undefined) u.start_date = data.startDate.toISOString().split('T')[0];
    if (data.monthlyPayment !== undefined) u.monthly_payment = data.monthlyPayment;
    if (data.propertyValue !== undefined) u.property_value = data.propertyValue;
    if (data.accountNumber !== undefined) u.account_number = data.accountNumber;
    const { data: row, error } = await this.supabase
      .from('mortgage_details')
      .update(u)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapMortgageDetails(row);
  }

  async findPaymentsByMortgageId(mortgageId: string): Promise<MortgagePayment[]> {
    const { data } = await this.supabase
      .from('mortgage_payments')
      .select('*')
      .eq('mortgage_id', mortgageId)
      .order('payment_date', { ascending: true });
    return (data ?? []).map(mapMortgagePayment);
  }

  async createPayment(data: Omit<MortgagePayment, 'id'>): Promise<MortgagePayment> {
    const { data: row, error } = await this.supabase
      .from('mortgage_payments')
      .insert({
        mortgage_id: data.mortgageId,
        payment_date: data.paymentDate.toISOString().split('T')[0],
        amount: data.amount,
        principal: data.principal,
        interest: data.interest,
        balance: data.balance ?? null,
        payment_number: data.paymentNumber ?? null,
        notes: data.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapMortgagePayment(row);
  }

  async updatePayment(id: string, data: Partial<Omit<MortgagePayment, 'id' | 'mortgageId'>>): Promise<MortgagePayment> {
    const u: Row = {};
    if (data.paymentDate !== undefined) u.payment_date = data.paymentDate.toISOString().split('T')[0];
    if (data.amount !== undefined) u.amount = data.amount;
    if (data.principal !== undefined) u.principal = data.principal;
    if (data.interest !== undefined) u.interest = data.interest;
    if (data.balance !== undefined) u.balance = data.balance;
    if (data.paymentNumber !== undefined) u.payment_number = data.paymentNumber;
    if (data.notes !== undefined) u.notes = data.notes;
    const { data: row, error } = await this.supabase
      .from('mortgage_payments')
      .update(u)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return mapMortgagePayment(row);
  }

  async deletePayment(id: string): Promise<void> {
    await this.supabase.from('mortgage_payments').delete().eq('id', id);
  }
}
