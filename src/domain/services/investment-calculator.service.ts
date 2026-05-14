import { BriqInvestment, FundTransaction, FundTitleValue, LandPayment } from '../entities/investment.entity';

export class InvestmentCalculatorService {
  static calcBriqMonthlyInterest(briq: BriqInvestment): number {
    return (briq.investedAmount * briq.annualInterestRate) / 100 / 12;
  }

  static calcBriqAnnualInterest(briq: BriqInvestment): number {
    return (briq.investedAmount * briq.annualInterestRate) / 100;
  }

  static calcFundTotals(transactions: FundTransaction[], titleHistory: FundTitleValue[]) {
    const totalTitles = transactions.reduce((sum, t) => sum + t.titlesQuantity, 0);
    const totalInvested = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const currentTitleValue = titleHistory.length > 0
      ? titleHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].titleValue
      : 0;
    const currentValue = totalTitles * currentTitleValue;
    const gainLoss = currentValue - totalInvested;
    const gainLossPercent = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;

    return { totalTitles, totalInvested, currentTitleValue, currentValue, gainLoss, gainLossPercent };
  }

  static calcLandTotals(payments: LandPayment[], totalPrice: number) {
    const totalInstallments = payments
      .filter((p) => p.paymentType === 'initial' || p.paymentType === 'installment')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = payments
      .filter((p) => p.paymentType === 'expense')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPaid = totalInstallments;
    const remaining = Math.max(0, totalPrice - totalInstallments);
    const completionPercent = totalPrice > 0 ? Math.min(100, (totalInstallments / totalPrice) * 100) : 0;

    return { totalPaid, totalExpenses, remaining, completionPercent };
  }

  static calcPortfolioSummary(briqs: Array<{ amount: number; monthlyInterest: number; annualInterest: number }>) {
    return {
      totalCapital: briqs.reduce((s, b) => s + b.amount, 0),
      totalMonthlyInterest: briqs.reduce((s, b) => s + b.monthlyInterest, 0),
      totalAnnualInterest: briqs.reduce((s, b) => s + b.annualInterest, 0),
    };
  }
}
