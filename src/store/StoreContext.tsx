import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, addDays, format } from 'date-fns';

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'indigo' | 'emerald' | 'rose';
export type CurrencyCode = 'PHP' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'SGD';

export interface Settings {
  mode: ThemeMode;
  color: ThemeColor;
  currency: CurrencyCode;
  backgroundImage: string | null;
}

export interface IncomeSource {
  id: string;
  date: string;
  category: 'Salary' | 'Allowance' | 'Side Hustle' | 'Other';
  name: string;
  amount: number;
}

export interface PaymentSchedule {
  id: string;
  dueDate: string;
  amountDue: number;
  principal: number;
  interest: number;
  isPaid: boolean;
  datePaid?: string;
  amountPaid?: number;
  penalty?: number;
  notes?: string;
}

export interface Loan {
  id: string;
  lenderName: string;
  principal: number;
  interestRate: number; // Annual %
  interestRateType?: 'Annual' | 'Monthly';
  dateApplied: string;
  category: 'Professional' | 'Friend/No Interest';
  paymentTerms: 'Monthly' | 'Bi-Monthly';
  durationMonths: number;
  customDueDate?: string;
  schedule: PaymentSchedule[];
}

interface AppState {
  settings: Settings;
  income: IncomeSource[];
  loans: Loan[];
  updateSettings: (settings: Partial<Settings>) => void;
  addIncome: (income: Omit<IncomeSource, 'id'>) => void;
  updateIncome: (id: string, income: Partial<IncomeSource>) => void;
  deleteIncome: (id: string) => void;
  addLoan: (loan: Omit<Loan, 'id' | 'schedule'>) => void;
  updateLoan: (id: string, loan: Partial<Omit<Loan, 'id' | 'schedule'>>) => void;
  updateLoanSchedule: (loanId: string, scheduleId: string, payment: Partial<PaymentSchedule>) => void;
  recordPayment: (loanId: string, scheduleId: string, payment: Partial<PaymentSchedule>) => void;
  deleteLoan: (id: string) => void;
  importData: (data: string) => void;
  exportData: () => string;
  resetData: () => void;
}

const defaultSettings: Settings = {
  mode: 'light',
  color: 'indigo',
  currency: 'PHP',
  backgroundImage: null,
};

