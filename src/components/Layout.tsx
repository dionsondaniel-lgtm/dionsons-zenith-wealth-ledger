import React, { useState } from 'react';
import { LayoutDashboard, Wallet, Receipt, Sparkles, Settings as SettingsIcon, HelpCircle, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store/StoreContext';
import { HelpModal } from './HelpModal';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { settings } = useStore();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'income', label: 'Income', icon: Wallet },
    { id: 'expenses', label: 'Expenses', icon: CreditCard },
    { id: 'debt', label: 'Debt Ledger', icon: Receipt },
    { id: 'ai', label: 'AI Insights', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row transition-colors duration-300 relative z-0">
      {/* Background Image Layer */}
      {settings.backgroundImage && (
        <div 
          className="fixed inset-0 z-[-1] transition-opacity duration-700 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${settings.backgroundImage})`,
            opacity: settings.mode === 'dark' ? 0.15 : 0.08
          }}
        />
      )}

      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-border h-screen sticky top-0 z-40">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Zenith Wealth
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Dionson's Ledger</p>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4">
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200"
          >
            <HelpCircle size={20} />
            <span className="font-medium">Help & Guide</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto relative">
        {/* Mobile Help Button */}
        <button 
          onClick={() => setIsHelpOpen(true)}
          className="md:hidden absolute top-4 right-4 z-30 p-2 bg-background/80 backdrop-blur-sm border border-border rounded-full text-muted-foreground shadow-sm"
        >
          <HelpCircle size={20} />
        </button>

        <div className="max-w-7xl mx-auto p-4 md:p-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-border z-50 pb-safe">
        <div className="flex justify-around items-center p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center p-2 rounded-lg transition-all duration-200",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "p-1.5 rounded-full mb-1 transition-all duration-200",
                  isActive ? "bg-primary/10" : "bg-transparent"
                )}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
