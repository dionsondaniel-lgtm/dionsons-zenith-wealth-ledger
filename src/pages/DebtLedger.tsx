import React, { useState } from 'react';
import { useStore, Loan, PaymentSchedule } from '../store/StoreContext';
import { formatCurrency, cn } from '../lib/utils';
import { Plus, ChevronDown, ChevronUp, CheckCircle2, Circle, Trash2, AlertCircle, Lightbulb, Edit2, AlertTriangle } from 'lucide-react';

export function DebtLedger() {
  const { loans, addLoan, updateLoan, updateLoanSchedule, recordPayment, deleteLoan, settings } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [expandedLoan, setExpandedLoan] = useState<string | null>(null);
  const [paymentModal, setPaymentModal] = useState<{ loanId: string, scheduleId: string } | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<Loan | null>(null);

  const [newLoan, setNewLoan] = useState<Omit<Loan, 'id' | 'schedule'>>({
    lenderName: '',
    principal: 0,
    interestRate: 0,
    interestRateType: 'Monthly',
    dateApplied: new Date().toISOString().split('T')[0],
    category: 'Professional',
    paymentTerms: 'Monthly',
    durationMonths: 12,
    customDueDate: '',
    calculationMethod: 'AdvanceInterest',
  });

  const [paymentData, setPaymentData] = useState({
    datePaid: new Date().toISOString().split('T')[0],
    amountPaid: 0,
    penalty: 0,
    notes: '',
  });

  const handleAddLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLoan.lenderName && newLoan.principal > 0) {
      addLoan(newLoan);
      setIsAdding(false);
      setNewLoan({
        lenderName: '',
        principal: 0,
        interestRate: 0,
        interestRateType: 'Monthly',
        dateApplied: new Date().toISOString().split('T')[0],
        category: 'Professional',
        paymentTerms: 'Monthly',
        durationMonths: 12,
        customDueDate: '',
        calculationMethod: 'AdvanceInterest',
      });
    }
  };

  const handleEditLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (editModal && editModal.lenderName && editModal.principal > 0) {
      updateLoan(editModal.id, {
        lenderName: editModal.lenderName,
        principal: editModal.principal,
        interestRate: editModal.interestRate,
        interestRateType: editModal.interestRateType,
        dateApplied: editModal.dateApplied,
        category: editModal.category,
        paymentTerms: editModal.paymentTerms,
        durationMonths: editModal.durationMonths,
        customDueDate: editModal.customDueDate,
        calculationMethod: editModal.calculationMethod,
      });
      setEditModal(null);
    }
  };

  const confirmDelete = () => {
    if (deleteModal) {
      deleteLoan(deleteModal);
      setDeleteModal(null);
    }
  };

  const handleMarkPaid = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentModal) {
      recordPayment(paymentModal.loanId, paymentModal.scheduleId, {
        datePaid: paymentData.datePaid,
        amountPaid: paymentData.amountPaid,
        penalty: paymentData.penalty,
        notes: paymentData.notes,
      });
      setPaymentModal(null);
    }
  };

  const openPaymentModal = (loanId: string, schedule: PaymentSchedule) => {
    setPaymentData({
      datePaid: schedule.dueDate,
      amountPaid: schedule.amountDue,
      penalty: 0,
      notes: '',
    });
    setPaymentModal({ loanId, scheduleId: schedule.id });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Smart Debt Ledger</h2>
          <p className="text-muted-foreground">Manage loans and amortization schedules.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Loan</span>
        </button>
      </header>

      {/* Pro-Tip Card */}
      <div className="glass p-4 rounded-xl flex items-start space-x-3 mb-6 border-primary/20 bg-primary/5">
        <Lightbulb className="text-primary flex-shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-semibold text-primary text-sm">Pro-Tip</h4>
          <p className="text-xs text-muted-foreground mt-1">
            Bi-monthly payments (15th/30th) can reduce interest pressure if you are paid twice a month. Select "Bi-Monthly" when adding a new loan to auto-generate a split schedule.
          </p>
        </div>
      </div>

      {isAdding && (
        <div className="glass p-6 rounded-2xl mb-8 border-primary/20 animate-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4">Create New Loan</h3>
          <form onSubmit={handleAddLoan} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Lender Name</label>
              <input 
                type="text" required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newLoan.lenderName}
                onChange={e => setNewLoan({...newLoan, lenderName: e.target.value})}
                placeholder="e.g. Bank of Zenith"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Principal Amount ({settings.currency})</label>
              <input 
                type="number" required min="1" step="0.01"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newLoan.principal || ''}
                onChange={e => setNewLoan({...newLoan, principal: parseFloat(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground flex justify-between items-center">
                <span>Interest Rate (%)</span>
                <select 
                  className="bg-transparent border-none text-xs text-primary font-semibold cursor-pointer focus:ring-0 p-0"
                  value={newLoan.interestRateType || 'Monthly'}
                  onChange={e => setNewLoan({...newLoan, interestRateType: e.target.value as 'Monthly' | 'Annual'})}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Annual">Annual</option>
                </select>
              </label>
              <input 
                type="number" required min="0" step="0.01"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newLoan.interestRate === 0 ? 0 : newLoan.interestRate || ''}
                onChange={e => setNewLoan({...newLoan, interestRate: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Date Applied</label>
              <input 
                type="date" required
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newLoan.dateApplied}
                onChange={e => setNewLoan({...newLoan, dateApplied: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Category</label>
              <select 
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newLoan.category}
                onChange={e => setNewLoan({...newLoan, category: e.target.value as any})}
              >
                <option value="Professional">Professional (Bank/App)</option>
                <option value="Friend/No Interest">Friend/Family (No Interest)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Payment Terms</label>
              <select 
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newLoan.paymentTerms}
                onChange={e => setNewLoan({...newLoan, paymentTerms: e.target.value as any})}
              >
                <option value="Monthly">Monthly</option>
                <option value="Bi-Monthly">Bi-Monthly (15th/30th)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Duration (Months)</label>
              <input 
                type="number" required min="0" max="360"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newLoan.durationMonths === 0 ? 0 : newLoan.durationMonths || ''}
                onChange={e => setNewLoan({...newLoan, durationMonths: parseInt(e.target.value) || 0})}
              />
              <p className="text-xs text-muted-foreground">Set to 0 for a single payment.</p>
            </div>
            
            {newLoan.durationMonths === 0 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-medium text-muted-foreground">Custom Due Date</label>
                <input 
                  type="date" required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={newLoan.customDueDate || ''}
                  onChange={e => setNewLoan({...newLoan, customDueDate: e.target.value})}
                />
              </div>
            )}
            
            <div className="lg:col-span-3 space-y-2 mt-2">
              <label className="text-sm font-medium text-muted-foreground">Calculation Method</label>
              <select 
                className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                value={newLoan.calculationMethod || 'AdvanceInterest'}
                onChange={e => setNewLoan({...newLoan, calculationMethod: e.target.value as any})}
              >
                <option value="AdvanceInterest">Advance Interest (Default) - Deduct interest upfront</option>
                <option value="FlatRate">Flat Rate - Divide principal and total interest equally</option>
                <option value="Amortized">Amortized (Diminishing) - Interest on remaining balance</option>
              </select>
              <div className="text-xs text-muted-foreground mt-2 space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border">
                <p><strong className="text-foreground">Advance Interest:</strong> Interest is subtracted from the loan proceeds upfront. Scheduled payments divide the principal equally.</p>
                <p><strong className="text-foreground">Flat Rate:</strong> Total interest is computed upfront. Scheduled payments divide both principal and total interest equally.</p>
                <p><strong className="text-foreground">Amortized:</strong> Standard bank method. Interest decreases over time as the principal balance goes down.</p>
              </div>
            </div>

            <div className="lg:col-span-3 flex space-x-2 mt-4">
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90 transition-opacity">
                Generate Schedule
              </button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-muted text-muted-foreground px-6 py-2 rounded-lg hover:bg-muted/80 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {loans.length === 0 ? (
          <div className="glass p-12 rounded-2xl text-center text-muted-foreground flex flex-col items-center">
            <AlertCircle size={48} className="mb-4 opacity-20" />
            <p>No loans recorded yet.</p>
            <p className="text-sm mt-2">Click "New Loan" to generate an amortization schedule.</p>
          </div>
        ) : (
          loans.map(loan => {
            const isExpanded = expandedLoan === loan.id;
            const totalPaid = loan.schedule.filter(s => s.isPaid).reduce((sum, s) => sum + s.principal, 0);
            const progress = (totalPaid / loan.principal) * 100;

            return (
              <div key={loan.id} className="glass rounded-2xl overflow-hidden transition-all duration-300">
                {/* Loan Header */}
                <div 
                  className="p-6 cursor-pointer hover:bg-muted/30 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  onClick={() => setExpandedLoan(isExpanded ? null : loan.id)}
                >
                  <div className="flex-1 w-full">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-bold">{loan.lenderName}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase tracking-wider">
                            {loan.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {loan.paymentTerms} • {loan.interestRate}% {loan.interestRateType === 'Monthly' ? 'Monthly' : 'Annual'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(loan.principal, settings.currency)}</p>
                        <p className="text-xs text-muted-foreground">Principal</p>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Paid: {formatCurrency(totalPaid, settings.currency)}</span>
                        <span className="font-medium">{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-primary h-full rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setEditModal(loan); }}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeleteModal(loan.id); }}
                      className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                    <div className="p-2 bg-muted rounded-full ml-2">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Amortization Schedule */}
                {isExpanded && (
                  <div className="border-t border-border bg-background/50 p-6 animate-in slide-in-from-top-2">
                    <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">Payment Schedule</h4>
                    
                    {/* Mobile Card Layout */}
                    <div className="space-y-4 md:hidden">
                      {loan.schedule.map((sch, idx) => (
                        <div key={sch.id} className="bg-background p-4 rounded-xl border border-border shadow-sm space-y-3">
                          <div className="flex justify-between items-center border-b border-border/50 pb-2">
                            <div className="font-medium flex items-center space-x-2">
                              <span className="text-muted-foreground text-xs bg-muted px-2 py-0.5 rounded-full">#{idx + 1}</span>
                              <span>{sch.dueDate}</span>
                            </div>
                            <div className="font-bold text-primary">{formatCurrency(sch.amountDue, settings.currency)}</div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground text-xs block mb-0.5">Principal</span>
                              <span className="font-medium">{formatCurrency(sch.principal, settings.currency)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block mb-0.5">Interest</span>
                              <span className="font-medium">{formatCurrency(sch.interest, settings.currency)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block mb-0.5">Date Paid</span>
                              <span className="font-medium">{sch.isPaid && sch.datePaid ? sch.datePaid : '-'}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-xs block mb-0.5">Penalty</span>
                              <span className="font-medium">{sch.isPaid && sch.penalty ? formatCurrency(sch.penalty, settings.currency) : '-'}</span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center pt-3 border-t border-border/50 mt-2">
                            <div>
                              {sch.isPaid ? (
                                <span className="inline-flex items-center space-x-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full text-xs font-medium">
                                  <CheckCircle2 size={14} />
                                  <span>Paid</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full text-xs font-medium">
                                  <Circle size={14} />
                                  <span>Pending</span>
                                </span>
                              )}
                            </div>
                            <div>
                              {!sch.isPaid ? (
                                <button 
                                  onClick={() => openPaymentModal(loan.id, sch)}
                                  className="text-xs bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium shadow-sm"
                                >
                                  Pay
                                </button>
                              ) : (
                                <button 
                                  onClick={() => updateLoanSchedule(loan.id, sch.id, { isPaid: false })}
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted px-2 py-1"
                                >
                                  Undo
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table Layout */}
                    <div className="hidden md:block overflow-x-auto pb-2">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 rounded-lg">
                          <tr>
                            <th className="px-4 py-3 rounded-l-lg">Due Date</th>
                            <th className="px-4 py-3">Amount Due</th>
                            <th className="px-4 py-3">Principal</th>
                            <th className="px-4 py-3">Interest</th>
                            <th className="px-4 py-3">Date Paid</th>
                            <th className="px-4 py-3">Penalty</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loan.schedule.map((sch, idx) => (
                            <tr key={sch.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 font-medium">
                                <div className="flex items-center space-x-2">
                                  <span className="text-muted-foreground text-xs w-4">{idx + 1}.</span>
                                  <span>{sch.dueDate}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-bold">{formatCurrency(sch.amountDue, settings.currency)}</td>
                              <td className="px-4 py-3 text-muted-foreground">{formatCurrency(sch.principal, settings.currency)}</td>
                              <td className="px-4 py-3 text-muted-foreground">{formatCurrency(sch.interest, settings.currency)}</td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {sch.isPaid && sch.datePaid ? sch.datePaid : '-'}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {sch.isPaid && sch.penalty ? formatCurrency(sch.penalty, settings.currency) : '-'}
                              </td>
                              <td className="px-4 py-3">
                                {sch.isPaid ? (
                                  <span className="inline-flex items-center space-x-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full text-xs font-medium">
                                    <CheckCircle2 size={14} />
                                    <span>Paid</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full text-xs font-medium">
                                    <Circle size={14} />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {!sch.isPaid ? (
                                  <button 
                                    onClick={() => openPaymentModal(loan.id, sch)}
                                    className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                                  >
                                    Pay
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => updateLoanSchedule(loan.id, sch.id, { isPaid: false })}
                                    className="text-xs text-muted-foreground hover:text-foreground transition-colors underline decoration-dotted"
                                  >
                                    Undo
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">Mark as Paid</h3>
            <form onSubmit={handleMarkPaid} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date Paid</label>
                <input 
                  type="date" required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={paymentData.datePaid}
                  onChange={e => setPaymentData({...paymentData, datePaid: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Amount Paid ({settings.currency})</label>
                <input 
                  type="number" required min="0" step="0.01"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={paymentData.amountPaid || ''}
                  onChange={e => setPaymentData({...paymentData, amountPaid: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Penalty / Extra Fees ({settings.currency})</label>
                <input 
                  type="number" min="0" step="0.01"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={paymentData.penalty || ''}
                  onChange={e => setPaymentData({...paymentData, penalty: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Notes (Optional)</label>
                <textarea 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50 resize-none h-20"
                  value={paymentData.notes}
                  onChange={e => setPaymentData({...paymentData, notes: e.target.value})}
                  placeholder="e.g. Paid via GCash Ref#12345"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium">
                  Confirm Payment
                </button>
                <button type="button" onClick={() => setPaymentModal(null)} className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-md rounded-2xl p-6 shadow-2xl border border-rose-500/20 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-rose-500 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-xl font-bold">Delete Loan</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete this loan record? This action cannot be undone and will remove its entire amortization schedule.
            </p>
            <div className="flex space-x-3">
              <button onClick={confirmDelete} className="flex-1 bg-rose-500 text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium">
                Yes, Delete
              </button>
              <button onClick={() => setDeleteModal(null)} className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-border animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Loan</h3>
            <div className="glass p-4 rounded-xl flex items-start space-x-3 mb-6 border-amber-500/20 bg-amber-500/5">
              <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-amber-600 text-sm">Warning</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Changing the principal, interest rate, duration, or payment terms will completely regenerate the amortization schedule. Any previously recorded payments will be lost.
                </p>
              </div>
            </div>
            <form onSubmit={handleEditLoan} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Lender Name</label>
                <input 
                  type="text" required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.lenderName}
                  onChange={e => setEditModal({...editModal, lenderName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Principal Amount ({settings.currency})</label>
                <input 
                  type="number" required min="1" step="0.01"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.principal || ''}
                  onChange={e => setEditModal({...editModal, principal: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground flex justify-between items-center">
                  <span>Interest Rate (%)</span>
                  <select 
                    className="bg-transparent border-none text-xs text-primary font-semibold cursor-pointer focus:ring-0 p-0"
                    value={editModal.interestRateType || 'Monthly'}
                    onChange={e => setEditModal({...editModal, interestRateType: e.target.value as 'Monthly' | 'Annual'})}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Annual">Annual</option>
                  </select>
                </label>
                <input 
                  type="number" required min="0" step="0.01"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.interestRate === 0 ? 0 : editModal.interestRate || ''}
                  onChange={e => setEditModal({...editModal, interestRate: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Date Applied</label>
                <input 
                  type="date" required
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.dateApplied}
                  onChange={e => setEditModal({...editModal, dateApplied: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Category</label>
                <select 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.category}
                  onChange={e => setEditModal({...editModal, category: e.target.value as any})}
                >
                  <option value="Professional">Professional (Bank/App)</option>
                  <option value="Friend/No Interest">Friend/Family (No Interest)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Payment Terms</label>
                <select 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.paymentTerms}
                  onChange={e => setEditModal({...editModal, paymentTerms: e.target.value as any})}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Bi-Monthly">Bi-Monthly (15th/30th)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Duration (Months)</label>
                <input 
                  type="number" required min="0" max="360"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.durationMonths === 0 ? 0 : editModal.durationMonths || ''}
                  onChange={e => setEditModal({...editModal, durationMonths: parseInt(e.target.value) || 0})}
                />
                <p className="text-xs text-muted-foreground">Set to 0 for a single payment.</p>
              </div>

              {editModal.durationMonths === 0 && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-muted-foreground">Custom Due Date</label>
                  <input 
                    type="date" required
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                    value={editModal.customDueDate || ''}
                    onChange={e => setEditModal({...editModal, customDueDate: e.target.value})}
                  />
                </div>
              )}

              <div className="md:col-span-2 space-y-2 mt-2">
                <label className="text-sm font-medium text-muted-foreground">Calculation Method</label>
                <select 
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/50"
                  value={editModal.calculationMethod || 'AdvanceInterest'}
                  onChange={e => setEditModal({...editModal, calculationMethod: e.target.value as any})}
                >
                  <option value="AdvanceInterest">Advance Interest (Default) - Deduct interest upfront</option>
                  <option value="FlatRate">Flat Rate - Divide principal and total interest equally</option>
                  <option value="Amortized">Amortized (Diminishing) - Interest on remaining balance</option>
                </select>
                <div className="text-xs text-muted-foreground mt-2 space-y-1.5 bg-muted/30 p-3 rounded-lg border border-border">
                  <p><strong className="text-foreground">Advance Interest:</strong> Interest is subtracted from the loan proceeds upfront. Scheduled payments divide the principal equally.</p>
                  <p><strong className="text-foreground">Flat Rate:</strong> Total interest is computed upfront. Scheduled payments divide both principal and total interest equally.</p>
                  <p><strong className="text-foreground">Amortized:</strong> Standard bank method. Interest decreases over time as the principal balance goes down.</p>
                </div>
              </div>

              <div className="md:col-span-2 flex space-x-3 pt-4">
                <button type="submit" className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium">
                  Save Changes
                </button>
                <button type="button" onClick={() => setEditModal(null)} className="flex-1 bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
