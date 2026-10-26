import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import { WebcamCaptureModal } from '../components/modals/WebcamCaptureModal';
import { PhonePairingModal } from '../components/modals/PhonePairingModal';
import { TransactionReceiptModal } from '../components/modals/TransactionReceiptModal';
import {
  Receipt,
  Plus,
  Search,
  Download,
  Copy,
  Ban,
  Eye,
  Camera,
  Upload,
  X,
  Loader2,
  FileText,
  Building,
  User,
  Smartphone,
  Printer,
  Pencil,
  Trash2,
  Boxes,
} from 'lucide-react';

export const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProject } = useAuth();
  const { t, language } = useLanguage();

  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedReceiptTxn, setSelectedReceiptTxn] = useState(null);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTxnId, setEditingTxnId] = useState(null);

  const [activeTxn, setActiveTxn] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Material Inward State
  const [isMaterialEntry, setIsMaterialEntry] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    materialName: '',
    category: 'Civil Materials',
    unit: 'bag',
    quantity: '',
    ratePerUnit: '',
    vehicleNumber: '',
    challanNumber: '',
  });

  // Form State
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    account: '',
    toAccount: '',
    contact: '',
    category: 'General',
    subcategory: '',
    description: '',
    purpose: '',
    paymentMethod: 'cash',
    referenceNumber: '',
    notes: '',
    isAdvance: false,
    idempotencyKey: '',
  });

  const [capturedFiles, setCapturedFiles] = useState([]);

  // Check URL query for ?add=true
  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openAddModal();
      searchParams.delete('add');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const loadData = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (accountFilter) params.account = accountFilter;
      if (contactFilter) params.contact = contactFilter;
      if (searchQuery) params.search = searchQuery;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [txnRes, accRes, conRes] = await Promise.all([
        api.getTransactions(params),
        api.getAccounts(),
        api.getContacts(),
      ]);

      if (txnRes.success) {
        setTransactions(txnRes.data);
        setTotalCount(txnRes.total);
      }
      if (accRes.success) setAccounts(accRes.data);
      if (conRes.success) setContacts(conRes.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?._id, typeFilter, accountFilter, contactFilter, startDate, endDate]);

  const openAddModal = (draft = null, isEdit = false) => {
    setIsEditMode(isEdit);
    setEditingTxnId(isEdit && draft ? draft._id : null);
    const randomKey = `IDEM-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const defaultAcc = accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || '';

    if (draft) {
      setFormData({
        type: draft.type || 'expense',
        amount: draft.amount || '',
        date: draft.date ? new Date(draft.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        account: draft.account?._id || draft.account || defaultAcc,
        toAccount: draft.toAccount?._id || draft.toAccount || '',
        contact: draft.contact?._id || draft.contact || '',
        category: draft.category || 'General',
        subcategory: draft.subcategory || '',
        description: draft.description || '',
        purpose: draft.purpose || '',
        paymentMethod: draft.paymentMethod || 'cash',
        referenceNumber: draft.referenceNumber || '',
        notes: draft.notes || '',
        isAdvance: draft.isAdvance || false,
        idempotencyKey: randomKey,
      });

      if (draft.materialDetails?.isMaterial) {
        setIsMaterialEntry(true);
        setMaterialForm({
          materialName: draft.materialDetails.materialName || '',
          category: draft.materialDetails.category || draft.category || 'Civil Materials',
          unit: draft.materialDetails.unit || 'bag',
          quantity: draft.materialDetails.quantity !== undefined ? draft.materialDetails.quantity : '',
          ratePerUnit: draft.materialDetails.ratePerUnit !== undefined ? draft.materialDetails.ratePerUnit : '',
          vehicleNumber: draft.materialDetails.vehicleNumber || '',
          challanNumber: draft.materialDetails.challanNumber || '',
        });
      } else {
        setIsMaterialEntry(false);
        setMaterialForm({
          materialName: '',
          category: 'Civil Materials',
          unit: 'bag',
          quantity: '',
          ratePerUnit: '',
          vehicleNumber: '',
          challanNumber: '',
        });
      }
    } else {
      setFormData({
        type: 'expense',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        account: defaultAcc,
        toAccount: '',
        contact: '',
        category: 'General',
        subcategory: '',
        description: '',
        purpose: '',
        paymentMethod: 'cash',
        referenceNumber: '',
        notes: '',
        isAdvance: false,
        idempotencyKey: randomKey,
      });
      setIsMaterialEntry(false);
      setMaterialForm({
        materialName: '',
        category: 'Civil Materials',
        unit: 'bag',
        quantity: '',
        ratePerUnit: '',
        vehicleNumber: '',
        challanNumber: '',
      });
    }
    setCapturedFiles([]);
    setFormError('');
    setAddModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      setFormError(t('enterValidAmount'));
      return;
    }
    if (!formData.account) {
      setFormError(t('selectPaymentAccount'));
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');

      // Upload captured attachments first if any
      let attachmentIds = [];
      if (capturedFiles.length > 0) {
        const fileForm = new FormData();
        capturedFiles.forEach((f) => fileForm.append('files', f));
        fileForm.append('title', formData.description || 'Receipt');
        fileForm.append('documentType', formData.isAdvance ? 'receipt' : 'bill');

        const uploadRes = await api.uploadDocuments(fileForm);
        if (uploadRes.success) {
          attachmentIds = uploadRes.data.map((d) => d._id);
        }
      }

      // Prepare material details if toggled
      let materialPayload = { isMaterial: false };
      if (isMaterialEntry && materialForm.materialName?.trim()) {
        const qty = Number(materialForm.quantity) || 0;
        const rate = Number(materialForm.ratePerUnit) || 0;
        materialPayload = {
          isMaterial: true,
          materialName: materialForm.materialName.trim(),
          category: materialForm.category || formData.category || 'Civil Materials',
          unit: materialForm.unit || 'bag',
          quantity: qty,
          ratePerUnit: rate,
          totalMaterialCost: qty * rate > 0 ? qty * rate : Number(formData.amount),
          vehicleNumber: materialForm.vehicleNumber || '',
          challanNumber: materialForm.challanNumber || '',
        };
      }

      if (isEditMode && editingTxnId) {
        const updatePayload = {
          ...formData,
          amount: Number(formData.amount),
          materialDetails: materialPayload,
        };
        if (attachmentIds.length > 0) {
          updatePayload.attachments = attachmentIds;
        }

        const res = await api.updateTransaction(editingTxnId, updatePayload);
        if (res.success) {
          setAddModalOpen(false);
          setIsEditMode(false);
          setEditingTxnId(null);
          await loadData();
        }
      } else {
        const res = await api.createTransaction({
          ...formData,
          amount: Number(formData.amount),
          materialDetails: materialPayload,
          attachments: attachmentIds,
        });

        if (res.success) {
          setAddModalOpen(false);
          await loadData();
        }
      }
    } catch (err) {
      setFormError(err.message || t('errorOccurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (txn) => {
    const confirmMsg =
      language === 'hi'
        ? `क्या आप वास्तव में इस लेन-देन (${txn.transactionId || 'एंट्री'} - ₹${txn.amount}) को हटाना चाहते हैं? खाते का बैलेंस वापस ठीक हो जाएगा।`
        : `Are you sure you want to delete transaction ${txn.transactionId || ''} for ₹${txn.amount}? Account balance will be restored.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.deleteTransaction(txn._id);
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete transaction.');
    }
  };

  const openReceiptModal = (txn) => {
    setSelectedReceiptTxn(txn);
    setReceiptModalOpen(true);
  };

  const handleCancelSubmit = async () => {
    if (!cancellationReason.trim()) {
      alert(t('provideReason'));
      return;
    }
    try {
      setSubmitting(true);
      const res = await api.cancelTransaction(activeTxn._id, cancellationReason.trim());
      if (res.success) {
        setCancelModalOpen(false);
        setActiveTxn(null);
        setCancellationReason('');
        await loadData();
      }
    } catch (err) {
      alert(err.message || t('errorOccurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    if (transactions.length === 0) {
      alert(t('noExportData'));
      return;
    }

    const headers = [
      'Transaction ID', 'Date', 'Type', 'Category', 'Description',
      'Amount (INR)', 'Account', 'Person / Vendor', 'Payment Method',
      'Status', 'Reference Number',
    ];

    const rows = transactions.map((txn) => [
      txn.transactionId,
      formatDate(txn.date),
      txn.type,
      txn.category,
      `"${(txn.description || '').replace(/"/g, '""')}"`,
      txn.amount,
      `"${txn.account?.name || ''}"`,
      `"${txn.contact?.name || ''}"`,
      txn.paymentMethod,
      txn.paymentStatus,
      txn.referenceNumber || '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${activeProject.name.replace(/[^a-zA-Z0-9]/g, '_')}_transactions_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to get translated transaction type label
  const getTypeLabel = (typeKey) => {
    const map = {
      expense: t('expense'),
      income: t('income'),
      advance: t('advance'),
      contractor_payment: t('contractor_payment'),
      supplier_payment: t('supplier_payment'),
      transfer: t('transfer'),
      refund: t('refund'),
      loan_received: t('loan_received'),
      loan_repayment: t('loan_repayment'),
      liability_payment: t('liability_payment'),
    };
    return map[typeKey] || typeKey;
  };

  // Helper to get translated payment method label
  const getMethodLabel = (method) => {
    const map = {
      cash: t('cash'),
      upi: t('upi'),
      bank_transfer: t('bank_transfer'),
      cheque: t('cheque'),
      card: t('card'),
      other: t('other'),
    };
    return map[method] || method;
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Receipt className="h-6 w-6 text-blue-600" />
            <span>{t('transactions')}</span>
          </h1>
          <p className="text-xs text-slate-500">
            {totalCount} {t('ledgerSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            <span>{t('exportCSV')}</span>
          </button>
          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addTransaction')}</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadData()}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none"
          >
            <option value="">{t('allTypes')}</option>
            <option value="expense">{t('expense')}</option>
            <option value="income">{t('income')}</option>
            <option value="advance">{t('advance')}</option>
            <option value="contractor_payment">{t('contractor_payment')}</option>
            <option value="supplier_payment">{t('supplier_payment')}</option>
            <option value="transfer">{t('transfer')}</option>
            <option value="refund">{t('refund')}</option>
          </select>

          {/* Account Filter */}
          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none"
          >
            <option value="">{t('allAccounts')}</option>
            {accounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.name} ({formatINR(acc.currentBalance)})
              </option>
            ))}
          </select>

          {/* Contact Filter */}
          <select
            value={contactFilter}
            onChange={(e) => setContactFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 outline-none"
          >
            <option value="">{t('allContacts')}</option>
            {contacts.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} ({c.role})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Picker row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">{t('dateRange')}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-700 outline-none"
            />
            <span className="text-slate-400">{t('to')}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-700 outline-none"
            />
            {(startDate || endDate || typeFilter || accountFilter || contactFilter || searchQuery) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setTypeFilter('');
                  setAccountFilter('');
                  setContactFilter('');
                  setSearchQuery('');
                }}
                className="text-xs text-rose-600 font-semibold hover:underline ml-2"
              >
                {t('clearFilters')}
              </button>
            )}
          </div>
          <button
            onClick={loadData}
            className="rounded-xl bg-slate-900 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-800"
          >
            {t('applyFilter')}
          </button>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">{t('txnIdDate')}</th>
                <th className="px-4 py-3">{t('type')}</th>
                <th className="px-4 py-3">{t('categoryPurpose')}</th>
                <th className="px-4 py-3">{t('accountContact')}</th>
                <th className="px-4 py-3">{t('paymentInfo')}</th>
                <th className="px-4 py-3 text-right">{t('amount')}</th>
                <th className="px-4 py-3 text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                    {t('loadingLedger')}
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((txn) => {
                  const isInflow = ['income', 'loan_received', 'refund'].includes(txn.type);
                  const isCancelled = txn.isCancelled;

                  return (
                    <tr
                      key={txn._id}
                      className={`hover:bg-slate-50 transition ${
                        isCancelled ? 'bg-rose-50/30 opacity-75' : ''
                      }`}
                    >
                      {/* ID & Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 font-mono text-[11px]">
                          {txn.transactionId}
                        </div>
                        <div className="text-[10px] text-slate-400">{formatDate(txn.date)}</div>
                      </td>

                      {/* Type Badge */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            isCancelled
                              ? 'bg-rose-100 text-rose-700 line-through'
                              : isInflow
                              ? 'bg-emerald-50 text-emerald-700'
                              : txn.isAdvance
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isCancelled ? t('cancelled') : getTypeLabel(txn.type)}
                        </span>
                        {txn.isAdvance && !isCancelled && (
                          <div className="text-[9px] text-amber-700 font-semibold mt-0.5">
                            {t('unsettled')}: {formatINR(txn.advanceDetails?.unsettledAmount)}
                          </div>
                        )}
                      </td>

                      {/* Category & Description */}
                      <td className="px-4 py-3 max-w-[220px]">
                        <div className="font-semibold text-slate-800 truncate">
                          {txn.description || txn.purpose || '-'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {txn.category} {txn.subcategory ? `• ${txn.subcategory}` : ''}
                        </div>
                        {txn.materialDetails?.isMaterial && (
                          <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-[10px] font-bold text-amber-800 border border-amber-200 max-w-full">
                            <Boxes className="h-3 w-3 text-amber-600 flex-shrink-0" />
                            <span className="truncate">
                              {txn.materialDetails.materialName}: {txn.materialDetails.quantity} {txn.materialDetails.unit} @ ₹{txn.materialDetails.ratePerUnit}/{txn.materialDetails.unit}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Account & Contact */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-700 flex items-center gap-1">
                          <Building className="h-3 w-3 text-slate-400" />
                          <span>{txn.account?.name || t('account')}</span>
                        </div>
                        {txn.contact && (
                          <div className="text-[10px] text-blue-600 flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3" />
                            <span>{txn.contact.name}</span>
                          </div>
                        )}
                      </td>

                      {/* Payment Method & UTR */}
                      <td className="px-4 py-3 whitespace-nowrap text-[11px] text-slate-600">
                        <span className="uppercase font-semibold text-slate-700">
                          {getMethodLabel(txn.paymentMethod)}
                        </span>
                        {txn.referenceNumber && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            {t('ref')}: {txn.referenceNumber}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td
                        className={`px-4 py-3 text-right font-black text-sm whitespace-nowrap ${
                          isCancelled
                            ? 'text-slate-400 line-through'
                            : isInflow
                            ? 'text-emerald-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {isInflow ? '+' : '-'} {formatINR(txn.amount)}
                      </td>

                      {/* Action Menu */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Details */}
                          <button
                            onClick={() => {
                              setActiveTxn(txn);
                              setDetailModalOpen(true);
                            }}
                            title={t('viewDetails')}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Print / Download Receipt Voucher */}
                          <button
                            onClick={() => openReceiptModal(txn)}
                            title={t('print')}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition"
                          >
                            <Printer className="h-4 w-4" />
                          </button>

                          {/* Edit Transaction */}
                          {!isCancelled && (
                            <button
                              onClick={() => openAddModal(txn, true)}
                              title={t('edit')}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}

                          {/* Duplicate */}
                          <button
                            onClick={() => openAddModal(txn, false)}
                            title={t('duplicate')}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                          >
                            <Copy className="h-4 w-4" />
                          </button>

                          {/* Cancel / Reverse */}
                          {!isCancelled && (
                            <button
                              onClick={() => {
                                setActiveTxn(txn);
                                setCancellationReason('');
                                setCancelModalOpen(true);
                              }}
                              title={t('cancelReverse')}
                              className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete Entry */}
                          <button
                            onClick={() => handleDeleteTransaction(txn)}
                            title={t('delete')}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    {t('noTransactions')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======== ADD TRANSACTION MODAL (Simplified) ======== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setAddModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {isEditMode
                      ? language === 'hi'
                        ? 'लेन-देन संपादित करें / बदलें'
                        : 'Edit Transaction'
                      : t('recordTransaction')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isEditMode
                      ? language === 'hi'
                        ? 'आवश्यक विवरण बदलें और सहेजें'
                        : 'Update transaction details'
                      : t('recordTransactionHint')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
              {/* Type and Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('txnType')} *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData,
                        type: newType,
                        isAdvance: newType === 'advance',
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="expense">{t('expense')}</option>
                    <option value="income">{t('income')}</option>
                    <option value="advance">{t('advance')}</option>
                    <option value="contractor_payment">{t('contractor_payment')}</option>
                    <option value="supplier_payment">{t('supplier_payment')}</option>
                    <option value="transfer">{t('transfer')}</option>
                    <option value="refund">{t('refund')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('amount')} *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    placeholder="₹ 0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-lg font-black text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Advance Checkbox */}
              {formData.type !== 'income' && formData.type !== 'transfer' && (
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                  <input
                    type="checkbox"
                    id="isAdvCheck"
                    checked={formData.isAdvance}
                    onChange={(e) => setFormData({ ...formData, isAdvance: e.target.checked })}
                    className="h-4 w-4 mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isAdvCheck" className="cursor-pointer">
                    <div className="text-xs font-bold text-amber-900">{t('markAdvance')}</div>
                    <div className="text-[11px] text-amber-700 mt-0.5">{t('markAdvanceHint')}</div>
                  </label>
                </div>
              )}

              {/* ===== Material Inward Section (सामग्री आवक व भाव हिसाब) ===== */}
              {formData.type !== 'income' && formData.type !== 'transfer' && (
                <div
                  className={`rounded-2xl border transition-all ${
                    isMaterialEntry
                      ? 'border-amber-400 bg-amber-50/50 p-4 shadow-sm'
                      : 'border-slate-200 bg-slate-50/70 p-3 hover:border-slate-300'
                  }`}
                >
                  <div
                    className="flex items-center justify-between cursor-pointer select-none"
                    onClick={() => {
                      const nextState = !isMaterialEntry;
                      setIsMaterialEntry(nextState);
                      if (nextState && formData.category === 'General') {
                        setFormData((prev) => ({ ...prev, category: 'Civil Materials' }));
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-white transition-colors ${
                          isMaterialEntry ? 'bg-amber-600 shadow-md shadow-amber-500/20' : 'bg-slate-400'
                        }`}
                      >
                        <Boxes className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>
                            {language === 'hi' ? '📦 सामग्री / माल आवक दर्ज करें' : '📦 Record Material Inward'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                            {language === 'hi' ? 'सीमेंट, सरिया, ईंट आदि' : 'Cement, Steel, Bricks'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {language === 'hi'
                            ? 'बैग (प्रति बैग भाव) या वजन (प्रति क्विंटल भाव) से कुल रकम का हिसाब और स्टॉक अपडेट'
                            : 'Auto-calculates total from rate/bag or rate/quintal and syncs to stock register'}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isMaterialEntry}
                      onChange={(e) => {
                        setIsMaterialEntry(e.target.checked);
                        if (e.target.checked && formData.category === 'General') {
                          setFormData((prev) => ({ ...prev, category: 'Civil Materials' }));
                        }
                      }}
                      className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>

                  {isMaterialEntry && (
                    <div className="mt-4 pt-3 border-t border-amber-200/70 space-y-3.5">
                      {/* Quick Presets */}
                      <div>
                        <div className="text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center justify-between">
                          <span>{language === 'hi' ? 'त्वरित सामग्री चुनें (Quick Select):' : 'Quick Presets:'}</span>
                          <span className="text-[10px] text-amber-700">
                            {language === 'hi' ? 'क्लिक करते ही यूनिट सेट हो जाएगी' : 'Click to auto-set unit'}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { name: language === 'hi' ? 'सीमेंट (Cement)' : 'Cement', unit: 'bag', cat: 'Civil Materials' },
                            { name: language === 'hi' ? 'सरिया / Steel TMT' : 'Steel TMT (Sariya)', unit: 'quintal', cat: 'Steel & Metal' },
                            { name: language === 'hi' ? 'रेती / बालू (Sand)' : 'Sand (Reti)', unit: 'brass', cat: 'Civil Materials' },
                            { name: language === 'hi' ? 'गिट्टी (Aggregate)' : 'Aggregate (Gitti)', unit: 'brass', cat: 'Civil Materials' },
                            { name: language === 'hi' ? 'ईंट (Red Bricks)' : 'Red Bricks', unit: 'piece', cat: 'Civil Materials' },
                            { name: language === 'hi' ? 'फ्लाई ऐश ब्लॉक' : 'Fly Ash Blocks', unit: 'piece', cat: 'Civil Materials' },
                            { name: language === 'hi' ? 'पुट्टी / पेंट (Putty)' : 'Paint / Putty', unit: 'bag', cat: 'Finishing' },
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setMaterialForm((prev) => {
                                  const updated = {
                                    ...prev,
                                    materialName: preset.name,
                                    unit: preset.unit,
                                    category: preset.cat,
                                  };
                                  if (updated.quantity && updated.ratePerUnit) {
                                    const total = (Number(updated.quantity) * Number(updated.ratePerUnit)).toFixed(2);
                                    setFormData((f) => ({ ...f, amount: parseFloat(total), category: preset.cat }));
                                  } else {
                                    setFormData((f) => ({ ...f, category: preset.cat }));
                                  }
                                  return updated;
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-amber-200 text-slate-700 hover:bg-amber-100 hover:text-amber-900 transition shadow-xs"
                            >
                              + {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Material Name & Unit Selector */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {language === 'hi' ? 'सामग्री का नाम (Material Name)' : 'Material Name'} *
                          </label>
                          <input
                            type="text"
                            required={isMaterialEntry}
                            placeholder={language === 'hi' ? 'उदा. अल्ट्राटेक सीमेंट या जिंदल 12mm सरिया' : 'e.g. UltraTech Cement or 12mm Sariya'}
                            value={materialForm.materialName}
                            onChange={(e) => setMaterialForm({ ...materialForm, materialName: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-amber-600 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {language === 'hi' ? 'माप की इकाई (Measurement Unit)' : 'Measurement Unit'} *
                          </label>
                          <select
                            value={materialForm.unit}
                            onChange={(e) => {
                              const newUnit = e.target.value;
                              setMaterialForm((prev) => {
                                const updated = { ...prev, unit: newUnit };
                                if (updated.quantity && updated.ratePerUnit) {
                                  const total = (Number(updated.quantity) * Number(updated.ratePerUnit)).toFixed(2);
                                  setFormData((f) => ({ ...f, amount: parseFloat(total) }));
                                }
                                return updated;
                              });
                            }}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-amber-600 bg-white"
                          >
                            <option value="bag">{language === 'hi' ? '🛍️ बैग / बोरी (Bag) — सीमेंट, पुट्टी' : '🛍️ Bags (Bag) — Cement, Putty'}</option>
                            <option value="quintal">{language === 'hi' ? '⚖️ क्विंटल (Quintal / 100 kg) — सरिया, लोहा' : '⚖️ Quintal (100 kg) — Steel, Iron'}</option>
                            <option value="ton">{language === 'hi' ? '🏗️ मीट्रिक टन (Ton / 1000 kg) — भारी सरिया' : '🏗️ Metric Ton (1000 kg)'}</option>
                            <option value="kg">{language === 'hi' ? '⚖️ किलोग्राम (Kilogram - kg) — बाइंडिंग तार, कीलें' : '⚖️ Kilogram (kg)'}</option>
                            <option value="brass">{language === 'hi' ? '🚛 ब्रास (Brass / 100 cu.ft) — रेती, गिट्टी' : '🚛 Brass (100 cu.ft) — Sand, Aggregate'}</option>
                            <option value="cft">{language === 'hi' ? '📐 घन फीट (Cu.Ft / CFT) — लकड़ी, पत्थर' : '📐 Cu.Ft / CFT'}</option>
                            <option value="piece">{language === 'hi' ? '🧱 नग / पीस (Piece) — ईंट, ब्लॉक, टाइल्स' : '🧱 Piece (Nos) — Bricks, Tiles'}</option>
                            <option value="trip">{language === 'hi' ? '🚚 ट्रिप / डम्पर (Trip / Trolley) — मलबा, मिट्टी' : '🚚 Trip / Trolley'}</option>
                          </select>
                        </div>
                      </div>

                      {/* Quantity & Rate Per Unit Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Quantity */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {materialForm.unit === 'bag'
                              ? (language === 'hi' ? 'कुल बैग संख्या (Number of Bags) *' : 'Number of Bags *')
                              : materialForm.unit === 'quintal'
                              ? (language === 'hi' ? 'कुल वजन (क्विंटल में) *' : 'Weight in Quintals (Qtl) *')
                              : materialForm.unit === 'ton'
                              ? (language === 'hi' ? 'कुल वजन (टन में) *' : 'Weight in Tons *')
                              : (language === 'hi' ? `कुल मात्रा (${materialForm.unit}) *` : `Quantity (${materialForm.unit}) *`)}
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            placeholder={materialForm.unit === 'bag' ? 'उदा. 100' : materialForm.unit === 'quintal' ? 'उदा. 24.50' : 'उदा. 10'}
                            value={materialForm.quantity}
                            onChange={(e) => {
                              const q = e.target.value;
                              setMaterialForm((prev) => {
                                const updated = { ...prev, quantity: q };
                                if (q && prev.ratePerUnit) {
                                  const total = (Number(q) * Number(prev.ratePerUnit)).toFixed(2);
                                  setFormData((f) => ({ ...f, amount: parseFloat(total) }));
                                }
                                return updated;
                              });
                            }}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-amber-600 bg-white"
                          />
                        </div>

                        {/* Rate per Unit */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            {materialForm.unit === 'bag'
                              ? (language === 'hi' ? 'प्रति बैग भाव (Rate per Bag ₹) *' : 'Rate per Bag (₹) *')
                              : materialForm.unit === 'quintal'
                              ? (language === 'hi' ? 'प्रति क्विंटल भाव (Rate per Qtl ₹) *' : 'Rate per Quintal (₹) *')
                              : materialForm.unit === 'ton'
                              ? (language === 'hi' ? 'प्रति टन भाव (Rate per Ton ₹) *' : 'Rate per Ton (₹) *')
                              : (language === 'hi' ? `प्रति ${materialForm.unit} भाव (₹) *` : `Rate per ${materialForm.unit} (₹) *`)}
                          </label>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            placeholder={materialForm.unit === 'bag' ? '₹ 380' : materialForm.unit === 'quintal' ? '₹ 6450' : '₹ 0'}
                            value={materialForm.ratePerUnit}
                            onChange={(e) => {
                              const r = e.target.value;
                              setMaterialForm((prev) => {
                                const updated = { ...prev, ratePerUnit: r };
                                if (prev.quantity && r) {
                                  const total = (Number(prev.quantity) * Number(r)).toFixed(2);
                                  setFormData((f) => ({ ...f, amount: parseFloat(total) }));
                                }
                                return updated;
                              });
                            }}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:border-amber-600 bg-white"
                          />
                        </div>
                      </div>

                      {/* Auto Calculation Badge */}
                      {materialForm.quantity && materialForm.ratePerUnit && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-900">
                          <div className="text-xs font-bold flex items-center gap-1.5">
                            <span>
                              {materialForm.quantity} {materialForm.unit} × ₹{materialForm.ratePerUnit} =
                            </span>
                            <span className="text-base font-black text-amber-950">
                              ₹{(Number(materialForm.quantity) * Number(materialForm.ratePerUnit)).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-amber-800 bg-white/80 px-2.5 py-0.5 rounded-lg border border-amber-200">
                              ✓ {language === 'hi' ? 'रकम में ऑटो-सेट हो गया' : 'Amount Auto-updated'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Optional Challan and Vehicle */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            {language === 'hi' ? 'चालान / पर्ची नंबर (वैकल्पिक)' : 'Challan / Bill No. (Optional)'}
                          </label>
                          <input
                            type="text"
                            placeholder="उदा. CH-10294"
                            value={materialForm.challanNumber}
                            onChange={(e) => setMaterialForm({ ...materialForm, challanNumber: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-600 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            {language === 'hi' ? 'गाड़ी / डम्पर नंबर (वैकल्पिक)' : 'Vehicle / Truck No. (Optional)'}
                          </label>
                          <input
                            type="text"
                            placeholder="उदा. RJ-14-GA-5678"
                            value={materialForm.vehicleNumber}
                            onChange={(e) => setMaterialForm({ ...materialForm, vehicleNumber: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-600 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Accounts & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('sourceAccount')} *
                  </label>
                  <select
                    required
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="">{t('selectAccount')}</option>
                    {accounts.map((acc) => (
                      <option key={acc._id} value={acc._id}>
                        {acc.name} — {t('balance')}: {formatINR(acc.currentBalance)}
                      </option>
                    ))}
                  </select>
                </div>

                {formData.type === 'transfer' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('destAccount')} *
                    </label>
                    <select
                      required
                      value={formData.toAccount}
                      onChange={(e) => setFormData({ ...formData, toAccount: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600"
                    >
                      <option value="">{t('selectAccount')}</option>
                      {accounts.map((acc) => (
                        <option key={acc._id} value={acc._id}>
                          {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {t('personOptional')}
                    </label>
                    <select
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600"
                    >
                      <option value="">{t('noContactLinked')}</option>
                      {contacts.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Date, Category, Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('date')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('category')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('categoryPlaceholder')}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('paymentMethod')}
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none uppercase font-semibold focus:border-blue-600"
                  >
                    <option value="cash">{t('cash')}</option>
                    <option value="upi">{t('upi')}</option>
                    <option value="bank_transfer">{t('bank_transfer')}</option>
                    <option value="cheque">{t('cheque')}</option>
                    <option value="card">{t('card')}</option>
                    <option value="other">{t('other')}</option>
                  </select>
                </div>
              </div>

              {/* Description & Reference Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('descriptionPurpose')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('descriptionPlaceholder')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('referenceNumber')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('refPlaceholder')}
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none font-mono focus:border-blue-600"
                  />
                </div>
              </div>

              {/* ===== Proof Attachment Section (Webcam / Phone QR / File) ===== */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {t('attachProof')}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Webcam Photo */}
                    <button
                      type="button"
                      onClick={() => setWebcamOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Camera className="h-3.5 w-3.5 text-blue-600" />
                      <span>{t('takeWebcamPhoto')}</span>
                    </button>

                    {/* Phone Camera via QR */}
                    <button
                      type="button"
                      onClick={() => setPhoneModalOpen(true)}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Smartphone className="h-3.5 w-3.5 text-emerald-600" />
                      <span>{t('phoneCamera')}</span>
                    </button>

                    {/* Browse File */}
                    <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition">
                      <Upload className="h-3.5 w-3.5 text-slate-500" />
                      <span>{t('browseFile')}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        onChange={(e) => {
                          if (e.target.files) {
                            setCapturedFiles([...capturedFiles, ...Array.from(e.target.files)]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {capturedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {capturedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs border border-slate-200 shadow-sm"
                      >
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                        <span className="truncate max-w-[120px] font-medium text-slate-700">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCapturedFiles(capturedFiles.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {isEditMode
                      ? language === 'hi'
                        ? 'बदलाव सहेजें'
                        : 'Save Changes'
                      : t('saveTransaction')}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======== CANCELLATION MODAL ======== */}
      {cancelModalOpen && activeTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setCancelModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl z-10 border border-slate-100">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 text-rose-600">
              <Ban className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900">
                {t('cancelTransaction')}
              </h3>
            </div>

            <div className="py-4 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200">
                <div className="font-bold text-slate-800">{activeTxn.transactionId}</div>
                <div>{t('amount')}: <span className="font-bold">{formatINR(activeTxn.amount)}</span></div>
                <div>{t('account')}: {activeTxn.account?.name}</div>
                <div className="mt-1 text-rose-600 text-[11px]">
                  {t('cancelHint')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('cancellationReason')} *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder={t('reasonPlaceholder')}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t('nevermind')}
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-700 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{t('confirmCancel')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== DETAIL / AUDIT DRAWER MODAL ======== */}
      {detailModalOpen && activeTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setDetailModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">{t('transactionDetails')}</h3>
                <span className="font-mono text-xs text-slate-400">{activeTxn.transactionId}</span>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">{t('amount')}</span>
                  <span className="text-lg font-black text-slate-900">{formatINR(activeTxn.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{t('status')}</span>
                  <span className="font-bold capitalize">{activeTxn.paymentStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{t('date')}</span>
                  <span>{formatDate(activeTxn.date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{t('method')}</span>
                  <span className="uppercase font-bold">{getMethodLabel(activeTxn.paymentMethod)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{t('account')}</span>
                  <span>{activeTxn.account?.name || '-'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">{t('party')}</span>
                  <span>{activeTxn.contact?.name || t('selfGeneral')}</span>
                </div>
              </div>

              {/* Attachments */}
              {activeTxn.attachments && activeTxn.attachments.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-2">
                    {t('attachedProofs')} ({activeTxn.attachments.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {activeTxn.attachments.map((att) => (
                      <a
                        key={att._id}
                        href={att.cloudinaryUrl || `/api/documents/${att._id}/file`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-xl border border-slate-200 p-2.5 hover:bg-slate-50 transition"
                      >
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate font-medium text-slate-700">
                          {att.title || att.originalFileName}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Trail */}
              {activeTxn.auditLog && activeTxn.auditLog.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-700 mb-2">{t('auditHistory')}</h4>
                  <div className="space-y-1.5 border-l-2 border-slate-200 pl-3">
                    {activeTxn.auditLog.map((log, i) => (
                      <div key={i} className="text-[11px] text-slate-600">
                        <span className="font-semibold text-slate-800">{log.action}:</span> {log.details}
                        <div className="text-[10px] text-slate-400">
                          {formatDateTime(log.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PC Webcam Modal */}
      <WebcamCaptureModal
        isOpen={webcamOpen}
        onClose={() => setWebcamOpen(false)}
        onPhotoCaptured={(file) => {
          setCapturedFiles([...capturedFiles, file]);
        }}
      />

      {/* Phone Camera QR Pairing Modal */}
      <PhonePairingModal
        isOpen={phoneModalOpen}
        onClose={() => setPhoneModalOpen(false)}
        onDocumentsReceived={(docs) => {
          // When phone sends docs, we can optionally add them to the current form
          console.log('Received from phone:', docs.length);
        }}
      />

      {/* Transaction Printable Receipt Voucher Modal */}
      <TransactionReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        transaction={selectedReceiptTxn}
      />
    </div>
  );
};
