import React, { useState, useEffect } from 'react';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { Wallet, TrendingDown, Activity, Lightbulb, Bell, Calendar, PieChart as PieChartIcon, Clock, Flame, History, CreditCard } from 'lucide-react';
import { SummaryModal } from '../components/SummaryModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, Legend, PieChart, Pie, Cell } from 'recharts';
import { addMonths, format, startOfDay, isBefore, isAfter, parseISO, addDays, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

function LiveDateTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const seconds = format(time, 'ss');

  return (
    <div className="flex flex-col md:items-end text-left md:text-right glass p-4 rounded-2xl border border-primary/10 shadow-sm">
      <div className="text-3xl font-bold tracking-tight text-foreground flex items-center">
        <span>{format(time, 'hh')}</span>
        <span className="animate-pulse opacity-50 mx-1">:</span>
        <span>{format(time, 'mm')}</span>
        <span className="animate-pulse opacity-50 mx-1">:</span>
        <div className="relative w-[1.2em] h-[1em] overflow-hidden inline-flex justify-center text-primary">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={seconds}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ duration: 0.3, ease: 'backOut' }}
              className="absolute"
            >
              {seconds}
            </motion.span>
          </AnimatePresence>
        </div>
        <span className="text-base ml-2 text-muted-foreground uppercase tracking-widest">{format(time, 'a')}</span>
      </div>
      <div className="text-sm font-medium text-muted-foreground mt-1 flex items-center space-x-1.5">
        <Clock size={14} />
        <span>{format(time, 'EEEE, MMMM do, yyyy')}</span>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { income, expenses, loans, settings, logs } = useStore();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Auto-open summary on load if there are overdue/upcoming payments
  useEffect(() => {
    const hasSeenSummary = sessionStorage.getItem('zenith_seen_summary');
    if (!hasSeenSummary) {
      const today = startOfDay(new Date());
      const nextWeek = addDays(today, 7);
      const allUnpaid = loans.flatMap(l => l.schedule).filter(s => !s.isPaid);
      
      const hasAlerts = allUnpaid.some(s => {
        const d = parseISO(s.dueDate);
        return isBefore(d, today) || (isAfter(d, today) && isBefore(d, nextWeek)) || d.getTime() === today.getTime();
      });

      if (hasAlerts) {
        setIsSummaryOpen(true);
      }
      sessionStorage.setItem('zenith_seen_summary', 'true');
    }
  }, [loans]);

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  
  const totalDebt = loans.reduce((sum, loan) => {
    return sum + loan.schedule.reduce((schSum, sch) => {
      return schSum + (sch.isPaid ? 0 : sch.principal + sch.interest);
    }, 0);
  }, 0);

  const totalPenalties = loans.reduce((sum, loan) => {
    return sum + loan.schedule.reduce((schSum, sch) => {
      return schSum + (sch.isPaid && sch.penalty ? sch.penalty : 0);
    }, 0);
  }, 0);

  const dtiRatio = totalIncome > 0 ? (totalDebt / totalIncome) * 100 : 0;

  // Prepare data for Line Chart (Debt Projection over next 6 months)
  const generateProjectionData = () => {
    const data = [];
    let currentBalance = totalDebt;
    const today = new Date();

    for (let i = 0; i < 6; i++) {
      const targetMonth = addMonths(today, i);
      const monthStr = format(targetMonth, 'MMM yyyy');
      
      // Calculate payments expected in this month
      const paymentsThisMonth = loans.flatMap(l => l.schedule)
        .filter(s => !s.isPaid && format(parseISO(s.dueDate), 'MMM yyyy') === monthStr)
        .reduce((sum, s) => sum + s.principal + s.interest, 0);

      data.push({
        month: monthStr,
        Balance: Math.max(0, currentBalance),
        Payment: paymentsThisMonth
      });

      currentBalance -= paymentsThisMonth;
    }
    return data;
  };

  // Prepare data for Bar Chart (Income vs Expected Payments for current month)
  const generateCashflowData = () => {
    const currentMonthStr = format(new Date(), 'yyyy-MM');
    
    // Sum income for current month
    const currentMonthIncome = income
      .filter(i => i.date.startsWith(currentMonthStr))
      .reduce((sum, i) => sum + i.amount, 0);

    // Sum expenses for current month
    const currentMonthExpenses = expenses
      .filter(e => e.date.startsWith(currentMonthStr))
      .reduce((sum, e) => sum + e.amount, 0);

    // Sum expected payments for current month
    const currentMonthPayments = loans.flatMap(l => l.schedule)
      .filter(s => !s.isPaid && s.dueDate.startsWith(currentMonthStr))
      .reduce((sum, s) => sum + s.amountDue, 0);

    const currentMonthPenalties = loans.flatMap(l => l.schedule)
      .filter(s => s.isPaid && s.datePaid?.startsWith(currentMonthStr) && s.penalty)
      .reduce((sum, s) => sum + (s.penalty || 0), 0);

    return [
      {
        name: 'Current Month',
        Income: currentMonthIncome || totalIncome, // Fallback to total if no dates set
        Expenses: currentMonthExpenses,
        DebtPayments: currentMonthPayments,
        Penalties: currentMonthPenalties
      }
    ];
  };

  const projectionData = generateProjectionData();
  const cashflowData = generateCashflowData();

  // Prepare data for Pie Chart (Income Distribution)
  const incomeDistributionData = income.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, [] as { name: string, value: number }[]);

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Dashboard</h2>
          <p className="text-muted-foreground">Welcome back to your Zenith Wealth Ledger.</p>
          <button 
            onClick={() => setIsSummaryOpen(true)}
            className="flex items-center space-x-2 bg-background border border-border text-foreground px-4 py-2 rounded-xl hover:bg-muted transition-colors shadow-sm w-fit mt-4"
          >
            <Bell size={18} className="text-amber-500" />
            <span className="font-medium">View Alerts</span>
          </button>
        </div>
        <LiveDateTime />
      </header>

      {/* Pro-Tip Card */}
      <div className="glass p-4 rounded-xl flex items-start space-x-3 mb-6 border-primary/20 bg-primary/5">
        <Lightbulb className="text-primary flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-semibold text-primary text-sm">Pro-Tip</h4>
          <p className="text-xs text-muted-foreground mt-1">
            A healthy Debt-to-Income (DTI) ratio is typically below 36%. If your DTI is in the "High Risk" zone, consider consulting the AI Advisor for a Debt Snowball strategy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Total Income Card */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={64} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Income Recorded</p>
            <h3 className="text-3xl font-bold text-foreground">{formatCurrency(totalIncome, settings.currency)}</h3>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-orange-500">
            <CreditCard size={64} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p>
            <h3 className="text-3xl font-bold text-foreground">{formatCurrency(totalExpenses, settings.currency)}</h3>
          </div>
        </div>

        {/* Total Debt Card */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-rose-500">
            <TrendingDown size={64} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Outstanding Debt</p>
            <h3 className="text-3xl font-bold text-foreground">{formatCurrency(totalDebt, settings.currency)}</h3>
          </div>
        </div>

        {/* DTI Ratio Card */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
            <Activity size={64} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">Debt-to-Income Ratio</p>
            <div className="flex items-end space-x-2">
              <h3 className="text-3xl font-bold text-foreground">{dtiRatio.toFixed(1)}%</h3>
              <span className="text-sm text-muted-foreground mb-1">
                {dtiRatio > 40 ? 'High Risk' : dtiRatio > 20 ? 'Moderate' : 'Healthy'}
              </span>
            </div>
            {/* Simple Gauge Bar */}
            <div className="w-full bg-muted rounded-full h-2 mt-4 overflow-hidden">
              <div 
                className={`h-full rounded-full ${dtiRatio > 40 ? 'bg-rose-500' : dtiRatio > 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(dtiRatio, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Penalties Card */}
        <div className="glass p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-amber-500">
            <Flame size={64} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Penalties Paid</p>
            <h3 className="text-3xl font-bold text-foreground">{formatCurrency(totalPenalties, settings.currency)}</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Debt Projection Line Chart */}
        <div className="glass p-6 rounded-2xl flex flex-col lg:col-span-2">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingDown className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Debt Payoff Projection (6 Months)</h3>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${settings.currency} ${(value/1000).toFixed(0)}k`} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value, settings.currency)}
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="Balance" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Payment" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income Distribution Pie Chart */}
        <div className="glass p-6 rounded-2xl flex flex-col">
          <div className="flex items-center space-x-2 mb-6">
            <PieChartIcon className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Income Sources</h3>
          </div>
          <div className="flex-1 min-h-[300px]">
            {incomeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {incomeDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => formatCurrency(value, settings.currency)}
                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No income data available
              </div>
            )}
          </div>
        </div>

        {/* Cashflow Bar Chart */}
        <div className="glass p-6 rounded-2xl flex flex-col lg:col-span-3">
          <div className="flex items-center space-x-2 mb-6">
            <Calendar className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Current Month Cashflow</h3>
          </div>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${settings.currency} ${(value/1000).toFixed(0)}k`} />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value, settings.currency)}
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.4 }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)' }}
                />
                <Legend />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="DebtPayments" name="Expected Payments" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="Penalties" name="Penalties Paid" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="glass p-6 rounded-2xl flex flex-col lg:col-span-3">
          <div className="flex items-center space-x-2 mb-6">
            <History className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Recent Activities</h3>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[300px] pr-2 space-y-4">
            {logs.length > 0 ? (
              logs.map(log => (
                <div key={log.id} className="flex items-start justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm text-foreground">{log.action}</p>
                    {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                    {formatDistanceToNow(parseISO(log.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No recent activities recorded
              </div>
            )}
          </div>
        </div>
      </div>

      <SummaryModal isOpen={isSummaryOpen} onClose={() => setIsSummaryOpen(false)} />
    </div>
  );
}
