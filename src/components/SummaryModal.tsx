import React from 'react';
import { X, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store/StoreContext';
import { formatCurrency } from '../lib/utils';
import { isBefore, isAfter, addDays, startOfDay, parseISO } from 'date-fns';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SummaryModal({ isOpen, onClose }: SummaryModalProps) {
  const { loans, settings } = useStore();
  
  if (!isOpen) return null;

  const today = startOfDay(new Date());
  const nextWeek = addDays(today, 7);

  const allUnpaid = loans.flatMap(l => l.schedule.map(s => ({ ...s, lenderName: l.lenderName })))
    .filter(s => !s.isPaid);

  const overdue = allUnpaid.filter(s => isBefore(parseISO(s.dueDate), today));
  const upcoming = allUnpaid.filter(s => 
    (isAfter(parseISO(s.dueDate), today) || parseISO(s.dueDate).getTime() === today.getTime()) && 
    isBefore(parseISO(s.dueDate), nextWeek)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-border animate-in zoom-in-95 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold mb-6">Financial Summary</h2>

        <div className="space-y-6">
          {/* Overdue Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-rose-500">
              <AlertCircle size={20} />
              <span>Overdue Payments ({overdue.length})</span>
            </h3>
            {overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border">
                Great job! You have no overdue payments.
              </p>
            ) : (
              <div className="space-y-2">
                {overdue.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <div>
                      <p className="font-medium text-rose-600 dark:text-rose-400">{payment.lenderName}</p>
                      <p className="text-xs text-rose-500/80">Due: {payment.dueDate}</p>
                    </div>
                    <p className="font-bold text-rose-600 dark:text-rose-400">{formatCurrency(payment.amountDue, settings.currency)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Upcoming Section */}
          <section>
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2 text-amber-500">
              <Clock size={20} />
              <span>Upcoming This Week ({upcoming.length})</span>
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border">
                No payments due in the next 7 days.
              </p>
            ) : (
              <div className="space-y-2">
                {upcoming.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div>
                      <p className="font-medium text-amber-600 dark:text-amber-400">{payment.lenderName}</p>
                      <p className="text-xs text-amber-500/80">Due: {payment.dueDate}</p>
                    </div>
                    <p className="font-bold text-amber-600 dark:text-amber-400">{formatCurrency(payment.amountDue, settings.currency)}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {overdue.length === 0 && upcoming.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-emerald-500">
              <CheckCircle2 size={48} className="mb-3 opacity-80" />
              <p className="font-medium text-center">You're all caught up!</p>
              <p className="text-sm text-emerald-500/70 text-center mt-1">No immediate actions required.</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <button 
            onClick={onClose}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
}
