import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import { TransactionReceiptModal } from '../components/modals/TransactionReceiptModal';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  CreditCard,
  Eye,
  FileText,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  HandCoins,
  Pencil,
  Trash2,
  Printer,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  LayoutGrid,
  ListFilter,
  ArrowRight,
} from 'lucide-react';

export const ContactsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProject } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState('payments'); // 'payments' (किसको कितना गया) or 'directory' (कार्ड्स)
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedContactData, setSelectedContactData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedReceiptTxn, setSelectedReceiptTxn] = useState(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  // Detail Modal Date Filter
  const [ledgerDateStart, setLedgerDateStart] = useState('');
  const [ledgerDateEnd, setLedgerDateEnd] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'contractor',
    companyName: '',
    address: '',
    gstin: '',
    bankDetails: { bankName: '', accountNumber: '', ifsc: '', upiId: '' },
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openAddModal();
      searchParams.delete('add');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const loadContacts = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (search) params.search = search;
      if (dateStart) params.startDate = dateStart;
      if (dateEnd) params.endDate = dateEnd;

      const res = await api.getContacts(params);
      if (res.success) {
        setContacts(res.data);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, [activeProject?._id, roleFilter, search, dateStart, dateEnd]);

  const openAddModal = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      role: 'contractor',
      companyName: '',
      address: '',
      gstin: '',
      bankDetails: { bankName: '', accountNumber: '', ifsc: '', upiId: '' },
      notes: '',
    });
    setError('');
    setAddModalOpen(true);
  };

  const openEditModal = (contact) => {
    setEditingContactId(contact._id);
    setFormData({
      name: contact.name || '',
      phone: contact.phone || '',
      email: contact.email || '',
      role: contact.role || 'contractor',
      companyName: contact.companyName || '',
      address: contact.address || '',
      gstin: contact.gstin || '',
      bankDetails: {
        bankName: contact.bankDetails?.bankName || '',
        accountNumber: contact.bankDetails?.accountNumber || '',
        ifsc: contact.bankDetails?.ifsc || '',
        upiId: contact.bankDetails?.upiId || '',
      },
      notes: contact.notes || '',
    });
    setError('');
    setEditModalOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(language === 'hi' ? 'कृपया नाम दर्ज करें।' : 'Please provide a name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.createContact(formData);
      if (res.success) {
        setAddModalOpen(false);
        await loadContacts();
      }
    } catch (err) {
      setError(err.message || 'Failed to create contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError(language === 'hi' ? 'कृपया नाम दर्ज करें।' : 'Please provide a name.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.updateContact(editingContactId, formData);
      if (res.success) {
        setEditModalOpen(false);
        setEditingContactId(null);
        await loadContacts();
      }
    } catch (err) {
      setError(err.message || 'Failed to update contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (id, name) => {
    const confirmMsg =
      language === 'hi'
        ? `क्या आप वास्तव में "${name}" को हटाना चाहते हैं?`
        : `Are you sure you want to delete "${name}"?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.deleteContact(id);
      if (res.success) {
        await loadContacts();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete contact.');
    }
  };

  const viewContactDetails = async (id, customStart = '', customEnd = '') => {
    try {
      setLoadingDetail(true);
      setDetailModalOpen(true);
      const params = {};
      if (customStart) params.startDate = customStart;
      if (customEnd) params.endDate = customEnd;

      const res = await api.getContact(id, params);
      if (res.success) {
        setSelectedContactData(res.data);
      }
    } catch (err) {
      console.error('Failed to load contact ledger:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleFilterLedger = (start, end) => {
    setLedgerDateStart(start);
    setLedgerDateEnd(end);
    if (selectedContactData?.contact?._id) {
      viewContactDetails(selectedContactData.contact._id, start, end);
    }
  };

  // Cumulative Metrics Across All Contacts
  const totalMoneyPaidAll = contacts.reduce((sum, c) => sum + (c.summary?.totalPaid || 0), 0);
  const totalUnsettledAdvances = contacts.reduce((sum, c) => sum + (c.summary?.unsettledAdvances || 0), 0);
  const totalPendingBills = contacts.reduce((sum, c) => sum + (c.summary?.pendingBillsAmount || 0), 0);
  const totalTransactionsCount = contacts.reduce((sum, c) => sum + (c.summary?.transactionCount || 0), 0);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'contractor':
        return { label: language === 'hi' ? 'ठेकेदार' : 'Contractor', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'labour':
        return { label: language === 'hi' ? 'मजदूर / मिस्त्री' : 'Labour / Mistri', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'supplier':
        return { label: language === 'hi' ? 'सामग्री सप्लायर' : 'Supplier', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'service_provider':
        return { label: language === 'hi' ? 'सेवा प्रदाता' : 'Service', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'customer':
        return { label: language === 'hi' ? 'ग्राहक' : 'Customer', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: language === 'hi' ? 'अन्य' : 'Other', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            <span>
              {language === 'hi'
                ? 'व्यक्ति व पार्टी खाता — किसको कितना पैसा गया'
                : 'People & Parties — Person-wise Payments & Ledger'}
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'hi'
              ? 'देखें किस बन्दे या पार्टी को कुल कितना रुपया दिया गया, तारीख के साथ पूरी रसीद व खाता'
              : 'Track exact total money paid to each contractor, labourer, or supplier with date-wise ledgers'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
            title="Print Summary"
          >
            <Printer className="h-4 w-4" />
            <span>{t('print')}</span>
          </button>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>{t('addContact')}</span>
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'payments'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>
            {language === 'hi'
              ? '💰 किस व्यक्ति को कितना पैसा गया (भुगतान सारांश)'
              : '💰 Person-wise Payments Summary'}
          </span>
          <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] ml-1">
            {contacts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition ${
            activeTab === 'directory'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <LayoutGrid className="h-4 w-4" />
          <span>{language === 'hi' ? '👥 संपर्क डायरेक्टरी व कार्ड्स' : '👥 Contacts Directory'}</span>
        </button>
      </div>

      {/* TOP KPI SUMMARY BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
            {language === 'hi' ? 'कुल दिया गया रुपया (सभी व्यक्तियों को)' : 'Total Money Paid to People'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-blue-950 mt-1">
            {formatINR(totalMoneyPaidAll)}
          </div>
          <p className="text-xs text-blue-800 mt-1">
            {language === 'hi'
              ? `${contacts.length} पार्टियों / ठेकेदारों को कुल भुगतान`
              : `Disbursed across ${contacts.length} payees`}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
            {language === 'hi' ? 'चालू अग्रिम / पेशगी (Unsettled)' : 'Active Unsettled Advances'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-amber-950 mt-1">
            {formatINR(totalUnsettledAdvances)}
          </div>
          <p className="text-xs text-amber-800 mt-1">
            {language === 'hi' ? 'मजदूरों/कारीगरों को दी गई पेशगी' : 'Advance cash with workers/vendors'}
          </p>
        </div>

        <div className="rounded-3xl border border-purple-200 bg-purple-50/70 p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">
            {language === 'hi' ? 'कुल बाकी बिल देनदारी (Pending Dues)' : 'Total Pending Due Amount'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-purple-950 mt-1">
            {formatINR(totalPendingBills)}
          </div>
          <p className="text-xs text-purple-800 mt-1">
            {language === 'hi' ? 'सप्लायरों व वेंडरों के बकाया बिल' : 'Unpaid balance on bills'}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            {language === 'hi' ? 'कुल भुगतान प्रविष्टियां' : 'Total Payment Entries'}
          </span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            {totalTransactionsCount}{' '}
            <span className="text-base font-semibold text-slate-500">
              {language === 'hi' ? 'बार' : 'txns'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'hi' ? 'प्रोजेक्ट खाते से किए गए भुगतान' : 'Total payment vouchers logged'}
          </p>
        </div>
      </div>

      {/* FILTER AND SEARCH BAR (WITH DATE RANGE) */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              language === 'hi'
                ? 'बंदे का नाम, फ़ोन या कंपनी से खोजें...'
                : 'Search by person name, phone, or company...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 shadow-sm"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm font-medium"
        >
          <option value="">{language === 'hi' ? 'सभी श्रेणियां' : 'All Roles'}</option>
          <option value="contractor">{language === 'hi' ? 'ठेकेदार (Contractor)' : 'Contractor'}</option>
          <option value="supplier">{language === 'hi' ? 'सप्लायर (Supplier)' : 'Material Supplier'}</option>
          <option value="labour">{language === 'hi' ? 'मजदूर / कारीगर (Labour)' : 'Labour / Mistri'}</option>
          <option value="service_provider">{language === 'hi' ? 'सेवा प्रदाता' : 'Service Provider'}</option>
          <option value="customer">{language === 'hi' ? 'ग्राहक' : 'Customer'}</option>
          <option value="other">{language === 'hi' ? 'अन्य' : 'Other'}</option>
        </select>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-2.5 py-1.5 shadow-sm">
            <span className="text-[10px] text-slate-400 font-semibold">{t('from')}:</span>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="text-xs text-slate-800 outline-none bg-transparent"
              title="Start Payment Date"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-2.5 py-1.5 shadow-sm">
            <span className="text-[10px] text-slate-400 font-semibold">{t('to')}:</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="text-xs text-slate-800 outline-none bg-transparent"
              title="End Payment Date"
            />
          </div>
          {(dateStart || dateEnd || search || roleFilter) && (
            <button
              onClick={() => {
                setDateStart('');
                setDateEnd('');
                setSearch('');
                setRoleFilter('');
              }}
              className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-100"
              title="Clear Filters"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ================= TAB 1: PERSON-WISE PAYMENTS SUMMARY TABLE ================= */}
      {activeTab === 'payments' && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span>
                  {language === 'hi'
                    ? 'पार्टी-वार कुल भुगतान रजिस्टर (किसको कितना गया)'
                    : 'Party-wise Cumulative Payments Register'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {dateStart || dateEnd
                  ? language === 'hi'
                    ? `तारीख फ़िल्टर: ${dateStart || 'प्रारंभ'} से ${dateEnd || 'अब तक'}`
                    : `Filtered: ${dateStart || 'Start'} to ${dateEnd || 'Present'}`
                  : language === 'hi'
                  ? 'सभी प्रविष्टियों का कुल योग एवं तारीख-वार भुगतान खाता'
                  : 'All-time cumulative disbursements and breakdown'}
              </p>
            </div>

            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {contacts.length} {language === 'hi' ? 'व्यक्ति / पार्टियां' : 'Recipients'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-4 py-3">{language === 'hi' ? 'व्यक्ति / पार्टी का नाम' : 'Person / Party'}</th>
                  <th className="px-4 py-3">{language === 'hi' ? 'श्रेणी' : 'Role'}</th>
                  <th className="px-4 py-3 text-right">
                    {language === 'hi' ? 'कुल दिया गया पैसा' : 'Total Money Paid'}
                  </th>
                  <th className="px-4 py-3 text-right">
                    {language === 'hi' ? 'अग्रिम / पेशगी' : 'Advance (Unsettled)'}
                  </th>
                  <th className="px-4 py-3 text-right">{language === 'hi' ? 'कुल बिल' : 'Total Bills'}</th>
                  <th className="px-4 py-3 text-right">{language === 'hi' ? 'बकाया बिल' : 'Pending Due'}</th>
                  <th className="px-4 py-3">{language === 'hi' ? 'आखिरी भुगतान तारीख' : 'Last Payment Date'}</th>
                  <th className="px-4 py-3 text-center">{language === 'hi' ? 'भुगतान संख्या' : 'Entries'}</th>
                  <th className="px-4 py-3 text-center">{language === 'hi' ? 'तारीख-वार खाता' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                    </td>
                  </tr>
                ) : contacts.length > 0 ? (
                  contacts.map((c) => {
                    const sum = c.summary || {};
                    const roleBadge = getRoleBadge(c.role);
                    return (
                      <tr key={c._id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">{c.name}</span>
                            {c.companyName && (
                              <span className="text-[11px] text-slate-500 font-normal flex items-center gap-1">
                                <Building className="h-3 w-3 text-slate-400" />
                                {c.companyName}
                              </span>
                            )}
                            {c.phone && (
                              <span className="text-[10px] text-slate-400 font-normal">{c.phone}</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${roleBadge.bg}`}
                          >
                            {roleBadge.label}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="inline-block bg-blue-50/80 px-2.5 py-1 rounded-xl border border-blue-200">
                            <span className="text-xs sm:text-sm font-black text-blue-900">
                              {formatINR(sum.totalPaid || 0)}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap font-semibold">
                          <span className={sum.unsettledAdvances > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                            {formatINR(sum.unsettledAdvances || 0)}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap text-slate-700 font-semibold">
                          {formatINR(sum.totalBills || 0)}
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span
                            className={
                              sum.pendingBillsAmount > 0
                                ? 'text-purple-700 font-black'
                                : 'text-slate-400 font-medium'
                            }
                          >
                            {formatINR(sum.pendingBillsAmount || 0)}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium text-[11px]">
                          {sum.lastPaymentDate ? (
                            <div>
                              <div>{formatDate(sum.lastPaymentDate)}</div>
                              {sum.lastPaymentAmount > 0 && (
                                <div className="text-[10px] text-slate-400">
                                  ({formatINR(sum.lastPaymentAmount)})
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center whitespace-nowrap font-bold text-slate-700">
                          {sum.transactionCount || 0}
                        </td>

                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => viewContactDetails(c._id)}
                              className="flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                              title={language === 'hi' ? 'तारीख-वार खाता देखें' : 'View Date-wise Ledger'}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>{language === 'hi' ? 'तारीख-वार खाता' : 'Ledger'}</span>
                            </button>

                            <button
                              onClick={() => openEditModal(c)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                              title={t('edit')}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteContact(c._id, c.name)}
                              className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              title={t('delete')}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-slate-400">
                      {language === 'hi'
                        ? 'कोई व्यक्ति या भुगतान रिकॉर्ड नहीं मिला। ऊपर "नया व्यक्ति जोड़ें" पर क्लिक करें।'
                        : 'No contacts or payment records found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 2: CONTACT CARDS DIRECTORY ================= */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : contacts.length > 0 ? (
            contacts.map((c) => {
              const sum = c.summary || {};
              const roleBadge = getRoleBadge(c.role);
              return (
                <div
                  key={c._id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{c.name}</h3>
                        {c.companyName && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Building className="h-3 w-3 text-slate-400" />
                            <span>{c.companyName}</span>
                          </div>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${roleBadge.bg}`}
                      >
                        {roleBadge.label}
                      </span>
                    </div>

                    {c.phone && (
                      <div className="mt-2 text-xs text-slate-600 flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    )}

                    {/* Summary Metric Pills */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {language === 'hi' ? 'कुल दिया गया' : 'Total Paid'}
                        </span>
                        <span className="font-bold text-blue-900">{formatINR(sum.totalPaid)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {language === 'hi' ? 'बाकी पेशगी' : 'Unsettled Adv.'}
                        </span>
                        <span className="font-bold text-amber-700">{formatINR(sum.unsettledAdvances)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {language === 'hi' ? 'कुल बिल' : 'Total Bills'}
                        </span>
                        <span className="font-bold text-slate-900">{formatINR(sum.totalBills)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">
                          {language === 'hi' ? 'बकाया बिल' : 'Pending Due'}
                        </span>
                        <span className="font-bold text-purple-700">{formatINR(sum.pendingBillsAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer: View, Edit, Delete */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {sum.transactionCount || 0} {language === 'hi' ? 'प्रविष्टियां' : 'Txns'}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => viewContactDetails(c._id)}
                        className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 transition"
                        title={language === 'hi' ? 'खाता-बही देखें' : 'View Ledger'}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{language === 'hi' ? 'खाता' : 'Ledger'}</span>
                      </button>

                      <button
                        onClick={() => openEditModal(c)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                        title={t('edit')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteContact(c._id, c.name)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title={t('delete')}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
              <Users className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <div className="text-sm font-semibold text-slate-600">
                {language === 'hi' ? 'कोई संपर्क नहीं मिला' : 'No Contacts Found'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= DETAIL & DATE-WISE LEDGER MODAL ================= */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setDetailModalOpen(false)}
          />
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedContactData?.contact?.name} —{' '}
                    {language === 'hi' ? 'तारीख-वार खाता-बही व रसीद' : 'Date-wise Ledger History'}
                  </h3>
                  <div className="text-xs text-slate-500">
                    {selectedContactData?.contact?.companyName ? `${selectedContactData.contact.companyName} • ` : ''}
                    {selectedContactData?.contact?.phone || ''}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : selectedContactData ? (
              <div className="mt-4 space-y-6">
                {/* Financial Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl bg-blue-50/70 p-3.5 border border-blue-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                      {language === 'hi' ? 'कुल दिया गया पैसा' : 'Total Paid'}
                    </span>
                    <div className="text-lg font-black text-blue-900 mt-0.5">
                      {formatINR(selectedContactData.summary?.totalPaid)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-amber-50/70 p-3.5 border border-amber-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                      {language === 'hi' ? 'बाकी पेशगी' : 'Unsettled Adv.'}
                    </span>
                    <div className="text-lg font-black text-amber-900 mt-0.5">
                      {formatINR(selectedContactData.summary?.unsettledAdvances)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      {language === 'hi' ? 'कुल बिल' : 'Total Bills'}
                    </span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {formatINR(selectedContactData.summary?.totalBills)}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-purple-50/70 p-3.5 border border-purple-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-900 block">
                      {language === 'hi' ? 'बकाया रकम' : 'Pending Due'}
                    </span>
                    <div className="text-lg font-black text-purple-900 mt-0.5">
                      {formatINR(selectedContactData.summary?.pendingBills)}
                    </div>
                  </div>
                </div>

                {/* Ledger Date Range Filter */}
                <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>{language === 'hi' ? 'तारीख से फ़िल्टर करें:' : 'Filter by Date:'}</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={ledgerDateStart}
                      onChange={(e) => handleFilterLedger(e.target.value, ledgerDateEnd)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800"
                    />
                    <span className="text-xs text-slate-400">{t('to')}</span>
                    <input
                      type="date"
                      value={ledgerDateEnd}
                      onChange={(e) => handleFilterLedger(ledgerDateStart, e.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-800"
                    />
                    {(ledgerDateStart || ledgerDateEnd) && (
                      <button
                        onClick={() => handleFilterLedger('', '')}
                        className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Date-wise Payments Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                    <span>
                      {language === 'hi'
                        ? 'तारीख-वार भुगतान विवरण (Date-wise Payments)'
                        : 'Date-wise Transaction Entries'}{' '}
                      ({selectedContactData.transactions?.length || 0})
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>{t('print')}</span>
                    </button>
                  </h4>

                  <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase sticky top-0">
                        <tr>
                          <th className="px-3 py-2">{t('date')}</th>
                          <th className="px-3 py-2">{language === 'hi' ? 'भुगतान प्रकार' : 'Type'}</th>
                          <th className="px-3 py-2">{language === 'hi' ? 'खाता / माध्यम' : 'Account'}</th>
                          <th className="px-3 py-2">{t('description')}</th>
                          <th className="px-3 py-2 text-right">{t('amount')}</th>
                          <th className="px-3 py-2 text-center">{language === 'hi' ? 'रसीद' : 'Voucher'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedContactData.transactions?.length > 0 ? (
                          selectedContactData.transactions.map((txn) => (
                            <tr key={txn._id} className="hover:bg-slate-50/70 transition">
                              <td className="px-3 py-2 text-slate-700 font-medium whitespace-nowrap">
                                {formatDate(txn.date)}
                              </td>
                              <td className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap capitalize">
                                {txn.type?.replace('_', ' ') || txn.category}
                              </td>
                              <td className="px-3 py-2 text-slate-500 whitespace-nowrap">
                                {txn.account?.name || '-'}
                              </td>
                              <td className="px-3 py-2 text-slate-600 truncate max-w-xs">
                                {txn.description || '-'}
                              </td>
                              <td className="px-3 py-2 text-right font-black text-slate-900 whitespace-nowrap">
                                {formatINR(txn.amount)}
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <button
                                  onClick={() => {
                                    setSelectedReceiptTxn({
                                      ...txn,
                                      contact: selectedContactData.contact,
                                    });
                                    setReceiptModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                                  title={language === 'hi' ? 'रसीद वाउचर प्रिंट करें' : 'Print Receipt Voucher'}
                                >
                                  <Receipt className="h-3 w-3" />
                                  <span>{language === 'hi' ? 'रसीद' : 'Receipt'}</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-3 py-8 text-center text-slate-400">
                              {language === 'hi' ? 'कोई लेन-देन नहीं मिला' : 'No transactions recorded'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ================= TRANSACTION RECEIPT MODAL ================= */}
      {receiptModalOpen && selectedReceiptTxn && (
        <TransactionReceiptModal
          isOpen={receiptModalOpen}
          onClose={() => {
            setReceiptModalOpen(false);
            setSelectedReceiptTxn(null);
          }}
          transaction={selectedReceiptTxn}
        />
      )}

      {/* ================= ADD / EDIT CONTACT MODAL ================= */}
      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setAddModalOpen(false);
              setEditModalOpen(false);
            }}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editModalOpen ? t('editContact') : t('addContact')}
                </h3>
              </div>
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setEditModalOpen(false);
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <form
              onSubmit={editModalOpen ? handleEditSubmit : handleCreateSubmit}
              className="mt-4 space-y-3.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'नाम *' : 'Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mahipal / Sharma Ji"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'श्रेणी / प्रकार *' : 'Role *'}
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="contractor">{language === 'hi' ? 'ठेकेदार (Contractor)' : 'Contractor'}</option>
                    <option value="supplier">{language === 'hi' ? 'सप्लायर (Supplier)' : 'Material Supplier'}</option>
                    <option value="labour">{language === 'hi' ? 'मजदूर / कारीगर (Labour)' : 'Labour / Mistri'}</option>
                    <option value="service_provider">{language === 'hi' ? 'सेवा प्रदाता' : 'Service Provider'}</option>
                    <option value="customer">{language === 'hi' ? 'ग्राहक' : 'Customer'}</option>
                    <option value="other">{language === 'hi' ? 'अन्य' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'फ़ोन नंबर' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'कंपनी / फर्म' : 'Company'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mahipal Construction"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? 'पता (Address)' : 'Address'}
                </label>
                <input
                  type="text"
                  placeholder="Street / City"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'बैंक खाता नं.' : 'Account Number'}
                  </label>
                  <input
                    type="text"
                    placeholder="Bank A/C #"
                    value={formData.bankDetails.accountNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'UPI आईडी' : 'UPI ID'}
                  </label>
                  <input
                    type="text"
                    placeholder="name@upi"
                    value={formData.bankDetails.upiId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, upiId: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false);
                    setEditModalOpen(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{editModalOpen ? t('save') : t('addContact')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