const StoreContext = createContext<AppState | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<Settings>('zenith_settings', defaultSettings);
  const [income, setIncome] = useLocalStorage<IncomeSource[]>('zenith_income', []);
  const [loans, setLoans] = useLocalStorage<Loan[]>('zenith_loans', []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(settings.mode);
    
    root.classList.remove('theme-indigo', 'theme-emerald', 'theme-rose');
    root.classList.add(`theme-${settings.color}`);

    if (settings.backgroundImage) {
      document.body.style.backgroundImage = `url(${settings.backgroundImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
    }
  }, [settings.mode, settings.color, settings.backgroundImage]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const addIncome = (newIncome: Omit<IncomeSource, 'id'>) => {
    setIncome((prev) => [...prev, { ...newIncome, id: uuidv4() }]);
  };

  const updateIncome = (id: string, updatedIncome: Partial<IncomeSource>) => {
    setIncome((prev) => prev.map((inc) => (inc.id === id ? { ...inc, ...updatedIncome } : inc)));
  };

  const deleteIncome = (id: string) => {
    setIncome((prev) => prev.filter((inc) => inc.id !== id));
  };

  const generateSchedule = (
    principal: number,
    annualRate: number,
    dateApplied: string,
    terms: 'Monthly' | 'Bi-Monthly',
    durationMonths: number,
    customDueDate?: string
  ): PaymentSchedule[] => {
    const schedule: PaymentSchedule[] = [];
    
    if (durationMonths === 0) {
      schedule.push({
        id: uuidv4(),
        dueDate: customDueDate || dateApplied,
        amountDue: principal,
        principal: principal,
        interest: 0,
        isPaid: false,
      });
      return schedule;
    }

    const periodsPerYear = terms === 'Monthly' ? 12 : 24;
    const totalPeriods = terms === 'Monthly' ? durationMonths : durationMonths * 2;
    const ratePerPeriod = annualRate / 100 / periodsPerYear;
    
    let paymentAmount = 0;
    if (ratePerPeriod === 0) {
      paymentAmount = principal / totalPeriods;
    } else {
      paymentAmount = (principal * ratePerPeriod) / (1 - Math.pow(1 + ratePerPeriod, -totalPeriods));
    }

    let balance = principal;
    let currentDate = new Date(dateApplied);

    for (let i = 1; i <= totalPeriods; i++) {
      if (terms === 'Monthly') {
        currentDate = addMonths(currentDate, 1);
      } else {
        // Bi-monthly: roughly every 15 days
        currentDate = addDays(currentDate, 15);
      }

      const interestPayment = balance * ratePerPeriod;
      const principalPayment = paymentAmount - interestPayment;
      balance -= principalPayment;

      schedule.push({
        id: uuidv4(),
        dueDate: format(currentDate, 'yyyy-MM-dd'),
        amountDue: paymentAmount,
        principal: principalPayment,
        interest: interestPayment,
        isPaid: false,
      });
    }

    return schedule;
  };

  const addLoan = (newLoan: Omit<Loan, 'id' | 'schedule'>) => {
    // Ensure the interest rate passed to generateSchedule is always Annual
    const annualRate = newLoan.interestRateType === 'Monthly' 
      ? newLoan.interestRate * 12 
      : newLoan.interestRate;

    const schedule = generateSchedule(
      newLoan.principal,
      annualRate,
      newLoan.dateApplied,
      newLoan.paymentTerms,
      newLoan.durationMonths,
      newLoan.customDueDate
    );
    setLoans((prev) => [...prev, { ...newLoan, id: uuidv4(), schedule }]);
  };

  const updateLoan = (id: string, updatedLoan: Partial<Omit<Loan, 'id' | 'schedule'>>) => {
    setLoans((prev) => prev.map((loan) => {
      if (loan.id !== id) return loan;
      
      const merged = { ...loan, ...updatedLoan };
      
      const termsChanged = 
        updatedLoan.principal !== undefined ||
        updatedLoan.interestRate !== undefined ||
        updatedLoan.interestRateType !== undefined ||
        updatedLoan.dateApplied !== undefined ||
        updatedLoan.paymentTerms !== undefined ||
        updatedLoan.durationMonths !== undefined ||
        updatedLoan.customDueDate !== undefined;

      if (termsChanged) {
        const annualRate = merged.interestRateType === 'Monthly' 
          ? merged.interestRate * 12 
          : merged.interestRate;
          
        const newSchedule = generateSchedule(
          merged.principal,
          annualRate,
          merged.dateApplied,
          merged.paymentTerms,
          merged.durationMonths,
          merged.customDueDate
        );
        
        return { ...merged, schedule: newSchedule };
      }
      
      return merged;
    }));
  };

  const updateLoanSchedule = (loanId: string, scheduleId: string, payment: Partial<PaymentSchedule>) => {
    setLoans((prev) =>
      prev.map((loan) => {
        if (loan.id !== loanId) return loan;
        return {
          ...loan,
          schedule: loan.schedule.map((sch) =>
            sch.id === scheduleId ? { ...sch, ...payment } : sch
          ),
        };
      })
    );
  };

  const recordPayment = (loanId: string, scheduleId: string, payment: Partial<PaymentSchedule>) => {
    setLoans((prev) => prev.map((loan) => {
      if (loan.id !== loanId) return loan;
      
      const scheduleEntryIndex = loan.schedule.findIndex(s => s.id === scheduleId);
      if (scheduleEntryIndex === -1) return loan;
      
      const scheduleEntry = loan.schedule[scheduleEntryIndex];
      const amountPaid = payment.amountPaid || 0;
      
      const updatedSchedule = [...loan.schedule];
      
      if (amountPaid > 0 && amountPaid < scheduleEntry.amountDue) {
        // Partial payment: Split the entry
        const ratio = amountPaid / scheduleEntry.amountDue;
        const principalPaid = scheduleEntry.principal * ratio;
        const interestPaid = scheduleEntry.interest * ratio;
        
        updatedSchedule[scheduleEntryIndex] = {
          ...scheduleEntry,
          ...payment,
          amountDue: amountPaid,
          principal: principalPaid,
          interest: interestPaid,
          isPaid: true,
        };
        
        updatedSchedule.splice(scheduleEntryIndex + 1, 0, {
          id: uuidv4(),
          dueDate: scheduleEntry.dueDate,
          amountDue: scheduleEntry.amountDue - amountPaid,
          principal: scheduleEntry.principal - principalPaid,
          interest: scheduleEntry.interest - interestPaid,
          isPaid: false,
        });
      } else {
        // Full payment
        updatedSchedule[scheduleEntryIndex] = {
          ...scheduleEntry,
          ...payment,
          isPaid: true,
        };
      }
      
      return { ...loan, schedule: updatedSchedule };
    }));
  };

  const deleteLoan = (id: string) => {
    setLoans((prev) => prev.filter((loan) => loan.id !== id));
  };

  const importData = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      if (data.settings) setSettings(data.settings);
      if (data.income) setIncome(data.income);
      if (data.loans) setLoans(data.loans);
    } catch (error) {
      console.error('Failed to import data', error);
      throw new Error('Invalid JSON data format');
    }
  };

  const exportData = () => {
    return JSON.stringify({ settings, income, loans }, null, 2);
  };

  const resetData = () => {
    setSettings(defaultSettings);
    setIncome([]);
    setLoans([]);
    sessionStorage.removeItem('zenith_seen_summary');
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        income,
        loans,
        updateSettings,
        addIncome,
        updateIncome,
        deleteIncome,
        addLoan,
        updateLoan,
        updateLoanSchedule,
        recordPayment,
        deleteLoan,
        importData,
        exportData,
        resetData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
