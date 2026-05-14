// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { SupabaseClient } from '@supabase/supabase-js';
import {
  Investment,
  BriqInvestment,
  FundTransaction,
  FundTitleValue,
  LandPayment,
  LandInvestmentDetails,
} from '../../domain/entities/investment.entity';
import {
  InvestmentRepository,
  BriqRepository,
  FundRepository,
  LandRepository,
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
