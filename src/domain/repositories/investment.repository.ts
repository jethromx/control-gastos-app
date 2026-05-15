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

export interface AforeRepository {
  findDetailsByInvestmentId(investmentId: string): Promise<AforeDetails | null>;
  createDetails(data: Omit<AforeDetails, 'id'>): Promise<AforeDetails>;
  updateDetails(id: string, data: Partial<AforeDetails>): Promise<AforeDetails>;

  findMovementsByAforeId(aforeId: string): Promise<AforeMovement[]>;
  createMovement(data: Omit<AforeMovement, 'id'>): Promise<AforeMovement>;
  updateMovement(id: string, data: Partial<AforeMovement>): Promise<AforeMovement>;
  deleteMovement(id: string): Promise<void>;

  findSnapshotsByAforeId(aforeId: string): Promise<AforeBalanceSnapshot[]>;
  upsertSnapshot(data: Omit<AforeBalanceSnapshot, 'id' | 'balanceTotal'>): Promise<AforeBalanceSnapshot>;
  deleteSnapshot(id: string): Promise<void>;
}

export interface MortgageRepository {
  findDetailsByInvestmentId(investmentId: string): Promise<MortgageDetails | null>;
  createDetails(data: Omit<MortgageDetails, 'id'>): Promise<MortgageDetails>;
  updateDetails(id: string, data: Partial<Omit<MortgageDetails, 'id' | 'investmentId'>>): Promise<MortgageDetails>;

  findPaymentsByMortgageId(mortgageId: string): Promise<MortgagePayment[]>;
  createPayment(data: Omit<MortgagePayment, 'id'>): Promise<MortgagePayment>;
  updatePayment(id: string, data: Partial<Omit<MortgagePayment, 'id' | 'mortgageId'>>): Promise<MortgagePayment>;
  deletePayment(id: string): Promise<void>;
}
