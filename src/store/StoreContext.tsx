import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, addDays, format } from 'date-fns';

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'indigo' | 'emerald' | 'rose';
export type CurrencyCode = 'PHP' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'SGD';
export type CalculationMethod = 'Amortized' | 'FlatRate' | 'AdvanceInterest';
export type ExpenseCategory = 'House Rent' | 'Electricity' | 'WiFi' | 'Groceries' | 'Water' | 'Other';

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  name: string;
  amount: number;
  notes?: string;
}

export interface PasswordEntry {
  id: string;
  name: string;
  username: string;
  password: string;
  dateAdded: string;
  dateModified: string;
  notes?: string;
}

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
  calculationMethod?: CalculationMethod;
  schedule: PaymentSchedule[];
}

interface AppState {
  settings: Settings;
  income: IncomeSource[];
  expenses: Expense[];
  loans: Loan[];
  passwords: PasswordEntry[];
  updateSettings: (settings: Partial<Settings>) => void;
  addIncome: (income: Omit<IncomeSource, 'id'>) => void;
  updateIncome: (id: string, income: Partial<IncomeSource>) => void;
  deleteIncome: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addPassword: (password: Omit<PasswordEntry, 'id' | 'dateAdded' | 'dateModified'>) => void;
  updatePassword: (id: string, password: Partial<PasswordEntry>) => void;
  deletePassword: (id: string) => void;
  addLoan: (loan: Omit<Loan, 'id' | 'schedule'>) => void;
  updateLoan: (id: string, loan: Partial<Omit<Loan, 'id' | 'schedule'>>) => void;
  updateLoanSchedule: (loanId: string, scheduleId: string, payment: Partial<PaymentSchedule>) => void;
  recordPayment: (loanId: string, scheduleId: string, payment: Partial<PaymentSchedule>) => void;
  deleteLoan: (id: string) => void;
  importData: (data: string) => void;
  exportData: () => string;
  resetData: () => void;
  logs: ActivityLog[];
  logActivity: (action: string, details?: string) => void;
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
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('zenith_expenses', []);
  const [loans, setLoans] = useLocalStorage<Loan[]>('zenith_loans', []);
  const [passwords, setPasswords] = useLocalStorage<PasswordEntry[]>('zenith_passwords', []);
  const [logs, setLogs] = useLocalStorage<ActivityLog[]>('zenith_logs', []);

