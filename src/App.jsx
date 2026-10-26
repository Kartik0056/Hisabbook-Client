import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PhoneUploadPage } from './pages/PhoneUploadPage';

import { DashboardPage } from './pages/DashboardPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { AdvancesPage } from './pages/AdvancesPage';
import { ContactsPage } from './pages/ContactsPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { DocumentVaultPage } from './pages/DocumentVaultPage';
import { WorkLogsPage } from './pages/WorkLogsPage';
import { TasksPage } from './pages/TasksPage';
import { AccountsPage } from './pages/AccountsPage';
import { ReportsPage } from './pages/ReportsPage';

export function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/phone-upload" element={<PhoneUploadPage />} />

      {/* Protected Project Workspace Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="advances" element={<AdvancesPage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="materials" element={<MaterialsPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="documents" element={<DocumentVaultPage />} />
        <Route path="work-logs" element={<WorkLogsPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
