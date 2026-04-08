import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useFinanceStore } from './store/financeStore';

import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Auth/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { TransactionList } from './pages/Transactions/TransactionList';
import { MembersManagement } from './pages/Members/MembersManagement';
import { CategoriesManagement } from './pages/Categories/CategoriesManagement';
import { ImportInvoice } from './pages/Import/ImportInvoice';
import { Settings } from './pages/Settings/Settings';
import { InvestmentsManagement } from './pages/Investments/InvestmentsManagement';
import { CardsManagement } from './pages/Cards/CardsManagement';

function App() {
  const { user } = useFinanceStore();

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <Route path="*" element={<Login />} />
        ) : (
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<TransactionList />} />
            <Route path="/investments" element={<InvestmentsManagement />} />
            <Route path="/cards" element={<CardsManagement />} />
            <Route path="/members" element={<MembersManagement />} />
            <Route path="/categories" element={<CategoriesManagement />} />
            <Route path="/import" element={<ImportInvoice />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