  const logActivity = (action: string, details?: string) => {
    setLogs(prev => [
      { id: uuidv4(), timestamp: new Date().toISOString(), action, details },
      ...prev
    ].slice(0, 50));
  };

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
    logActivity('Added Income', `Recorded ${newIncome.name}`);
  };

  const updateIncome = (id: string, updatedIncome: Partial<IncomeSource>) => {
    setIncome((prev) => prev.map((inc) => (inc.id === id ? { ...inc, ...updatedIncome } : inc)));
    logActivity('Updated Income', `Modified income record`);
  };

  const deleteIncome = (id: string) => {
    setIncome((prev) => prev.filter((inc) => inc.id !== id));
    logActivity('Deleted Income', `Removed an income record`);
  };

  const addExpense = (newExpense: Omit<Expense, 'id'>) => {
    setExpenses((prev) => [...prev, { ...newExpense, id: uuidv4() }]);
    logActivity('Added Expense', `Recorded ${newExpense.name} (${newExpense.category})`);
  };

  const updateExpense = (id: string, updatedExpense: Partial<Expense>) => {
    setExpenses((prev) => prev.map((exp) => (exp.id === id ? { ...exp, ...updatedExpense } : exp)));
    logActivity('Updated Expense', `Modified expense record`);
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
    logActivity('Deleted Expense', `Removed an expense record`);
  };

  const addPassword = (newPassword: Omit<PasswordEntry, 'id' | 'dateAdded' | 'dateModified'>) => {
    const now = new Date().toISOString();
    setPasswords((prev) => [...prev, { ...newPassword, id: uuidv4(), dateAdded: now, dateModified: now }]);
    logActivity('Added Password', `Saved credentials for ${newPassword.name}`);
  };

  const updatePassword = (id: string, updatedPassword: Partial<PasswordEntry>) => {
    setPasswords((prev) => prev.map((pwd) => (pwd.id === id ? { ...pwd, ...updatedPassword, dateModified: new Date().toISOString() } : pwd)));
    logActivity('Updated Password', `Modified credentials for a saved account`);
  };

  const deletePassword = (id: string) => {
    setPasswords((prev) => prev.filter((pwd) => pwd.id !== id));
    logActivity('Deleted Password', `Removed saved credentials`);
  };

  const generateSchedule = (
    principal: number,
    annualRate: number,
    dateApplied: string,
    terms: 'Monthly' | 'Bi-Monthly',
    durationMonths: number,
    customDueDate?: string,
    calculationMethod: CalculationMethod = 'AdvanceInterest'
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
    const totalFlatInterest = principal * ratePerPeriod * totalPeriods;
    
    let balance = principal;
    
    // Parse dateApplied as local time to avoid timezone shifts
    const [yearStr, monthStr, dayStr] = dateApplied.split('-');
    let currentDate = new Date(parseInt(yearStr), parseInt(monthStr) - 1, parseInt(dayStr));

    for (let i = 1; i <= totalPeriods; i++) {
      if (terms === 'Monthly') {
        currentDate = addMonths(currentDate, 1);
      } else {
        // Bi-monthly: 15th and 30th (or end of Feb)
        const day = currentDate.getDate();
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        
        const lastDayOfFeb = new Date(year, month + 1, 0).getDate();
        
        if (day < 15) {
          currentDate = new Date(year, month, 15);
        } else if (month === 1 && day < lastDayOfFeb) {
          currentDate = new Date(year, month, lastDayOfFeb); // End of Feb
        } else if (month !== 1 && day < 30) {
          currentDate = new Date(year, month, 30);
        } else {
          currentDate = new Date(year, month + 1, 15);
        }
      }

      let interestPayment = 0;
      let principalPayment = 0;
      let paymentAmount = 0;

      if (ratePerPeriod === 0) {
        paymentAmount = principal / totalPeriods;
        principalPayment = paymentAmount;
        interestPayment = 0;
      } else if (calculationMethod === 'Amortized') {
        paymentAmount = (principal * ratePerPeriod) / (1 - Math.pow(1 + ratePerPeriod, -totalPeriods));
        interestPayment = balance * ratePerPeriod;
        principalPayment = paymentAmount - interestPayment;
      } else if (calculationMethod === 'FlatRate') {
        interestPayment = totalFlatInterest / totalPeriods;
        principalPayment = principal / totalPeriods;
        paymentAmount = principalPayment + interestPayment;
      } else if (calculationMethod === 'AdvanceInterest') {
        interestPayment = 0; // Paid upfront
        principalPayment = principal / totalPeriods;
        paymentAmount = principalPayment;
      }

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
      newLoan.customDueDate,
      newLoan.calculationMethod
    );
    setLoans((prev) => [...prev, { ...newLoan, id: uuidv4(), schedule }]);
    logActivity('Added Loan', `Recorded loan from ${newLoan.lenderName}`);
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
        updatedLoan.customDueDate !== undefined ||
        updatedLoan.calculationMethod !== undefined;

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
          merged.customDueDate,
          merged.calculationMethod
        );
        
        return { ...merged, schedule: newSchedule };
      }
      
      return merged;
    }));
    logActivity('Updated Loan', `Modified loan details`);
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
    logActivity('Updated Schedule', `Modified a payment schedule entry`);
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
    logActivity('Recorded Payment', `Marked a payment as paid`);
  };

  const deleteLoan = (id: string) => {
    setLoans((prev) => prev.filter((loan) => loan.id !== id));
    logActivity('Deleted Loan', `Removed a loan record`);
  };

  const importData = (dataStr: string) => {
    try {
      const data = JSON.parse(dataStr);
      if (data.settings) setSettings(data.settings);
      if (data.income) setIncome(data.income);
      if (data.expenses) setExpenses(data.expenses);
      if (data.loans) setLoans(data.loans);
      if (data.passwords) setPasswords(data.passwords);
      logActivity('Imported Data', `Restored data from backup`);
    } catch (error) {
      console.error('Failed to import data', error);
      throw new Error('Invalid JSON data format');
    }
  };

  const exportData = () => {
    logActivity('Exported Data', `Created a data backup`);
    return JSON.stringify({ settings, income, expenses, loans, passwords }, null, 2);
  };

  const resetData = () => {
    setSettings(defaultSettings);
    setIncome([]);
    setExpenses([]);
    setLoans([]);
    setPasswords([]);
    setLogs([]);
    sessionStorage.removeItem('zenith_seen_summary');
    logActivity('Reset Data', `Cleared all application data`);
  };

  return (
    <StoreContext.Provider
      value={{
        settings,
        income,
        expenses,
        loans,
        passwords,
        updateSettings,
        addIncome,
        updateIncome,
        deleteIncome,
        addExpense,
        updateExpense,
        deleteExpense,
        addPassword,
        updatePassword,
        deletePassword,
        addLoan,
        updateLoan,
        updateLoanSchedule,
        recordPayment,
        deleteLoan,
        importData,
        exportData,
        resetData,
        logs,
        logActivity,
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
