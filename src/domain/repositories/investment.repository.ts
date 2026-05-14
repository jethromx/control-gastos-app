import {
  Investment,
  BriqInvestment,
  FundTransaction,
  FundTitleValue,
  LandPayment,
  LandInvestmentDetails,
} from '../entities/investment.entity';

export interface InvestmentRepository {
  findById(id: string): Promise<Investment | null>;
  findByUserId(userId: string): Promise<Investment[]>;
  create(data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Investment>;
  update(id: string, data: Partial<Investment>): Promise<Investment>;
  delete(id: string): Promise<void>;
}

export interface BriqRepository {
  findByInvestmentId(investmentId: string): Promise<BriqInvestment | null>;
  create(data: Omit<BriqInvestment, 'id'>): Promise<BriqInvestment>;
  update(id: string, data: Partial<BriqInvestment>): Promise<BriqInvestment>;
  delete(id: string): Promise<void>;
}

export interface FundRepository {
  findTransactionsByFundId(fundId: string): Promise<FundTransaction[]>;
  createTransaction(data: Omit<FundTransaction, 'id'>): Promise<FundTransaction>;
  updateTransaction(id: string, data: Partial<FundTransaction>): Promise<FundTransaction>;
  deleteTransaction(id: string): Promise<void>;

  findTitleHistoryByFundId(fundId: string): Promise<FundTitleValue[]>;
  addTitleValue(data: Omit<FundTitleValue, 'id'>): Promise<FundTitleValue>;
  updateTitleValue(id: string, data: Partial<FundTitleValue>): Promise<FundTitleValue>;
  deleteTitleValue(id: string): Promise<void>;
}

export interface LandRepository {
  findDetailsByInvestmentId(investmentId: string): Promise<LandInvestmentDetails | null>;
  createDetails(data: Omit<LandInvestmentDetails, 'id'>): Promise<LandInvestmentDetails>;
  updateDetails(id: string, data: Partial<LandInvestmentDetails>): Promise<LandInvestmentDetails>;

  findPaymentsByLandId(landId: string): Promise<LandPayment[]>;
  createPayment(data: Omit<LandPayment, 'id'>): Promise<LandPayment>;
  updatePayment(id: string, data: Partial<LandPayment>): Promise<LandPayment>;
  deletePayment(id: string): Promise<void>;
}
