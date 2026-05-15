export type InvestmentType = 'briq' | 'fund' | 'land' | 'custom' | 'afore' | 'mortgage';
export type InvestmentStatus = 'active' | 'completed' | 'cancelled';

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: InvestmentType;
  description?: string;
  status: InvestmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Briq Investment
export interface BriqInvestment {
  id: string;
  investmentId: string;
  annualInterestRate: number; // percentage, e.g. 14.5
  investedAmount: number;
  investmentDate: Date;
  termMonths?: number;
}

export interface BriqInvestmentWithDetails extends Investment {
  briq: BriqInvestment;
  monthlyInterest: number;
  annualInterest: number;
}

// Investment Fund
export interface FundTransaction {
  id: string;
  fundId: string;
  transactionDate: Date;
  titlesQuantity: number;
  titleCost: number; // cost per title at purchase
  totalAmount: number;
  notes?: string;
}

export interface FundTitleValue {
  id: string;
  fundId: string;
  date: Date;
  titleValue: number;
}

export interface FundInvestmentWithDetails extends Investment {
  transactions: FundTransaction[];
  titleHistory: FundTitleValue[];
  totalTitles: number;
  totalInvested: number;
  currentTitleValue: number;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

// Land Purchase
export interface LandPayment {
  id: string;
  landId: string;
  paymentDate: Date;
  amount: number;
  paymentType: 'initial' | 'installment' | 'expense';
  description?: string;
}

export interface LandInvestmentDetails {
  id: string;
  investmentId: string;
  totalPrice: number;
  purchaseDate: Date;
  paymentFrequency: 'monthly' | 'biweekly' | 'custom';
}

export interface LandInvestmentWithDetails extends Investment {
  details: LandInvestmentDetails;
  payments: LandPayment[];
  totalPaid: number;
  totalExpenses: number;
  remaining: number;
  completionPercent: number;
}

// AFORE
export type AforeMovementType = 'patron' | 'trabajador' | 'voluntario' | 'gobierno' | 'retiro';

export interface AforeDetails {
  id: string;
  investmentId: string;
  aforeName: string;
  nsr: number; // rendimiento neto anual %
  accountNumber?: string;
}

export interface AforeMovement {
  id: string;
  aforeId: string;
  movementType: AforeMovementType;
  amount: number;
  movementDate: Date;
  balanceAfter?: number;
  description?: string;
}

export interface AforeBalanceSnapshot {
  id: string;
  aforeId: string;
  snapshotDate: Date;
  balanceRetiro: number;
  balanceVivienda: number;
  balanceTotal: number;
  notes?: string;
}

export interface AforeInvestmentWithDetails extends Investment {
  details: AforeDetails;
  movements: AforeMovement[];
  snapshots: AforeBalanceSnapshot[];
  totalContributed: number;
  currentBalanceRetiro: number;
  currentBalanceVivienda: number;
  currentBalance: number;
  projectedMonthlyReturn: number;
  projectedAnnualReturn: number;
}

// Mortgage
export interface MortgageDetails {
  id: string;
  investmentId: string;
  bank: string;
  originalAmount: number;
  interestRate: number;   // annual %
  termMonths: number;
  startDate: Date;
  monthlyPayment: number;
  propertyValue?: number;
  accountNumber?: string;
}

export interface MortgagePayment {
  id: string;
  mortgageId: string;
  paymentDate: Date;
  amount: number;
  principal: number;
  interest: number;
  balance?: number;       // saldo insoluto after this payment
  paymentNumber?: number;
  notes?: string;
}

export interface MortgageInvestmentWithDetails extends Investment {
  details: MortgageDetails;
  payments: MortgagePayment[];
  totalPaid: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  currentBalance: number;
  completionPercent: number;
}
