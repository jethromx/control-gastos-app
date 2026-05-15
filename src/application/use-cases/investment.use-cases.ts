import {
  InvestmentRepository,
  BriqRepository,
  FundRepository,
  LandRepository,
  AforeRepository,
  MortgageRepository,
} from '../../domain/repositories/investment.repository';
import {
  Investment,
  BriqInvestment,
  BriqInvestmentWithDetails,
  FundInvestmentWithDetails,
  LandInvestmentWithDetails,
  AforeInvestmentWithDetails,
  MortgageInvestmentWithDetails,
  MortgageDetails,
  MortgagePayment,
  FundTransaction,
  FundTitleValue,
  LandPayment,
  LandInvestmentDetails,
  AforeDetails,
  AforeMovement,
  AforeBalanceSnapshot,
} from '../../domain/entities/investment.entity';
import { InvestmentCalculatorService } from '../../domain/services/investment-calculator.service';

export class InvestmentUseCases {
  constructor(
    private investmentRepo: InvestmentRepository,
    private briqRepo: BriqRepository,
    private fundRepo: FundRepository,
    private landRepo: LandRepository,
    private aforeRepo: AforeRepository,
    private mortgageRepo: MortgageRepository
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

  // ── AFORE ─────────────────────────────────────────────────────
  async getAforeWithDetails(investmentId: string): Promise<AforeInvestmentWithDetails | null> {
    const investment = await this.investmentRepo.findById(investmentId);
    if (!investment) return null;
    const details = await this.aforeRepo.findDetailsByInvestmentId(investmentId);
    if (!details) return null;
    const [movements, snapshots] = await Promise.all([
      this.aforeRepo.findMovementsByAforeId(details.id),
      this.aforeRepo.findSnapshotsByAforeId(details.id),
    ]);
    const calc = InvestmentCalculatorService.calcAforeTotals(movements, snapshots, details.nsr);
    return { ...investment, details, movements, snapshots, ...calc };
  }

  async createAforeInvestment(
    investmentData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>,
    detailsData: Omit<AforeDetails, 'id' | 'investmentId'>,
    initialSnapshot?: Omit<AforeBalanceSnapshot, 'id' | 'aforeId' | 'balanceTotal'>
  ): Promise<AforeInvestmentWithDetails> {
    const investment = await this.investmentRepo.create({ ...investmentData, type: 'afore' });
    const details = await this.aforeRepo.createDetails({ ...detailsData, investmentId: investment.id });
    const snapshots: AforeBalanceSnapshot[] = [];
    if (initialSnapshot) {
      const s = await this.aforeRepo.upsertSnapshot({ ...initialSnapshot, aforeId: details.id });
      snapshots.push(s);
    }
    const calc = InvestmentCalculatorService.calcAforeTotals([], snapshots, details.nsr);
    return { ...investment, details, movements: [], snapshots, ...calc };
  }

  async updateAforeDetails(id: string, data: Partial<AforeDetails>): Promise<AforeDetails> {
    return this.aforeRepo.updateDetails(id, data);
  }

  async addAforeMovement(aforeId: string, data: Omit<AforeMovement, 'id' | 'aforeId'>): Promise<AforeMovement> {
    return this.aforeRepo.createMovement({ ...data, aforeId });
  }

  async updateAforeMovement(id: string, data: Partial<AforeMovement>): Promise<AforeMovement> {
    return this.aforeRepo.updateMovement(id, data);
  }

  async deleteAforeMovement(id: string): Promise<void> {
    return this.aforeRepo.deleteMovement(id);
  }

  async upsertAforeSnapshot(aforeId: string, data: Omit<AforeBalanceSnapshot, 'id' | 'aforeId' | 'balanceTotal'>): Promise<AforeBalanceSnapshot> {
    return this.aforeRepo.upsertSnapshot({ ...data, aforeId });
  }

  async deleteAforeSnapshot(id: string): Promise<void> {
    return this.aforeRepo.deleteSnapshot(id);
  }

  async getAllAforesForUser(userId: string): Promise<AforeInvestmentWithDetails[]> {
    const investments = await this.investmentRepo.findByUserId(userId);
    const afores = investments.filter((i) => i.type === 'afore');
    const results = await Promise.all(afores.map((i) => this.getAforeWithDetails(i.id)));
    return results.filter(Boolean) as AforeInvestmentWithDetails[];
  }

  // ── Mortgage ──────────────────────────────────────────────────
  async getMortgageWithDetails(investmentId: string): Promise<MortgageInvestmentWithDetails | null> {
    const investment = await this.investmentRepo.findById(investmentId);
    if (!investment) return null;
    const details = await this.mortgageRepo.findDetailsByInvestmentId(investmentId);
    if (!details) return null;
    const payments = await this.mortgageRepo.findPaymentsByMortgageId(details.id);
    const totals = InvestmentCalculatorService.calcMortgageTotals(details, payments);
    return { ...investment, details, payments, ...totals };
  }

  async createMortgage(
    investmentData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>,
    detailsData: Omit<MortgageDetails, 'id' | 'investmentId'>
  ): Promise<MortgageInvestmentWithDetails> {
    const investment = await this.investmentRepo.create({ ...investmentData, type: 'mortgage' });
    const details = await this.mortgageRepo.createDetails({ ...detailsData, investmentId: investment.id });
    return { ...investment, details, payments: [], totalPaid: 0, totalPrincipalPaid: 0, totalInterestPaid: 0, currentBalance: details.originalAmount, completionPercent: 0 };
  }

  async updateMortgageDetails(id: string, data: Partial<Omit<MortgageDetails, 'id' | 'investmentId'>>): Promise<MortgageDetails> {
    return this.mortgageRepo.updateDetails(id, data);
  }

  async addMortgagePayment(mortgageId: string, data: Omit<MortgagePayment, 'id' | 'mortgageId'>): Promise<MortgagePayment> {
    return this.mortgageRepo.createPayment({ ...data, mortgageId });
  }

  async updateMortgagePayment(id: string, data: Partial<Omit<MortgagePayment, 'id' | 'mortgageId'>>): Promise<MortgagePayment> {
    return this.mortgageRepo.updatePayment(id, data);
  }

  async deleteMortgagePayment(id: string): Promise<void> {
    return this.mortgageRepo.deletePayment(id);
  }

  async getAllMortgagesForUser(userId: string): Promise<MortgageInvestmentWithDetails[]> {
    const investments = await this.investmentRepo.findByUserId(userId);
    const mortgages = investments.filter((i) => i.type === 'mortgage');
    const results = await Promise.all(mortgages.map((i) => this.getMortgageWithDetails(i.id)));
    return results.filter(Boolean) as MortgageInvestmentWithDetails[];
  }

  // ── Dashboard summary ─────────────────────────────────────────
  async getDashboardSummary(userId: string) {
    const [briqs, funds, lands, afores, mortgages] = await Promise.all([
      this.getAllBriqsForUser(userId),
      this.getAllFundsForUser(userId),
      this.getAllLandsForUser(userId),
      this.getAllAforesForUser(userId),
      this.getAllMortgagesForUser(userId),
    ]);

    const briqSummary = InvestmentCalculatorService.calcPortfolioSummary(
      briqs.map((b) => ({ amount: b.briq.investedAmount, monthlyInterest: b.monthlyInterest, annualInterest: b.annualInterest }))
    );

    const totalFundValue = funds.reduce((s, f) => s + f.currentValue, 0);
    const totalFundInvested = funds.reduce((s, f) => s + f.totalInvested, 0);
    const totalFundGain = totalFundValue - totalFundInvested;
    const totalLandPaid = lands.reduce((s, l) => s + l.totalPaid, 0);
    const totalAforeBalance = afores.reduce((s, a) => s + (a.currentBalance ?? 0), 0);
    const totalAforeRetiro = afores.reduce((s, a) => s + (a.currentBalanceRetiro ?? 0), 0);
    const totalAforeVivienda = afores.reduce((s, a) => s + (a.currentBalanceVivienda ?? 0), 0);

    const totalMortgagePaid = mortgages.reduce((s, m) => s + m.totalPaid, 0);
    const totalMortgageBalance = mortgages.reduce((s, m) => s + m.currentBalance, 0);

    return {
      briqs,
      funds,
      lands,
      afores,
      mortgages,
      briqSummary,
      totalFundValue,
      totalFundInvested,
      totalFundGain,
      totalLandPaid,
      totalAforeBalance,
      totalAforeRetiro,
      totalAforeVivienda,
      totalMortgagePaid,
      totalMortgageBalance,
      grandTotalInvested: briqSummary.totalCapital + totalFundInvested + totalLandPaid + totalAforeBalance,
    };
  }
}
