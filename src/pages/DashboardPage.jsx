import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  HandCoins,
  AlertTriangle,
  Receipt,
  FileText,
  Boxes,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export const DashboardPage = () => {
  const { activeProject } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      setError('');
      const res = await api.getDashboardSummary();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Error loading dashboard summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activeProject?._id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-xl"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const fin = data?.financialSummary || {};
  const charts = data?.charts || {};
  const progress = data?.progress || {};
  const counts = data?.counts || {};
  const recent = data?.recentTransactions || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Project Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeProject?.name || 'Project Dashboard'}
            </h1>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-800 capitalize">
              {activeProject?.projectType}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Universal Hisab-Kitab Ledger • Real-time Financial Position
          </p>
        </div>

        {/* Progress Badge */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
            {progress.progressPercent || 0}%
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Project Progress ({progress.method?.replace('_', ' ') || 'Manual'})
            </div>
            <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden mt-1">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, progress.progressPercent || 0)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* Primary Financial Metric Cards (8 Critical Pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Cash In Hand across Accounts */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('cashInHand')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {formatINR(fin.totalCashInHand)}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>Actual liquid money in cash/bank</span>
          </div>
        </div>

        {/* 2. Total Money Received / Inflow */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('moneyReceived')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {formatINR(fin.totalMoneyReceived)}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>Funding & income capital received</span>
          </div>
        </div>

        {/* 3. Total Actual Expenses (Outflow) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('actualExpenses')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 tracking-tight">
            {formatINR(fin.totalActualExpenses)}
          </div>
          <div className="mt-1 flex items-center text-xs text-slate-500">
            <span>Confirmed recognized expenses</span>
          </div>
        </div>

        {/* 4. Estimated Budget Remaining */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('budgetRemaining')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className={`mt-2 text-2xl font-black tracking-tight ${fin.estimatedBudgetRemaining < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatINR(fin.estimatedBudgetRemaining)}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
            <span>Approved Budget: {formatINR(fin.revisedBudget)}</span>
            <span className="font-semibold text-blue-600">{fin.budgetUtilizationPercent}%</span>
          </div>
        </div>

        {/* 5. Unsettled Advances (Crucial Distinction) */}
        <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              {t('unsettledAdvances')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <HandCoins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800 tracking-tight">
            {formatINR(fin.totalUnsettledAdvances)}
          </div>
          <div className="mt-1 text-xs text-amber-700">
            Advances paid to contractors not yet billed
          </div>
        </div>

        {/* 6. Outstanding Pending Bills */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('pendingBills')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-700 tracking-tight">
            {formatINR(fin.totalPendingBills)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Verified invoices awaiting payment
          </div>
        </div>

        {/* 7. Total Verified Purchases Value */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verified Purchases
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 tracking-tight">
            {formatINR(fin.totalVerifiedPurchases)}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Material and supplier billing records
          </div>
        </div>

        {/* 8. Budget Utilization Bar Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('budgetUtilization')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600 tracking-tight">
            {fin.budgetUtilizationPercent || 0}%
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full ${
                fin.budgetUtilizationPercent > 90 ? 'bg-rose-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, fin.budgetUtilizationPercent || 0)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Section: Monthly Cashflow & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Cash Flow (6 Months) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Monthly Cash Flow (Inflow vs Outflow)
              </h2>
              <p className="text-xs text-slate-400">Receipts and actual expenditures over time</p>
            </div>
          </div>

          <div className="h-72 w-full">
            {charts.monthlyCashflow && charts.monthlyCashflow.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyCashflow}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                  <Tooltip
                    formatter={(val) => [formatINR(val), '']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Inflow / Income (जमा)" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Actual Expense (खर्च)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="advance" name="Advances (पेशगी)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No monthly data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Expenses by Category Donut Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Expenses by Category</h2>
            <p className="text-xs text-slate-400">Spending breakdown across heads</p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            {charts.categoryExpenses && charts.categoryExpenses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.categoryExpenses}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {charts.categoryExpenses.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatINR(val), 'Spent']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No category transactions recorded yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Ledger Entries & Quick Directory Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Transactions</h2>
              <p className="text-xs text-slate-400">Latest entries from universal ledger</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-2.5">Date</th>
                  <th className="pb-2.5">Type</th>
                  <th className="pb-2.5">Description</th>
                  <th className="pb-2.5">Account / Person</th>
                  <th className="pb-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.length > 0 ? (
                  recent.map((txn) => {
                    const isInflow = ['income', 'loan_received', 'refund'].includes(txn.type);
                    return (
                      <tr key={txn._id} className="hover:bg-slate-50 transition">
                        <td className="py-3 text-slate-500 font-medium whitespace-nowrap">
                          {formatDate(txn.date)}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${
                              isInflow
                                ? 'bg-emerald-50 text-emerald-700'
                                : txn.isAdvance
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {txn.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 max-w-[180px] truncate">
                          <div className="font-semibold text-slate-800 truncate">
                            {txn.description || txn.category}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {txn.transactionId}
                          </div>
                        </td>
                        <td className="py-3 text-slate-600 whitespace-nowrap">
                          {txn.contact?.name || txn.account?.name || '-'}
                        </td>
                        <td className={`py-3 text-right font-bold whitespace-nowrap ${isInflow ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {isInflow ? '+' : '-'} {formatINR(txn.amount)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      No transactions recorded yet. Click "Quick Add" to add your first transaction.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Directory & Progress Summary */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Project Quick Directory
            </h2>
            <div className="space-y-2.5">
              <Link
                to="/contacts"
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">People & Vendors</div>
                    <div className="text-[10px] text-slate-400">Contractors, labourers, suppliers</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700">{counts.contacts || 0}</span>
              </Link>

              <Link
                to="/materials"
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Materials & Items</div>
                    <div className="text-[10px] text-slate-400">Inventory with custom units</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700">{counts.materials || 0}</span>
              </Link>

              <Link
                to="/tasks"
                className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 hover:bg-slate-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Tasks & Milestones</div>
                    <div className="text-[10px] text-slate-400">Weighted progress trackers</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-700">{counts.tasks || 0}</span>
              </Link>
            </div>
          </div>

          {/* Wi-Fi QR Card Callout */}
          <div className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-200" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-100">
                Smart Receipt Sync
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-blue-100">
              Snap bill photos on your smartphone and transfer them directly to PC over Wi-Fi without cables or WhatsApp.
            </p>
            <Link
              to="/documents"
              className="mt-3 inline-block rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 transition"
            >
              Open Document Vault →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
