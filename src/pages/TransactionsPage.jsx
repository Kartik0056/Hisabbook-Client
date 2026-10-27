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
  HandCoins,
  Wallet,
  ShieldCheck,
  Zap,
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
    paymentSourceType: 'direct_account', // 'direct_account' | 'contractor_advance'
    contractor: '',
  });

  const [advances, setAdvances] = useState([]);
  const [contactPayments, setContactPayments] = useState([]);
  const [loadingContactPayments, setLoadingContactPayments] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    account: '',
    toAccount: '',
    contact: '',
    linkedAdvance: '',
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

      const [txnRes, accRes, conRes, advRes] = await Promise.all([
        api.getTransactions(params),
        api.getAccounts(),
        api.getContacts(),
        api.getAdvances(),
      ]);

      if (txnRes.success) {
        setTransactions(txnRes.data);
        setTotalCount(txnRes.total);
      }
      if (accRes.success) setAccounts(accRes.data);
      if (conRes.success) setContacts(conRes.data);
      if (advRes.success) setAdvances(advRes.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?._id, typeFilter, accountFilter, contactFilter, startDate, endDate]);

  // Compute contractor advance balances
  const contractorAdvanceMap = {};
  advances.forEach((adv) => {
    if (!adv.isCancelled && adv.contact) {
      const cId = adv.contact._id || adv.contact;
      const unsettled =
        adv.advanceDetails?.unsettledAmount ??
        (adv.amount - (adv.advanceDetails?.settledAmount || 0));
      contractorAdvanceMap[cId] = (contractorAdvanceMap[cId] || 0) + unsettled;
    }
  });

  const fetchContactPayments = async (contactId) => {
    if (!contactId) {
      setContactPayments([]);
      return;
    }
    setLoadingContactPayments(true);
    try {
      // Seed immediately from in-memory advances and transactions for zero delay
      const local = [
        ...advances.filter((a) => (a.contact?._id || a.contact) === contactId),
        ...transactions.filter(
          (t) =>
            (t.contact?._id || t.contact) === contactId &&
            !t.isAdjustedFromAdvance &&
            !t.isCancelled &&
            (t.type === 'advance' || t.type === 'contractor_payment' || t.type === 'expense' || t.isAdvance)
        ),
      ];
      const seen = new Set();
      const uniqueLocal = local.filter((item) => {
        if (!item._id || seen.has(item._id)) return false;
        seen.add(item._id);
        return true;
      });
      setContactPayments(uniqueLocal);

      // Fetch comprehensive contact transactions from API
      const res = await api.getTransactions({ contact: contactId, limit: 100 });
      if (res.success && Array.isArray(res.data)) {
        const serverFiltered = res.data.filter(
          (t) =>
            !t.isCancelled &&
            !t.isAdjustedFromAdvance &&
            (t.type === 'advance' || t.type === 'contractor_payment' || t.type === 'expense' || t.isAdvance)
        );
        const map = new Map();
        uniqueLocal.forEach((item) => map.set(item._id, item));
        serverFiltered.forEach((item) => map.set(item._id, item));
        const combined = Array.from(map.values()).sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setContactPayments(combined);
      }
    } catch (err) {
      console.error('Error fetching contact payments:', err);
    } finally {
      setLoadingContactPayments(false);
    }
  };

  const handleContactChange = (contactId) => {
    setFormData((prev) => ({
      ...prev,
      contact: contactId,
      linkedAdvance: '',
    }));
    if (isMaterialEntry) {
      setMaterialForm((prev) => ({
        ...prev,
        contractor: contactId,
      }));
    }
    fetchContactPayments(contactId);
  };

  const handleLinkedTxnSelect = (txnId) => {
    setFormData((prev) => ({
      ...prev,
      linkedAdvance: txnId,
    }));
    if (txnId) {
      setMaterialForm((prev) => ({
        ...prev,
        paymentSourceType: 'contractor_advance',
        contractor: formData.contact || prev.contractor,
      }));
    } else {
      setMaterialForm((prev) => ({
        ...prev,
        paymentSourceType: 'direct_account',
      }));
    }
  };

  const openAddModal = (draft = null, isEdit = false) => {
    setIsEditMode(isEdit);
    setEditingTxnId(isEdit && draft ? draft._id : null);
    const randomKey = `IDEM-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const defaultAcc = accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || '';

    if (draft) {
      const draftContactId = draft.contact?._id || draft.contact || '';
      const draftLinkedAdv = draft.linkedAdvance?._id || draft.linkedAdvance || '';
      setFormData({
        type: draft.type || 'expense',
        amount: draft.amount || '',
        date: draft.date ? new Date(draft.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        account: draft.account?._id || draft.account || defaultAcc,
        toAccount: draft.toAccount?._id || draft.toAccount || '',
        contact: draftContactId,
        linkedAdvance: draftLinkedAdv,
        category: draft.category || 'General',
        subcategory: draft.subcategory || '',
        description: draft.description || '',
        purpose: draft.purpose || '',
        paymentMethod: draft.paymentMethod || 'cash',
        referenceNumber: draft.referenceNumber || '',
        notes: draft.notes || '',
        isAdvance: Boolean(draft.isAdvance || draft.type === 'advance'),
        idempotencyKey: randomKey,
      });

      if (draftContactId) {
        fetchContactPayments(draftContactId);
      } else {
        setContactPayments([]);
      }

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
          paymentSourceType: draft.paymentSourceType || draft.materialDetails.paymentSourceType || (draftLinkedAdv ? 'contractor_advance' : 'direct_account'),
          contractor: draftContactId || draft.materialDetails.contractor || '',
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
          paymentSourceType: draftLinkedAdv ? 'contractor_advance' : 'direct_account',
          contractor: draftContactId,
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
        linkedAdvance: '',
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
      setContactPayments([]);
      setIsMaterialEntry(false);
      setMaterialForm({
        materialName: '',
        category: 'Civil Materials',
        unit: 'bag',
        quantity: '',
        ratePerUnit: '',
        vehicleNumber: '',
        challanNumber: '',
        paymentSourceType: 'direct_account',
        contractor: '',
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

    const isFromAdv =
      (isMaterialEntry && materialForm.paymentSourceType === 'contractor_advance') ||
      Boolean(formData.linkedAdvance);

    const chosenTxn = formData.linkedAdvance
      ? contactPayments.find((p) => p._id === formData.linkedAdvance)
      : null;

    if (isFromAdv) {
      const targetContact = materialForm.contractor || formData.contact;
      if (!targetContact) {
        setFormError(
          language === 'hi'
            ? 'कृपया ठेकेदार / व्यक्ति चुनें जिनके पहले दिए गए भुगतान/एडवांस में से यह राशि काटी जानी है।'
            : 'Please select contractor to deduct from advance.'
        );
        return;
      }

      const availableAdv = chosenTxn
        ? (chosenTxn.advanceDetails?.unsettledAmount !== undefined
            ? chosenTxn.advanceDetails.unsettledAmount
            : chosenTxn.amount - (chosenTxn.advanceDetails?.settledAmount || 0))
        : (contractorAdvanceMap[targetContact] || 0);

      if (availableAdv <= 0) {
        setFormError(
          language === 'hi'
            ? 'इस ठेकेदार के पास कोई बकाया/खुला एडवांस उपलब्ध नहीं है। कृपया सीधा भुगतान चुनें।'
            : 'This contractor has no available advance balance.'
        );
        return;
      }

      const totalAmt = Number(formData.amount) || 0;
      const remainderFromAccount = Math.max(0, totalAmt - availableAdv);

      // If advance is less than expense amount, remind to select account for remaining difference
      if (remainderFromAccount > 0 && !formData.account) {
        setFormError(
          language === 'hi'
            ? `एडवांस में ₹${availableAdv.toLocaleString('en-IN')} उपलब्ध है। बाकी बचा अंतर (₹${remainderFromAccount.toLocaleString('en-IN')}) काटने के लिए कृपया बैंक/रोकड़ खाता चुनें।`
            : `Please select account to deduct remaining ₹${remainderFromAccount.toLocaleString('en-IN')}.`
        );
        return;
      }
    } else if (!formData.account) {
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
      const contractorObj = contacts.find((c) => c._id === (materialForm.contractor || formData.contact));
      const contractorName = contractorObj?.name || '';

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
          paymentSourceType: isFromAdv ? 'contractor_advance' : (materialForm.paymentSourceType || 'direct_account'),
          isAdjustedFromAdvance: isFromAdv,
          contractor: isFromAdv ? (materialForm.contractor || formData.contact) : null,
          contractorName: contractorName,
        };
      }

      const defaultAcc = accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || '';
      const submissionPayload = {
        ...formData,
        account: formData.account || defaultAcc,
        contact: isFromAdv ? (materialForm.contractor || formData.contact) : formData.contact,
        linkedAdvance: formData.linkedAdvance || null,
        paymentSourceType: isFromAdv ? 'contractor_advance' : 'direct_account',
        isAdjustedFromAdvance: isFromAdv,
        contractor: isFromAdv ? (materialForm.contractor || formData.contact) : null,
        description:
          formData.description ||
          (isFromAdv
            ? `Material Inward: ${materialForm.materialName || 'सामग्री'} (ठेकेदार एडवांस से समायोजित - ${contractorName})`
            : ''),
      };

      if (isEditMode && editingTxnId) {
        const updatePayload = {
          ...submissionPayload,
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
          ...submissionPayload,
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
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isCancelled
                            ? t('cancelled')
                            : txn.isAdvance
                            ? (language === 'hi' ? 'पेशगी (एडवांस)' : 'Advance')
                            : getTypeLabel(txn.type)}
                        </span>
                        {txn.isAdvance && !isCancelled && (
                          <div className="text-[9px] text-amber-700 font-semibold mt-0.5">
                            {t('unsettled')}: {formatINR(txn.advanceDetails?.unsettledAmount ?? txn.amount)}
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
                        {txn.isAdjustedFromAdvance ? (
                          <div>
                            {txn.directPaidAmount > 0 ? (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-300">
                                  <Zap className="h-3 w-3 text-amber-600" />
                                  <span>{language === 'hi' ? '⚡ आंशिक एडवांस (Split)' : 'Split Advance'}</span>
                                </span>
                                <div className="text-[10px] text-amber-900 font-semibold mt-0.5 flex items-center gap-1">
                                  <span className="text-purple-700">Adv: {formatINR(txn.advanceDeductedAmount || (txn.amount - txn.directPaidAmount))}</span>
                                  <span>+</span>
                                  <span className="text-amber-800">खाता: {formatINR(txn.directPaidAmount)}</span>
                                </div>
                                <div className="text-[9px] text-slate-500 font-medium">
                                  {txn.account?.name || 'कंपनी खाता'}
                                </div>
                                {txn.contact && (
                                  <div className="text-[10px] text-slate-700 font-medium flex items-center gap-1 mt-0.5">
                                    <User className="h-3 w-3 text-slate-400" />
                                    <span>{txn.contact.name}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900 border border-purple-200">
                                  <HandCoins className="h-3 w-3 text-purple-700" />
                                  <span>{language === 'hi' ? 'ठेकेदार एडवांस से पूरा कटा' : 'Advance Adjusted'}</span>
                                </span>
                                {txn.contact && (
                                  <div className="text-[10px] text-purple-800 font-semibold flex items-center gap-1 mt-0.5">
                                    <User className="h-3 w-3" />
                                    <span>{txn.contact.name}</span>
                                  </div>
                                )}
                                <div className="text-[9px] text-purple-600 mt-0.5">
                                  {language === 'hi' ? '(बैंक/कैश से नहीं कटा)' : '(Not from bank)'}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
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
                        <div>{isInflow ? '+' : '-'} {formatINR(txn.amount)}</div>
                        {txn.isAdjustedFromAdvance && !isCancelled && (
                          <div className="text-[10px] font-normal mt-0.5">
                            {txn.directPaidAmount > 0 ? (
                              <div className="text-amber-800 font-semibold">
                                <span className="text-purple-700 font-bold">Adv: -{formatINR(txn.advanceDeductedAmount || (txn.amount - txn.directPaidAmount))}</span>
                                <br />
                                <span className="text-rose-600 font-bold">बजट: -{formatINR(txn.directPaidAmount)}</span>
                              </div>
                            ) : (
                              <span className="text-purple-600 font-medium">({language === 'hi' ? 'पूरा एडवांस से' : '100% advance'})</span>
                            )}
                          </div>
                        )}
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
                <div
                  onClick={() => setFormData((prev) => ({ ...prev, isAdvance: !prev.isAdvance }))}
                  className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition select-none ${
                    formData.isAdvance
                      ? 'border-amber-400 bg-amber-100/70 shadow-sm ring-2 ring-amber-300'
                      : 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    id="isAdvCheck"
                    checked={Boolean(formData.isAdvance)}
                    onChange={() => {}}
                    className="h-4 w-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer pointer-events-none"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <span>{t('markAdvance')}</span>
                      {formData.isAdvance && (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                          ✓ {language === 'hi' ? 'एडवांस चिह्नित' : 'Advance Active'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-amber-700 mt-0.5">{t('markAdvanceHint')}</div>
                  </div>
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

                      {/* Payment / Funding Source for this Material Inward */}
                      <div className="rounded-xl border border-amber-300 bg-white p-3 space-y-2.5">
                        <label className="block text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <HandCoins className="h-3.5 w-3.5 text-amber-700" />
                          <span>{language === 'hi' ? 'इसके पैसे किसपे गए / कहाँ से गए? *' : 'Payment / Funding Source *'}</span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setMaterialForm({
                                ...materialForm,
                                paymentSourceType: 'direct_account',
                                contractor: '',
                              })
                            }
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition ${
                              materialForm.paymentSourceType === 'direct_account'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-500'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                          >
                            <Wallet className="h-4 w-4 text-emerald-600 shrink-0" />
                            <div>
                              <div>{language === 'hi' ? 'सीधा कंपनी खाता (नया खर्च)' : 'Direct Company Payment'}</div>
                              <div className="text-[10px] text-slate-500 font-normal">
                                {language === 'hi' ? 'बैंक/कैश खाते से कटेगा' : 'Deducts from account'}
                              </div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMaterialForm({
                                ...materialForm,
                                paymentSourceType: 'contractor_advance',
                              })
                            }
                            className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition ${
                              materialForm.paymentSourceType === 'contractor_advance'
                                ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold ring-1 ring-purple-500'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                          >
                            <HandCoins className="h-4 w-4 text-purple-600 shrink-0" />
                            <div>
                              <div>{language === 'hi' ? 'ठेकेदार के पुराने एडवांस में से' : 'From Contractor Advance'}</div>
                              <div className="text-[10px] text-purple-700 font-normal">
                                {language === 'hi' ? 'बजट/बैंक से दोबारा नहीं कटेगा' : 'No double deduction'}
                              </div>
                            </div>
                          </button>
                        </div>

                        {/* When Contractor Advance is selected */}
                        {materialForm.paymentSourceType === 'contractor_advance' && (
                          <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-2.5 space-y-2.5">
                            <div>
                              <label className="block text-[11px] font-bold text-purple-950 mb-1">
                                {language === 'hi' ? 'ठेकेदार / व्यक्ति चुनें *' : 'Select Contractor *'}
                              </label>
                              <select
                                required
                                value={materialForm.contractor}
                                onChange={(e) => {
                                  const cId = e.target.value;
                                  setMaterialForm({ ...materialForm, contractor: cId });
                                  if (cId) {
                                    setFormData((f) => ({ ...f, contact: cId, linkedAdvance: '' }));
                                    fetchContactPayments(cId);
                                  }
                                }}
                                className="w-full rounded-lg border border-purple-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none"
                              >
                                <option value="">{language === 'hi' ? '-- ठेकेदार चुनें --' : '-- Select Contractor --'}</option>
                                {contacts.map((c) => {
                                  const advBal = contractorAdvanceMap[c._id] || 0;
                                  return (
                                    <option key={c._id} value={c._id}>
                                      {c.name} {c.role ? `(${c.role})` : ''} — {language === 'hi' ? 'उपलब्ध एडवांस:' : 'Adv:'} {formatINR(advBal)}
                                    </option>
                                  );
                                })}
                              </select>
                            </div>

                            {materialForm.contractor && (
                              <div>
                                <label className="block text-[11px] font-bold text-purple-950 mb-1 flex items-center justify-between">
                                  <span>{language === 'hi' ? 'किस एडवांस में से काटना है?' : 'Select Specific Advance (or Auto)'}</span>
                                  <span className="text-[10px] text-purple-700 font-normal">
                                    {language === 'hi' ? '(वैकल्पिक / Optional)' : '(Optional)'}
                                  </span>
                                </label>
                                <select
                                  value={formData.linkedAdvance || ''}
                                  onChange={(e) => setFormData((f) => ({ ...f, linkedAdvance: e.target.value }))}
                                  className="w-full rounded-lg border border-purple-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none"
                                >
                                  <option value="">
                                    {language === 'hi'
                                      ? `⚡ ऑटो-एडजस्ट (खुले एडवांस से काटें - कुल: ${formatINR(contractorAdvanceMap[materialForm.contractor] || 0)})`
                                      : `⚡ Auto-adjust from open advances (Total: ${formatINR(contractorAdvanceMap[materialForm.contractor] || 0)})`}
                                  </option>
                                  {contactPayments
                                    .filter((p) => {
                                      const un =
                                        p.advanceDetails?.unsettledAmount !== undefined
                                          ? p.advanceDetails.unsettledAmount
                                          : (p.amount - (p.advanceDetails?.settledAmount || 0));
                                      return (p.isAdvance || p.type === 'advance') && un > 0;
                                    })
                                    .map((p) => {
                                      const un =
                                        p.advanceDetails?.unsettledAmount !== undefined
                                          ? p.advanceDetails.unsettledAmount
                                          : (p.amount - (p.advanceDetails?.settledAmount || 0));
                                      const d = p.date
                                        ? new Date(p.date).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                          })
                                        : '';
                                      return (
                                        <option key={p._id} value={p._id}>
                                          📅 {d} — {p.transactionId} : मूल {formatINR(p.amount)} [शेष खुला: {formatINR(un)}]
                                        </option>
                                      );
                                    })}
                                </select>
                              </div>
                            )}

                            {materialForm.contractor && (() => {
                              const chosenAdv = formData.linkedAdvance
                                ? contactPayments.find((p) => p._id === formData.linkedAdvance)
                                : null;
                              const availableForDeduction = chosenAdv
                                ? (chosenAdv.advanceDetails?.unsettledAmount !== undefined
                                    ? chosenAdv.advanceDetails.unsettledAmount
                                    : chosenAdv.amount - (chosenAdv.advanceDetails?.settledAmount || 0))
                                : (contractorAdvanceMap[materialForm.contractor] || 0);
                              const cost = Number(formData.amount) || 0;
                              const fromAdv = Math.min(availableForDeduction, cost);
                              const fromAccount = Math.max(0, cost - availableForDeduction);
                              const remAfter = Math.max(0, availableForDeduction - cost);
                              const selectedAccountObj = accounts.find((a) => a._id === formData.account);

                              return (
                                <div className="space-y-2">
                                  <div className="bg-white rounded-lg p-2.5 border border-purple-200 text-xs space-y-1.5 shadow-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-600">
                                        {chosenAdv
                                          ? (language === 'hi' ? 'चुने गए एडवांस का खुला बैलेंस:' : 'Selected Advance Balance:')
                                          : (language === 'hi' ? 'ठेकेदार के पास कुल उपलब्ध एडवांस:' : 'Contractor Total Open Adv:')}
                                      </span>
                                      <span className="font-bold text-purple-900">
                                        {formatINR(availableForDeduction)}
                                      </span>
                                    </div>

                                    {cost > 0 && fromAccount === 0 && (
                                      <>
                                        <div className="flex items-center justify-between text-purple-900">
                                          <span>{language === 'hi' ? 'सामान का खर्च (एडवांस से पूरा कटेगा):' : 'Material Cost (Full from Adv):'}</span>
                                          <span className="font-bold">- {formatINR(cost)}</span>
                                        </div>
                                        <div className="pt-1 border-t border-purple-100 flex items-center justify-between">
                                          <span className="font-bold text-slate-800">{language === 'hi' ? 'बाकी बचेगा एडवांस:' : 'Remaining Adv:'}</span>
                                          <span className="font-black text-emerald-700">
                                            {formatINR(remAfter)}
                                          </span>
                                        </div>
                                        <div className="rounded bg-emerald-50 p-1.5 text-[10px] text-emerald-900 font-medium flex items-center gap-1.5 mt-1 border border-emerald-100">
                                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                          <span>
                                            {language === 'hi'
                                              ? '✓ यह पूरी राशि ठेकेदार के एडवांस से कटेगी। कंपनी बैंक/कैश खाते से कुछ नहीं कटेगा।'
                                              : '✓ Fully covered by advance. No double deduction from accounts.'}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  {/* Split Payment Card if material cost exceeds available advance */}
                                  {cost > 0 && fromAccount > 0 && (
                                    <div className="rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/50 p-3 space-y-2 text-xs shadow-xs">
                                      <div className="flex items-center justify-between font-bold text-amber-950 text-[11px] pb-1 border-b border-amber-200">
                                        <span className="flex items-center gap-1.5">
                                          <Zap className="h-4 w-4 text-amber-600 shrink-0" />
                                          <span>{language === 'hi' ? '⚡ आंशिक एडवांस समायोजन (Split Payment)' : '⚡ Split Advance + Account Payment'}</span>
                                        </span>
                                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-extrabold text-amber-900">
                                          {language === 'hi' ? 'एडवांस कम है' : 'Advance insufficient'}
                                        </span>
                                      </div>

                                      <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-slate-700 font-medium">
                                          <span>{language === 'hi' ? 'कुल सामान की रकम:' : 'Total Cost:'}</span>
                                          <span className="font-black text-slate-900">{formatINR(cost)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-purple-900 font-semibold bg-purple-100/70 px-2 py-1 rounded-md">
                                          <span>🟣 {language === 'hi' ? 'ठेकेदार के बचे एडवांस से कटेगा:' : 'Deducted from Advance:'}</span>
                                          <span className="font-extrabold text-purple-950">- {formatINR(fromAdv)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-blue-900 font-semibold bg-blue-100/70 px-2 py-1 rounded-md">
                                          <span>🔵 {language === 'hi' ? 'बाकी अंतर मुख्य बजट / खाते से कटेगा:' : 'From Bank/Cash Account (Main Budget):'}</span>
                                          <span className="font-extrabold text-blue-950">- {formatINR(fromAccount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-1 text-[11px] font-bold text-slate-600">
                                          <span>{language === 'hi' ? 'ठेकेदार का शेष एडवांस बचेगा:' : 'Contractor Rem. Adv:'}</span>
                                          <span className="font-black text-emerald-700">₹0 (हिसाब चुकता)</span>
                                        </div>
                                      </div>

                                      <div className="rounded-lg bg-amber-100/80 p-2 text-[10px] text-amber-950 font-medium leading-relaxed border border-amber-300/60">
                                        {language === 'hi'
                                          ? `💡 ठेकेदार के पास उपलब्ध ₹${fromAdv.toLocaleString('en-IN')} का एडवांस पूरा कट जाएगा (एडवांस शेष: ₹0)। बाकी बचा ₹${fromAccount.toLocaleString('en-IN')} आपके चुने गए खाते (${selectedAccountObj?.name || 'रोकड़/बैंक'}) से कटकर प्रोजेक्ट बजट में दर्ज होगा।`
                                          : `💡 ₹${fromAdv.toLocaleString('en-IN')} settled from advance. Balance ₹${fromAccount.toLocaleString('en-IN')} will be deducted from ${selectedAccountObj?.name || 'account'} and added to project expenses.`}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Accounts & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  {(() => {
                    const isAdvAdj = Boolean(formData.linkedAdvance || (isMaterialEntry && materialForm.paymentSourceType === 'contractor_advance'));
                    const targetContact = materialForm.contractor || formData.contact;
                    const chosenAdv = formData.linkedAdvance ? contactPayments.find((p) => p._id === formData.linkedAdvance) : null;
                    const availableAdv = chosenAdv
                      ? (chosenAdv.advanceDetails?.unsettledAmount !== undefined
                          ? chosenAdv.advanceDetails.unsettledAmount
                          : chosenAdv.amount - (chosenAdv.advanceDetails?.settledAmount || 0))
                      : (contractorAdvanceMap[targetContact] || 0);
                    const cost = Number(formData.amount) || 0;
                    const isSplit = isAdvAdj && cost > availableAdv && availableAdv > 0;
                    const splitRemainder = Math.max(0, cost - availableAdv);

                    return (
                      <>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                          <span>{t('sourceAccount')} *</span>
                          {isAdvAdj && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isSplit
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-purple-100 text-purple-700 border-purple-200'
                            }`}>
                              {isSplit
                                ? (language === 'hi' ? `⚡ केवल ₹${splitRemainder.toLocaleString('en-IN')} खाते से कटेगा` : `⚡ ₹${splitRemainder.toLocaleString('en-IN')} from account`)
                                : (language === 'hi' ? '✓ बैंक/रोकड़ से नहीं कटेगा (एडवांस से समायोजित)' : '✓ Balance untouched')}
                            </span>
                          )}
                        </label>
                        <select
                          required
                          value={formData.account}
                          onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                          className={`w-full rounded-xl border px-3 py-2.5 text-xs outline-none ${
                            isAdvAdj
                              ? (isSplit
                                  ? 'border-amber-400 bg-amber-50/40 text-slate-900 font-semibold focus:border-amber-500'
                                  : 'border-purple-300 bg-purple-50/50 text-purple-950 font-semibold')
                              : 'border-slate-200 text-slate-800 focus:border-blue-600'
                          }`}
                        >
                          <option value="">{t('selectAccount')}</option>
                          {accounts.map((acc) => (
                            <option key={acc._id} value={acc._id}>
                              {acc.name} — {t('balance')}: {formatINR(acc.currentBalance)}
                            </option>
                          ))}
                        </select>
                        {isAdvAdj && (
                          <p className={`text-[10px] mt-1 font-medium ${isSplit ? 'text-amber-800 font-bold' : 'text-purple-700'}`}>
                            {isSplit
                              ? (language === 'hi'
                                  ? `✓ कुल ₹${cost.toLocaleString('en-IN')} में से ₹${availableAdv.toLocaleString('en-IN')} एडवांस से कट गया, केवल शेष ₹${splitRemainder.toLocaleString('en-IN')} इस खाते से कटेगा।`
                                  : `✓ ₹${availableAdv.toLocaleString('en-IN')} covered by advance. Remaining ₹${splitRemainder.toLocaleString('en-IN')} will be deducted from this account.`)
                              : (language === 'hi'
                                  ? '✓ यह पूरी राशि ठेकेदार के पिछले एडवांस से कटेगी। बैंक/कैश खाते से कुछ नहीं कटेगा।'
                                  : '✓ Fully covered by contractor advance. Bank/cash balance untouched.')}
                          </p>
                        )}
                      </>
                    );
                  })()}
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
                      onChange={(e) => handleContactChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600 font-semibold"
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

              {/* Side-by-side or Dedicated dropdown for Person's Past Transactions */}
              {formData.contact &&
                formData.type !== 'transfer' &&
                formData.type !== 'income' &&
                !(isMaterialEntry && materialForm.paymentSourceType === 'contractor_advance') && (
                <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/40 p-3.5 space-y-3 transition-all animate-in fade-in duration-200 shadow-sm">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-5">
                      <label className="block text-xs font-bold text-purple-950 mb-0.5 flex items-center gap-1.5">
                        <HandCoins className="h-4 w-4 text-purple-600 shrink-0" />
                        <span>
                          {language === 'hi'
                            ? `${contacts.find((c) => c._id === formData.contact)?.name || 'व्यक्ति'} का पिछला भुगतान चुनें`
                            : `Select ${contacts.find((c) => c._id === formData.contact)?.name || 'Contact'}'s Past Payment`}
                        </span>
                      </label>
                      <p className="text-[11px] text-purple-700">
                        {language === 'hi'
                          ? 'चुनें कि इस मटेरियल के पैसे इनमें से किस पिछले भुगतान में से दिए गए हैं:'
                          : 'Select which past payment was used to fund this material:'}
                      </p>
                    </div>

                    <div className="sm:col-span-7">
                      <select
                        value={formData.linkedAdvance || ''}
                        onChange={(e) => handleLinkedTxnSelect(e.target.value)}
                        className="w-full rounded-xl border-2 border-purple-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-200 shadow-sm"
                      >
                        <option value="">
                          {language === 'hi'
                            ? '➕ नया अलग खर्च / भुगतान (सीधे खाते से कटेगा)'
                            : '➕ Direct New Expense (Deduct from bank/cash account)'}
                        </option>
                        {contactPayments.map((p) => {
                          const dateStr = p.date
                            ? new Date(p.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '';
                          const typeLabel =
                            p.type === 'advance' || p.isAdvance
                              ? (language === 'hi' ? 'एडवांस' : 'Advance')
                              : (language === 'hi' ? 'पेमेंट' : 'Payment');
                          const accName = p.account?.name || (language === 'hi' ? 'खाता' : 'Account');
                          const unsettled =
                            p.advanceDetails?.unsettledAmount !== undefined
                              ? p.advanceDetails.unsettledAmount
                              : p.amount;
                          const desc = p.description ? ` — "${p.description}"` : '';

                          return (
                            <option key={p._id} value={p._id}>
                              📅 {dateStr} — ₹{Number(p.amount).toLocaleString('en-IN')} ({typeLabel} via {accName}) [शेष: ₹{Number(unsettled).toLocaleString('en-IN')}]{desc}
                            </option>
                          );
                        })}
                      </select>
                      {contactPayments.length === 0 && !loadingContactPayments && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          {language === 'hi'
                            ? 'इस व्यक्ति का कोई पिछला भुगतान रिकॉर्ड नहीं मिला। नया खर्च सीधे बैंक/कैश खाते से कटेगा।'
                            : 'No past payments found for this person.'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Selected Linked Transaction Live Breakdown */}
                  {formData.linkedAdvance && (
                    (() => {
                      const selectedTxn = contactPayments.find((p) => p._id === formData.linkedAdvance);
                      if (!selectedTxn) return null;
                      const availableAmount =
                        selectedTxn.advanceDetails?.unsettledAmount !== undefined
                          ? selectedTxn.advanceDetails.unsettledAmount
                          : selectedTxn.amount;
                      const enteredAmount = Number(formData.amount) || 0;
                      const remainingAfter = availableAmount - enteredAmount;

                      return (
                        <div className="rounded-xl border border-purple-200 bg-white p-3 space-y-2 text-xs">
                          <div className="flex items-center justify-between pb-1.5 border-b border-purple-100">
                            <span className="text-slate-600 font-medium">
                              {language === 'hi' ? 'चुना गया पिछला भुगतान:' : 'Selected Past Payment:'}
                            </span>
                            <span className="font-extrabold text-purple-900">
                              ₹{Number(selectedTxn.amount).toLocaleString('en-IN')}
                              <span className="text-[11px] font-normal text-slate-500 ml-1">
                                ({selectedTxn.account?.name || ''})
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-600">
                              {language === 'hi' ? 'उपलब्ध शेष रकम (Unsettled):' : 'Available Unsettled:'}
                            </span>
                            <span className="font-bold text-slate-800">
                              ₹{Number(availableAmount).toLocaleString('en-IN')}
                            </span>
                          </div>

                          {enteredAmount > 0 && (
                            <>
                              <div className="flex items-center justify-between text-rose-600">
                                <span>{language === 'hi' ? 'इस मटेरियल/खर्च की रकम:' : 'This Expense:'}</span>
                                <span className="font-bold">- ₹{Number(enteredAmount).toLocaleString('en-IN')}</span>
                              </div>
                              <div className="pt-1 border-t border-purple-100 flex items-center justify-between">
                                <span className="font-bold text-slate-800">
                                  {language === 'hi' ? 'बाकी बचेगा एडवांस:' : 'Remaining Advance:'}
                                </span>
                                <span
                                  className={`font-black ${
                                    remainingAfter < 0 ? 'text-rose-600' : 'text-emerald-700'
                                  }`}
                                >
                                  ₹{Number(remainingAfter).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </>
                          )}

                          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-[11px] text-emerald-900 font-medium flex items-center gap-1.5 mt-1">
                            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span>
                              {language === 'hi'
                                ? 'यह राशि चुने गए पिछले भुगतान (₹' + Number(selectedTxn.amount).toLocaleString('en-IN') + ') से माइनस होगी। कंपनी बैंक/कैश बैलेंस से दोबारा नहीं कटेगी!'
                                : 'Deducted from selected payment. No double deduction from company accounts!'}
                            </span>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

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

              {activeTxn.isAdjustedFromAdvance && (
                activeTxn.directPaidAmount > 0 ? (
                  <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-4 space-y-3">
                    <div className="font-bold text-amber-950 flex items-center justify-between text-xs border-b border-amber-200 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <span>{language === 'hi' ? '⚡ आंशिक एडवांस भुगतान (Split Advance Payment)' : 'Partial Advance Split Payment'}</span>
                      </div>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Split Payment</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-white/90 rounded-xl p-2.5 border border-purple-200">
                        <div className="text-[10px] text-purple-700 font-semibold flex items-center justify-center gap-1">
                          <HandCoins className="h-3 w-3 text-purple-600" />
                          <span>{language === 'hi' ? 'ठेकेदार एडवांस से कटा' : 'From Advance'}</span>
                        </div>
                        <div className="text-sm font-black text-purple-900 mt-0.5">
                          {formatINR(activeTxn.advanceDeductedAmount || (activeTxn.amount - activeTxn.directPaidAmount))}
                        </div>
                        <div className="text-[9px] text-purple-600">{activeTxn.contact?.name || 'ठेकेदार'}</div>
                      </div>

                      <div className="bg-white/90 rounded-xl p-2.5 border border-amber-300">
                        <div className="text-[10px] text-amber-800 font-semibold flex items-center justify-center gap-1">
                          <Building className="h-3 w-3 text-amber-600" />
                          <span>{language === 'hi' ? 'कंपनी खाते/बजट से कटा' : 'From Bank/Budget'}</span>
                        </div>
                        <div className="text-sm font-black text-amber-950 mt-0.5">
                          {formatINR(activeTxn.directPaidAmount)}
                        </div>
                        <div className="text-[9px] text-amber-700">{activeTxn.account?.name || 'कंपनी खाता'}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-amber-900 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-amber-200/60">
                      {language === 'hi' ? (
                        <>
                          ठेकेदार के पास केवल <strong>{formatINR(activeTxn.advanceDeductedAmount || (activeTxn.amount - activeTxn.directPaidAmount))}</strong> का एडवांस शेष था, इसलिए वह एडवांस पूरा खप गया (0 हो गया)। बाकी बचे <strong>{formatINR(activeTxn.directPaidAmount)}</strong> कंपनी के <strong>{activeTxn.account?.name || 'खाते'}</strong> (मुख्य बजट) से काटे गए हैं।
                        </>
                      ) : (
                        <>
                          Contractor had only <strong>{formatINR(activeTxn.advanceDeductedAmount || (activeTxn.amount - activeTxn.directPaidAmount))}</strong> in advance, which was fully exhausted. Remaining <strong>{formatINR(activeTxn.directPaidAmount)}</strong> was paid directly from <strong>{activeTxn.account?.name || 'account'}</strong> (main budget).
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-3.5 space-y-2">
                    <div className="font-bold text-purple-950 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <HandCoins className="h-4 w-4 text-purple-600" />
                        <span>{language === 'hi' ? 'ठेकेदार एडवांस से पूरा समायोजित (नो डबल डिडक्शन)' : '100% Adjusted from Contractor Advance'}</span>
                      </div>
                      <span className="text-[10px] bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">100% Advance</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center my-1.5">
                      <div className="bg-white/90 rounded-xl p-2 border border-purple-200">
                        <div className="text-[10px] text-purple-700 font-semibold">{language === 'hi' ? 'एडवांस से कटा' : 'From Advance'}</div>
                        <div className="text-sm font-black text-purple-900">{formatINR(activeTxn.amount)}</div>
                      </div>
                      <div className="bg-white/90 rounded-xl p-2 border border-slate-200">
                        <div className="text-[10px] text-slate-500 font-semibold">{language === 'hi' ? 'बैंक/बजट से कटौती' : 'Bank/Budget Deduction'}</div>
                        <div className="text-sm font-black text-slate-400">₹0 (शून्य)</div>
                      </div>
                    </div>

                    <p className="text-[11px] text-purple-800 leading-relaxed">
                      {language === 'hi'
                        ? `यह खर्च ठेकेदार (${activeTxn.contact?.name || 'ठेकेदार'}) को पहले दिए गए एडवांस से पूरा काटा गया है। कंपनी के बैंक/रोकड़ खाते या मुख्य बजट से दोबारा कोई कटौती नहीं हुई है।`
                        : `This expense was fully settled from contractor's advance. No double deduction from bank or main project budget.`}
                    </p>
                  </div>
                )
              )}

              {/* Advance details & settlements breakdown */}
              {(activeTxn.isAdvance || activeTxn.type === 'advance') && (() => {
                const advRec = advances.find((a) => a._id === activeTxn._id);
                const settledAmt = activeTxn.advanceDetails?.settledAmount || advRec?.advanceDetails?.settledAmount || 0;
                const unsettledAmt = activeTxn.advanceDetails?.unsettledAmount ?? advRec?.advanceDetails?.unsettledAmount ?? (activeTxn.amount - settledAmt);
                const settlementsList = advRec?.settlements || [];

                return (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2.5">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                      <HandCoins className="h-4 w-4 text-amber-600" />
                      <span>{language === 'hi' ? 'पेशगी (एडवांस) एवं खर्च हिसाब' : 'Advance & Settlement Breakdown'}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-white rounded-xl p-2.5 border border-amber-200 text-center">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">{language === 'hi' ? 'मूल एडवांस' : 'Original Adv'}</div>
                        <div className="text-xs font-black text-slate-900">{formatINR(activeTxn.amount)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-emerald-600 font-semibold">{language === 'hi' ? 'खर्च में चुकता' : 'Settled'}</div>
                        <div className="text-xs font-black text-emerald-700">{formatINR(settledAmt)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-amber-700 font-semibold">{language === 'hi' ? 'बकाया खुला' : 'Unsettled'}</div>
                        <div className="text-xs font-black text-amber-800">{formatINR(unsettledAmt)}</div>
                      </div>
                    </div>

                    {settlementsList.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-bold text-slate-700">
                          {language === 'hi' ? `इस एडवांस में से हुआ खर्च (${settlementsList.length}):` : `Settlements from this advance (${settlementsList.length}):`}
                        </div>
                        {settlementsList.map((s, idx) => (
                          <div key={s._id || idx} className="bg-white rounded-lg p-2 border border-slate-200 text-[11px] space-y-0.5 shadow-xs">
                            <div className="flex justify-between items-center font-bold">
                              <span className="text-emerald-700">✓ {formatINR(s.settledAmount)}</span>
                              <span className="text-slate-400 text-[10px] font-normal">{formatDateTime(s.settledAt)}</span>
                            </div>
                            {s.notes && <div className="text-slate-600 italic">"{s.notes}"</div>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

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
