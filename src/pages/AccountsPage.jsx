import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatINR } from '../utils/formatters';
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  Wallet,
  Building,
  Smartphone,
  TrendingUp,
  AlertCircle,
  X,
  Loader2,
  Edit2,
  PieChart,
} from 'lucide-react';

export const AccountsPage = () => {
  const { activeProject } = useAuth();
  const { t } = useLanguage();

  const [accounts, setAccounts] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);

  // Forms
  const [accountForm, setAccountForm] = useState({
    name: '',
    accountType: 'bank',
    openingBalance: 0,
    bankName: '',
    accountNumber: '',
    ifsc: '',
    upiId: '',
  });

  const [transferForm, setTransferForm] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const [budgetForm, setBudgetForm] = useState({
    category: '',
    allocatedAmount: '',
    alertThresholdPercent: 90,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const [accRes, budRes] = await Promise.all([
        api.getAccounts(),
        api.getBudgets(),
      ]);

      if (accRes.success) setAccounts(accRes.data);
      if (budRes.success) setBudgets(budRes.data);
    } catch (err) {
      console.error('Error fetching accounts & budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?._id]);

  const totalLiquidity = accounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.name.trim()) {
      setError('Account name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.createAccount(accountForm);
      if (res.success) {
        setAccountModalOpen(false);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Error creating account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferForm.fromAccountId || !transferForm.toAccountId) {
      setError('Please select both source and destination accounts.');
      return;
    }
    if (transferForm.fromAccountId === transferForm.toAccountId) {
      setError('Source and destination accounts must be different.');
      return;
    }
    if (!transferForm.amount || Number(transferForm.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.transferBetweenAccounts(transferForm);
      if (res.success) {
        setTransferModalOpen(false);
        await loadData();
      }
    } catch (err) {
      setError(err.message || 'Transfer failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveBudget = async (e) => {
    e.preventDefault();
    if (!budgetForm.category.trim() || !budgetForm.allocatedAmount) {
      setError('Category and amount are required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      if (selectedBudget) {
        await api.updateBudget(selectedBudget._id, {
          revisedAmount: Number(budgetForm.allocatedAmount),
          alertThresholdPercent: Number(budgetForm.alertThresholdPercent) || 90,
          reason: 'Manual budget update from dashboard',
        });
      } else {
        await api.createBudget({
          category: budgetForm.category.trim(),
          allocatedAmount: Number(budgetForm.allocatedAmount),
          alertThresholdPercent: Number(budgetForm.alertThresholdPercent) || 90,
        });
      }

      setBudgetModalOpen(false);
      setSelectedBudget(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to save category budget.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Landmark className="h-6 w-6 text-emerald-600" />
            <span>Accounts & Budget Management (खाते व रोकड़)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Multi-account cash balances, inter-account transfers, and category budget ceilings
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTransferForm({
                fromAccountId: accounts[0]?._id || '',
                toAccountId: accounts[1]?._id || '',
                amount: '',
                description: '',
                date: new Date().toISOString().slice(0, 10),
              });
              setError('');
              setTransferModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ArrowRightLeft className="h-4 w-4 text-emerald-600" />
            <span>Transfer Balance</span>
          </button>
          <button
            onClick={() => {
              setAccountForm({
                name: '',
                accountType: 'bank',
                openingBalance: 0,
                bankName: '',
                accountNumber: '',
                ifsc: '',
                upiId: '',
              });
              setError('');
              setAccountModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Liquidity Total Card */}
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
            Total Liquid Balance (All Cash, Bank & UPI Accounts)
          </span>
          <div className="text-3xl font-black text-emerald-950 mt-1">
            {formatINR(totalLiquidity)}
          </div>
          <div className="text-xs text-emerald-700 mt-1">
            Across {accounts.length} active financial accounts
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-2xl bg-white/80 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-900 shadow-sm">
            Cash Outflows Verified Authoritatively
          </span>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc._id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                      {acc.accountType === 'cash' ? (
                        <Wallet className="h-4 w-4 text-emerald-600" />
                      ) : acc.accountType === 'upi' ? (
                        <Smartphone className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Building className="h-4 w-4 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{acc.name}</h3>
                      <span className="text-[10px] text-slate-400 capitalize">{acc.accountType}</span>
                    </div>
                  </div>
                  {acc.isDefault && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                      Default
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">
                    Current Balance
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {formatINR(acc.currentBalance)}
                  </div>
                </div>

                {acc.accountNumber && (
                  <div className="mt-2 text-xs font-mono text-slate-500">
                    A/C: ••••{acc.accountNumber.slice(-4)} {acc.ifsc ? `(${acc.ifsc})` : ''}
                  </div>
                )}
                {acc.upiId && (
                  <div className="mt-1 text-xs font-mono text-slate-500">
                    UPI: {acc.upiId}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Category Budgets & Utilization Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Category Budgets & Expense Ceilings (मद अनुसार बजट)
            </h2>
            <p className="text-xs text-slate-400">
              Set spending limits per category to receive budget alerts
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedBudget(null);
              setBudgetForm({ category: '', allocatedAmount: '', alertThresholdPercent: 90 });
              setError('');
              setBudgetModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 self-start"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Category Budget</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => (
            <div
              key={b._id}
              className={`rounded-2xl border p-4 space-y-2.5 transition ${
                b.isExceeded
                  ? 'border-rose-200 bg-rose-50/30'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{b.category}</span>
                <button
                  onClick={() => {
                    setSelectedBudget(b);
                    setBudgetForm({
                      category: b.category,
                      allocatedAmount: b.revisedAmount || b.allocatedAmount,
                      alertThresholdPercent: b.alertThresholdPercent || 90,
                    });
                    setError('');
                    setBudgetModalOpen(true);
                  }}
                  className="text-slate-400 hover:text-blue-600"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex justify-between text-xs">
                <span className="text-slate-500">
                  Spent: <span className="font-bold text-slate-800">{formatINR(b.spent)}</span>
                </span>
                <span className="text-slate-500">
                  Allocated: <span className="font-bold text-slate-800">{formatINR(b.revisedAmount || b.allocatedAmount)}</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    b.isExceeded ? 'bg-rose-500' : b.utilization > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, b.utilization)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-[11px]">
                <span className={`${b.isExceeded ? 'font-bold text-rose-600' : 'text-slate-400'}`}>
                  {b.isExceeded ? 'Budget Exceeded!' : `${b.utilization}% Utilized`}
                </span>
                <span className="text-slate-400">
                  Remaining: {formatINR(b.remaining)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE ACCOUNT MODAL */}
      {accountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setAccountModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Account</h3>
              <button onClick={() => setAccountModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Site Petty Cash, ICICI Bank..."
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Account Type</label>
                  <select
                    value={accountForm.accountType}
                    onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none capitalize"
                  >
                    <option value="cash">Cash in Hand (रोकड़)</option>
                    <option value="bank">Bank Account (बैंक)</option>
                    <option value="upi">UPI ID</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Opening Balance (₹)</label>
                  <input
                    type="number"
                    placeholder="₹ 0"
                    value={accountForm.openingBalance}
                    onChange={(e) => setAccountForm({ ...accountForm, openingBalance: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none"
                  />
                </div>
              </div>

              {accountForm.accountType === 'bank' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC"
                      value={accountForm.bankName}
                      onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      placeholder="••••••••••••"
                      value={accountForm.accountNumber}
                      onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-6 py-2 font-bold text-white shadow-md hover:bg-emerald-700"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER MODAL */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setTransferModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Transfer Funds</h3>
              <button onClick={() => setTransferModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleTransfer} className="mt-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">From Account *</label>
                  <select
                    required
                    value={transferForm.fromAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({formatINR(a.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">To Account *</label>
                  <select
                    required
                    value={transferForm.toAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name} ({formatINR(a.currentBalance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  placeholder="₹ 0"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-base font-black text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Transfer Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. ATM withdrawal for site petty cash..."
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-6 py-2 font-bold text-white shadow-md hover:bg-emerald-700"
                >
                  Execute Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY BUDGET MODAL */}
      {budgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setBudgetModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {selectedBudget ? 'Update Category Ceiling' : 'Set Category Ceiling'}
              </h3>
              <button onClick={() => setBudgetModalOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  disabled={!!selectedBudget}
                  placeholder="e.g. Raw Materials, Civil Labour..."
                  value={budgetForm.category}
                  onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none disabled:bg-slate-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Allocated Amount (₹) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  min="0"
                  placeholder="₹ 0"
                  value={budgetForm.allocatedAmount}
                  onChange={(e) => setBudgetForm({ ...budgetForm, allocatedAmount: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Warning Threshold (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  placeholder="90"
                  value={budgetForm.alertThresholdPercent}
                  onChange={(e) => setBudgetForm({ ...budgetForm, alertThresholdPercent: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBudgetModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-slate-900 px-6 py-2 font-bold text-white hover:bg-slate-800"
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
