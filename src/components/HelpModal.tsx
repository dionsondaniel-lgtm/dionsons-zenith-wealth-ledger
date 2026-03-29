import React from 'react';
import { HelpCircle, X, Lightbulb } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-border animate-in zoom-in-95 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-primary/10 text-primary rounded-xl">
            <HelpCircle size={24} />
          </div>
          <h2 className="text-2xl font-bold">Zenith Wealth Guide</h2>
        </div>

        <div className="space-y-6">
          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">1</span>
              <span>Dashboard</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Your financial command center. View your total income, outstanding debt, and Debt-to-Income (DTI) ratio at a glance. Keep your DTI below 40% for a healthy financial profile.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">2</span>
              <span>Income Streams</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Track your cash flow by categorizing your earnings (Salary, Side Hustles, etc.). The pie chart provides a visual breakdown of your income diversity.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">3</span>
              <span>Smart Debt Ledger</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              The core engine. Add loans to automatically generate amortization schedules. Choose between Monthly or Bi-Monthly (15th/30th) payment terms. Click "Pay" on a schedule row to mark it as paid and track your progress.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">4</span>
              <span>AI Insights</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Consult your personal AI Financial Advisor. It analyzes your current data to provide a Financial Health Grade, Debt Snowball strategies, and actionable savings tips.
            </p>
          </section>

          <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl mt-6 flex items-start space-x-3">
            <Lightbulb className="text-primary flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-semibold text-primary text-sm">Pro-Tip: Data Privacy</h4>
              <p className="text-xs text-muted-foreground mt-1">
                All your financial data is stored locally on your device. Use the Settings page to export a backup file if you need to switch devices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
