import {
  InvestmentRepository,
  BriqRepository,
  FundRepository,
  LandRepository,
} from '../../domain/repositories/investment.repository';
import {
  Investment,
  BriqInvestment,
  BriqInvestmentWithDetails,
  FundInvestmentWithDetails,
  LandInvestmentWithDetails,
  FundTransaction,
  FundTitleValue,
  LandPayment,
  LandInvestmentDetails,
} from '../../domain/entities/investment.entity';
import { InvestmentCalculatorService } from '../../domain/services/investment-calculator.service';

export class InvestmentUseCases {
  constructor(
    private investmentRepo: InvestmentRepository,
    private briqRepo: BriqRepository,
    private fundRepo: FundRepository,
    private landRepo: LandRepository
  ) {}

  // ── Investments ──────────────────────────────────────────────
  async getUserInvestments(userId: string): Promise<Investment[]> {
    return this.investmentRepo.findByUserId(userId);
  }

  async createInvestment(data: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Investment> {
    return this.investmentRepo.create(data);
  }

  async updateInvestment(id: string, data: Partial<Investment>): Promise<Investment> {
    return this.investmentRepo.update(id, data);
  }

  async deleteInvestment(id: string): Promise<void> {
    return this.investmentRepo.delete(id);
  }

  // ── Briq ─────────────────────────────────────────────────────
  async getBriqWithDetails(investmentId: string): Promise<BriqInvestmentWithDetails | null> {
    const [investment, briq] = await Promise.all([
      this.investmentRepo.findById(investmentId),
      this.briqRepo.findByInvestmentId(investmentId),
    ]);
    if (!investment || !briq) return null;
    return {
      ...investment,
      briq,
      monthlyInterest: InvestmentCalculatorService.calcBriqMonthlyInterest(briq),
      annualInterest: InvestmentCalculatorService.calcBriqAnnualInterest(briq),
    };
  }

  async createBriqInvestment(
    investmentData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>,
    briqData: Omit<BriqInvestment, 'id' | 'investmentId'>
  ): Promise<BriqInvestmentWithDetails> {
    const investment = await this.investmentRepo.create({ ...investmentData, type: 'briq' });
    const briq = await this.briqRepo.create({ ...briqData, investmentId: investment.id });
    return {
      ...investment,
      briq,
      monthlyInterest: InvestmentCalculatorService.calcBriqMonthlyInterest(briq),
      annualInterest: InvestmentCalculatorService.calcBriqAnnualInterest(briq),
    };
  }

  async updateBriqInvestment(
    investmentId: string,
    briqId: string,
    investmentData: Partial<Investment>,
    briqData: Partial<BriqInvestment>
  ): Promise<BriqInvestmentWithDetails> {
    const [investment, briq] = await Promise.all([
      this.investmentRepo.update(investmentId, investmentData),
      this.briqRepo.update(briqId, briqData),
    ]);
    return {
      ...investment,
      briq,
      monthlyInterest: InvestmentCalculatorService.calcBriqMonthlyInterest(briq),
      annualInterest: InvestmentCalculatorService.calcBriqAnnualInterest(briq),
    };
  }

  async getAllBriqsForUser(userId: string): Promise<BriqInvestmentWithDetails[]> {
    const investments = await this.investmentRepo.findByUserId(userId);
    const briqs = investments.filter((i) => i.type === 'briq');
    const results = await Promise.all(briqs.map((i) => this.getBriqWithDetails(i.id)));
    return results.filter(Boolean) as BriqInvestmentWithDetails[];
  }

  // ── Fund ─────────────────────────────────────────────────────
  async getFundWithDetails(investmentId: string): Promise<FundInvestmentWithDetails | null> {
    const investment = await this.investmentRepo.findById(investmentId);
    if (!investment) return null;
    const [transactions, titleHistory] = await Promise.all([
      this.fundRepo.findTransactionsByFundId(investmentId),
      this.fundRepo.findTitleHistoryByFundId(investmentId),
    ]);
    const calc = InvestmentCalculatorService.calcFundTotals(transactions, titleHistory);
    return { ...investment, transactions, titleHistory, ...calc };
  }

  async createFundInvestment(
    investmentData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>,
    firstTransaction: Omit<FundTransaction, 'id' | 'fundId'>
  ): Promise<FundInvestmentWithDetails> {
    const investment = await this.investmentRepo.create({ ...investmentData, type: 'fund' });
    const transaction = await this.fundRepo.createTransaction({ ...firstTransaction, fundId: investment.id });
    const calc = InvestmentCalculatorService.calcFundTotals([transaction], []);
    return { ...investment, transactions: [transaction], titleHistory: [], ...calc };
  }

  async addFundTransaction(fundId: string, data: Omit<FundTransaction, 'id' | 'fundId'>): Promise<FundTransaction> {
    return this.fundRepo.createTransaction({ ...data, fundId });
  }

  async addTitleValue(fundId: string, data: Omit<FundTitleValue, 'id' | 'fundId'>): Promise<FundTitleValue> {
    return this.fundRepo.addTitleValue({ ...data, fundId });
  }

  async getAllFundsForUser(userId: string): Promise<FundInvestmentWithDetails[]> {
    const investments = await this.investmentRepo.findByUserId(userId);
    const funds = investments.filter((i) => i.type === 'fund');
    const results = await Promise.all(funds.map((i) => this.getFundWithDetails(i.id)));
    return results.filter(Boolean) as FundInvestmentWithDetails[];
  }

  // ── Land ─────────────────────────────────────────────────────
  async getLandWithDetails(investmentId: string): Promise<LandInvestmentWithDetails | null> {
    const investment = await this.investmentRepo.findById(investmentId);
    if (!investment) return null;
    const details = await this.landRepo.findDetailsByInvestmentId(investmentId);
    if (!details) return null;
    const payments = await this.landRepo.findPaymentsByLandId(details.id);
    const calc = InvestmentCalculatorService.calcLandTotals(payments, details.totalPrice);
    return { ...investment, details, payments, ...calc };
  }

  async createLandInvestment(
    investmentData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>,
    detailsData: Omit<LandInvestmentDetails, 'id' | 'investmentId'>,
    initialPayment?: Omit<LandPayment, 'id' | 'landId'>
  ): Promise<LandInvestmentWithDetails> {
    const investment = await this.investmentRepo.create({ ...investmentData, type: 'land' });
    const details = await this.landRepo.createDetails({ ...detailsData, investmentId: investment.id });
    const payments: LandPayment[] = [];
    if (initialPayment) {
      const p = await this.landRepo.createPayment({ ...initialPayment, landId: details.id });
      payments.push(p);
    }
    const calc = InvestmentCalculatorService.calcLandTotals(payments, details.totalPrice);
    return { ...investment, details, payments, ...calc };
  }

  async addLandPayment(landId: string, data: Omit<LandPayment, 'id' | 'landId'>): Promise<LandPayment> {
    return this.landRepo.createPayment({ ...data, landId });
  }

  async updateLandDetails(id: string, data: Partial<LandInvestmentDetails>): Promise<LandInvestmentDetails> {
    return this.landRepo.updateDetails(id, data);
  }

  async updateLandPayment(id: string, data: Partial<LandPayment>): Promise<LandPayment> {
    return this.landRepo.updatePayment(id, data);
  }

  async deleteLandPayment(id: string): Promise<void> {
    return this.landRepo.deletePayment(id);
  }

  async updateFundTransaction(id: string, data: Partial<FundTransaction>): Promise<FundTransaction> {
    return this.fundRepo.updateTransaction(id, data);
  }

  async deleteFundTransaction(id: string): Promise<void> {
    return this.fundRepo.deleteTransaction(id);
  }

  async updateTitleValue(id: string, data: Partial<FundTitleValue>): Promise<FundTitleValue> {
    return this.fundRepo.updateTitleValue(id, data);
  }

  async deleteTitleValue(id: string): Promise<void> {
    return this.fundRepo.deleteTitleValue(id);
  }

  async completeBriqInvestment(investmentId: string): Promise<void> {
    await this.investmentRepo.update(investmentId, { status: 'completed' });
  }

  async getAllLandsForUser(userId: string): Promise<LandInvestmentWithDetails[]> {
    const investments = await this.investmentRepo.findByUserId(userId);
    const lands = investments.filter((i) => i.type === 'land');
    const results = await Promise.all(lands.map((i) => this.getLandWithDetails(i.id)));
    return results.filter(Boolean) as LandInvestmentWithDetails[];
  }

  // ── Dashboard summary ─────────────────────────────────────────
  async getDashboardSummary(userId: string) {
    const [briqs, funds, lands] = await Promise.all([
      this.getAllBriqsForUser(userId),
      this.getAllFundsForUser(userId),
      this.getAllLandsForUser(userId),
    ]);

    const briqSummary = InvestmentCalculatorService.calcPortfolioSummary(
      briqs.map((b) => ({ amount: b.briq.investedAmount, monthlyInterest: b.monthlyInterest, annualInterest: b.annualInterest }))
    );

    const totalFundValue = funds.reduce((s, f) => s + f.currentValue, 0);
    const totalFundInvested = funds.reduce((s, f) => s + f.totalInvested, 0);
    const totalLandPaid = lands.reduce((s, l) => s + l.totalPaid, 0);

    return {
      briqs,
      funds,
      lands,
      briqSummary,
      totalFundValue,
      totalFundInvested,
      totalLandPaid,
      grandTotalInvested: briqSummary.totalCapital + totalFundInvested + totalLandPaid,
    };
  }
}
