import { BriqInvestment, FundTransaction, FundTitleValue, LandPayment, AforeMovement, AforeBalanceSnapshot, MortgageDetails, MortgagePayment } from '../entities/investment.entity';

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

  static calcAforeTotals(movements: AforeMovement[], snapshots: AforeBalanceSnapshot[], nsr: number) {
    const inflows = movements.filter((m) => m.movementType !== 'retiro');
    const totalContributed = inflows.reduce((s, m) => s + m.amount, 0);

    // Use the latest balance snapshot; fall back to movement balance_after; then sum
    const sorted = [...snapshots].sort((a, b) => b.snapshotDate.getTime() - a.snapshotDate.getTime());
    const latest = sorted[0];

    let currentBalanceRetiro = 0;
    let currentBalanceVivienda = 0;

    if (latest) {
      currentBalanceRetiro = latest.balanceRetiro;
      currentBalanceVivienda = latest.balanceVivienda;
    } else {
      // Fall back to movement balance_after sum
      const movSorted = [...movements].sort((a, b) => b.movementDate.getTime() - a.movementDate.getTime());
      const lastWithBalance = movSorted.find((m) => m.balanceAfter != null && m.balanceAfter > 0);
      const withdrawals = movements.filter((m) => m.movementType === 'retiro').reduce((s, m) => s + m.amount, 0);
      currentBalanceRetiro = lastWithBalance?.balanceAfter ?? Math.max(0, totalContributed - withdrawals);
    }

    const currentBalance = currentBalanceRetiro + currentBalanceVivienda;
    const projectedAnnualReturn = (currentBalance * nsr) / 100;
    const projectedMonthlyReturn = projectedAnnualReturn / 12;

    return { totalContributed, currentBalance, currentBalanceRetiro, currentBalanceVivienda, projectedAnnualReturn, projectedMonthlyReturn };
  }

  static calcMortgageTotals(details: MortgageDetails, payments: MortgagePayment[]) {
    const sorted = [...payments].sort(
      (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
    );
    const totalPaid = sorted.reduce((s, p) => s + p.amount, 0);
    const totalPrincipalPaid = sorted.reduce((s, p) => s + p.principal, 0);
    const totalInterestPaid = sorted.reduce((s, p) => s + p.interest, 0);
    const lastWithBalance = [...sorted].reverse().find((p) => p.balance != null);
    const currentBalance = lastWithBalance?.balance != null
      ? lastWithBalance.balance
      : Math.max(0, details.originalAmount - totalPrincipalPaid);
    const completionPercent = details.originalAmount > 0
      ? Math.min(100, (totalPrincipalPaid / details.originalAmount) * 100)
      : 0;
    return { totalPaid, totalPrincipalPaid, totalInterestPaid, currentBalance, completionPercent };
  }

  // French amortization schedule (tabla de amortización estándar mexicana)
  static calcAmortizationSchedule(originalAmount: number, annualRate: number, termMonths: number, startDate: Date) {
    const r = annualRate / 100 / 12;
    const payment = r === 0
      ? originalAmount / termMonths
      : (originalAmount * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
    let balance = originalAmount;
    return Array.from({ length: termMonths }, (_, i) => {
      const interest = balance * r;
      const principal = Math.min(payment - interest, balance);
      balance = Math.max(0, balance - principal);
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i + 1);
      return { month: i + 1, date, interest, principal, balance, payment };
    });
  }

  static calcPortfolioSummary(briqs: Array<{ amount: number; monthlyInterest: number; annualInterest: number }>) {
    return {
      totalCapital: briqs.reduce((s, b) => s + b.amount, 0),
      totalMonthlyInterest: briqs.reduce((s, b) => s + b.monthlyInterest, 0),
      totalAnnualInterest: briqs.reduce((s, b) => s + b.annualInterest, 0),
    };
  }
}
