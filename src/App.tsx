import React from 'react';
import { StoreProvider } from './store/StoreContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Income } from './pages/Income';
import { DebtLedger } from './pages/DebtLedger';
import { AIInsights } from './pages/AIInsights';
import { Settings } from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'income': return <Income />;
      case 'debt': return <DebtLedger />;
      case 'ai': return <AIInsights />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  return (
    <StoreProvider>
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </Layout>
    </StoreProvider>
  );
}
