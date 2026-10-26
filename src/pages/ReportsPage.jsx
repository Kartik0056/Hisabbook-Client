import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import {
  BarChart3,
  BookOpen,
  Boxes,
  Download,
  Printer,
  Calendar,
  Loader2,
  Database,
  Users,
  Truck,
  CheckCircle,
  FileText,
  CreditCard,
} from 'lucide-react';

export const ReportsPage = () => {
  const { activeProject } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState('party_payments'); // 'party_payments', 'goods_inward', 'cashbook', 'materials', 'backup'
  const [cashbookData, setCashbookData] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadReportData = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [cbRes, matRes, conRes, purRes] = await Promise.all([
        api.getCashBook(params),
        api.getMaterials(),
        api.getContacts(params),
        api.getPurchases(),
      ]);

      if (cbRes.success) setCashbookData(cbRes.data);
      if (matRes.success) setMaterials(matRes.data);
      if (conRes.success) setContacts(conRes.data);
      if (purRes.success) setPurchases(purRes.data);
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeProject?._id, startDate, endDate]);

  const totalStockValuation = materials.reduce(
    (acc, m) => acc + (m.currentStock || 0) * (m.averageUnitCost || 0),
    0
  );

  const downloadProjectBackup = () => {
    window.open(api.getBackupExportUrl(), '_blank');
  };

  // Compile Goods Inward Deliveries
  const inwardEntries = [];
  purchases.forEach((p) => {
    if (p.items && p.items.length > 0) {
      p.items.forEach((it, idx) => {
        inwardEntries.push({
          id: `${p._id}-${idx}`,
          billNumber: p.billNumber,
          billDate: p.billDate,
          supplierName: p.supplier?.name || p.supplier?.companyName || 'Supplier',
          materialName: it.description || it.material?.name || 'Material Item',
          quantity: Number(it.quantityReceived || it.quantityOrdered || 1),
          unit: it.unit || 'piece',
          unitPrice: Number(it.unitPrice || 0),
          totalCost: Number(it.totalAmount || (Number(it.quantityOrdered || 1) * Number(it.unitPrice || 0))),
        });
      });
    }
  });

  // Filter Inward by Date Range
  const filteredInward = inwardEntries.filter((e) => {
    if (startDate && new Date(e.billDate) < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(e.billDate) > end) return false;
    }
    return true;
  });

  // Group Inward by Material
  const materialGroupedMap = {};
  filteredInward.forEach((e) => {
    const key = e.materialName?.trim().toLowerCase() || 'unknown';
    if (!materialGroupedMap[key]) {
      materialGroupedMap[key] = {
        name: e.materialName,
        unit: e.unit,
        totalQuantity: 0,
        totalCost: 0,
        count: 0,
        lastDate: e.billDate,
        suppliers: new Set(),
      };
    }
    const g = materialGroupedMap[key];
    g.totalQuantity += e.quantity;
    g.totalCost += e.totalCost;
    g.count += 1;
    if (e.supplierName) g.suppliers.add(e.supplierName);
    if (new Date(e.billDate) > new Date(g.lastDate)) g.lastDate = e.billDate;
  });

  const materialSummaries = Object.values(materialGroupedMap)
    .map((m) => ({
      ...m,
      avgRate: m.totalQuantity > 0 ? m.totalCost / m.totalQuantity : 0,
      suppliersList: Array.from(m.suppliers).join(', '),
    }))
    .sort((a, b) => b.totalCost - a.totalCost);

  const totalInwardValue = filteredInward.reduce((sum, e) => sum + e.totalCost, 0);
  const totalPaidAllContacts = contacts.reduce((sum, c) => sum + (c.summary?.totalPaid || 0), 0);
  const totalUnsettledAdv = contacts.reduce((sum, c) => sum + (c.summary?.unsettledAdvances || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span>
              {language === 'hi'
                ? 'रिपोर्ट्स, भुगतान सारांश व डेटा बैकअप'
                : 'Reports, Financial Statements & Backup'}
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'hi'
              ? 'देखें किसको कितना पैसा गया, क्या सामान आया, रोकड़ बही और संपूर्ण प्रोजेक्ट बैकअप'
              : 'Detailed statements of money paid to people, material received registers, and cash book'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Printer className="h-4 w-4" />
            <span>{t('print')}</span>
          </button>
          <button
            onClick={downloadProjectBackup}
            className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" />
            <span>{language === 'hi' ? 'बैकअप डाउनलोड करें' : 'Download Backup'}</span>
          </button>
        </div>
      </div>

      {/* Global Date Filter for Reports */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm no-print max-w-fit">
        <Calendar className="h-4 w-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-600">{language === 'hi' ? 'अवधि चुनें:' : 'Date Period:'}</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-800 outline-none"
        />
        <span className="text-xs text-slate-400">{t('to')}</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="rounded-xl border border-slate-200 px-2.5 py-1 text-xs text-slate-800 outline-none"
        />
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
            className="rounded-xl bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
          >
            {language === 'hi' ? 'हटाएं' : 'Clear'}
          </button>
        )}
      </div>

      {/* Report Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto no-print">
        {[
          {
            id: 'party_payments',
            label: language === 'hi' ? '💰 किसको कितना पैसा गया (पार्टी भुगतान)' : '💰 Person-wise Payments',
            icon: Users,
          },
          {
            id: 'goods_inward',
            label: language === 'hi' ? '📋 सामान आवक व कुल लागत' : '📋 Goods Received & Cost',
            icon: Truck,
          },
          {
            id: 'cashbook',
            label: language === 'hi' ? '📖 दैनिक रोकड़ बही (Cash Book)' : '📖 Daily Cash Book',
            icon: BookOpen,
          },
          {
            id: 'materials',
            label: language === 'hi' ? '📦 सामग्री स्टॉक मूल्यांकन' : '📦 Stock Valuation',
            icon: Boxes,
          },
          {
            id: 'backup',
            label: language === 'hi' ? '💾 बैकअप व निर्यात' : '💾 Backup & Export',
            icon: Database,
          },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 pb-3 px-2 text-xs font-bold transition border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: PERSON-WISE PAYMENTS REPORT ================= */}
      {activeTab === 'party_payments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
              <span className="text-[10px] font-bold text-blue-900 uppercase">
                {language === 'hi' ? 'कुल दिया गया पैसा' : 'Total Money Paid'}
              </span>
              <div className="text-xl font-black text-blue-950 mt-1">
                {formatINR(totalPaidAllContacts)}
              </div>
              <div className="text-[11px] text-blue-700 mt-0.5">
                {contacts.length} {language === 'hi' ? 'व्यक्तियों / पार्टियों को कुल भुगतान' : 'Payees'}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <span className="text-[10px] font-bold text-amber-900 uppercase">
                {language === 'hi' ? 'चालू अग्रिम / पेशगी' : 'Active Advances'}
              </span>
              <div className="text-xl font-black text-amber-950 mt-1">
                {formatINR(totalUnsettledAdv)}
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                {language === 'hi' ? 'मजदूरों व कारीगरों के पास शेष पेशगी' : 'Unsettled cash with workers'}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {language === 'hi' ? 'सक्रिय पार्टियां' : 'Active Contacts'}
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {contacts.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {language === 'hi' ? 'ठेकेदार, मजदूर, कारीगर व सप्लायर' : 'Contractors, labour & suppliers'}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {language === 'hi' ? 'व्यक्ति-वार कुल भुगतान सूची' : 'Person-wise Payment Statement'}
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {startDate || endDate
                  ? `${startDate || 'Start'} to ${endDate || 'Now'}`
                  : language === 'hi' ? 'समस्त समय' : 'All-time'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{language === 'hi' ? 'नाम व पार्टी' : 'Person / Party'}</th>
                    <th className="px-4 py-3">{language === 'hi' ? 'श्रेणी' : 'Role'}</th>
                    <th className="px-4 py-3 text-right">{language === 'hi' ? 'कुल दिया गया पैसा' : 'Total Paid'}</th>
                    <th className="px-4 py-3 text-right">{language === 'hi' ? 'अग्रिम / पेशगी' : 'Advance'}</th>
                    <th className="px-4 py-3 text-right">{language === 'hi' ? 'कुल बिल' : 'Total Bills'}</th>
                    <th className="px-4 py-3 text-right">{language === 'hi' ? 'बकाया बिल' : 'Pending Due'}</th>
                    <th className="px-4 py-3">{language === 'hi' ? 'आखिरी भुगतान तारीख' : 'Last Payment'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {contacts.length > 0 ? (
                    contacts.map((c) => {
                      const sum = c.summary || {};
                      return (
                        <tr key={c._id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                            <div>{c.name}</div>
                            {c.companyName && (
                              <div className="text-[11px] font-normal text-slate-500">{c.companyName}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 capitalize text-slate-600 whitespace-nowrap">
                            {c.role?.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-blue-900 whitespace-nowrap">
                            {formatINR(sum.totalPaid || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-amber-700 whitespace-nowrap">
                            {formatINR(sum.unsettledAdvances || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                            {formatINR(sum.totalBills || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-purple-700 whitespace-nowrap">
                            {formatINR(sum.pendingBillsAmount || 0)}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-[11px]">
                            {sum.lastPaymentDate ? formatDate(sum.lastPaymentDate) : '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        {language === 'hi' ? 'कोई संपर्क नहीं मिला' : 'No contacts found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: GOODS RECEIVED & MATERIAL COST REPORT ================= */}
      {activeTab === 'goods_inward' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <span className="text-[10px] font-bold text-amber-900 uppercase">
                {language === 'hi' ? 'कुल प्राप्त सामान की लागत' : 'Total Goods Received Cost'}
              </span>
              <div className="text-xl font-black text-amber-950 mt-1">
                {formatINR(totalInwardValue)}
              </div>
              <div className="text-[11px] text-amber-800 mt-0.5">
                {language === 'hi' ? 'प्राप्त हुई सभी सामग्रियों का कुल मूल्य' : 'Total value of delivered materials'}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
              <span className="text-[10px] font-bold text-blue-900 uppercase">
                {language === 'hi' ? 'कुल प्राप्त खेपें' : 'Delivery Lots'}
              </span>
              <div className="text-xl font-black text-blue-950 mt-1">
                {filteredInward.length} {language === 'hi' ? 'बार' : 'deliveries'}
              </div>
              <div className="text-[11px] text-blue-800 mt-0.5">
                {language === 'hi' ? 'दर्ज चालान व बिल प्रविष्टियां' : 'Inward challans & receipts'}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                {language === 'hi' ? 'सामग्री प्रकार' : 'Item Varieties'}
              </span>
              <div className="text-xl font-black text-slate-900 mt-1">
                {materialSummaries.length}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {language === 'hi' ? 'सीमेंट, रेत, सरिया, ईंट आदि' : 'Distinct material categories'}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {language === 'hi' ? 'सामग्री-वार कुल आवक व लागत सारांश' : 'Material Inward Summary & Cumulative Costs'}
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {startDate || endDate
                  ? `${startDate || 'Start'} to ${endDate || 'Now'}`
                  : language === 'hi' ? 'समस्त समय' : 'All-time'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{language === 'hi' ? 'सामग्री का नाम' : 'Material Item'}</th>
                    <th className="px-4 py-3 text-right">{language === 'hi' ? 'कुल कितना सामान आया' : 'Quantity Received'}</th>
                    <th className="px-4 py-3 text-right">{language === 'hi' ? 'औसत भाव' : 'Avg Rate'}</th>
                    <th className="px-4 py-3 text-right">{language === 'hi' ? 'कुल कितने का आया' : 'Total Cost'}</th>
                    <th className="px-4 py-3 text-center">{language === 'hi' ? 'खेपें' : 'Lots'}</th>
                    <th className="px-4 py-3">{language === 'hi' ? 'आखिरी आवक तारीख' : 'Last Arrival Date'}</th>
                    <th className="px-4 py-3">{language === 'hi' ? 'सप्लायर' : 'Suppliers'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materialSummaries.length > 0 ? (
                    materialSummaries.map((m) => (
                      <tr key={m.name} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">
                          {m.name}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                          {m.totalQuantity} <span className="font-normal text-slate-500 text-[11px]">{m.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                          {formatINR(m.avgRate)} / {m.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-amber-950 whitespace-nowrap">
                          {formatINR(m.totalCost)}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700 whitespace-nowrap">
                          {m.count}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-[11px]">
                          {formatDate(m.lastDate)}
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-[11px] max-w-xs truncate">
                          {m.suppliersList || '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        {language === 'hi' ? 'कोई सामान आवक रिकॉर्ड नहीं मिला' : 'No inward records found'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: DAILY CASH BOOK ================= */}
      {activeTab === 'cashbook' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Period Inflows (जमा)</span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                + {formatINR(cashbookData?.summary?.totalInflow)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Period Outflows (निकासी)</span>
              <div className="text-xl font-black text-rose-600 mt-1">
                - {formatINR(cashbookData?.summary?.totalOutflow)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Net Cash Movement</span>
              <div className={`text-xl font-black mt-1 ${(cashbookData?.summary?.netCashflow || 0) < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {formatINR(cashbookData?.summary?.netCashflow)}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">{t('date')}</th>
                    <th className="px-4 py-3">Txn ID</th>
                    <th className="px-4 py-3">{t('description')}</th>
                    <th className="px-4 py-3">{t('account')}</th>
                    <th className="px-4 py-3 text-right">Inflow (₹)</th>
                    <th className="px-4 py-3 text-right">Outflow (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
                        Generating Cash Book...
                      </td>
                    </tr>
                  ) : cashbookData?.transactions?.length > 0 ? (
                    cashbookData.transactions.map((txn) => (
                      <tr key={txn._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {formatDate(txn.date)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {txn.transactionId}
                        </td>
                        <td className="px-4 py-3 max-w-[240px]">
                          <div className="font-semibold text-slate-800 truncate">
                            {txn.description || txn.category}
                          </div>
                          {txn.contact && (
                            <div className="text-[10px] text-blue-600">
                              Party: {txn.contact.name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {txn.account?.name || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                          {txn.inflow > 0 ? formatINR(txn.inflow) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                          {txn.outflow > 0 ? formatINR(txn.outflow) : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        No transactions recorded for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: MATERIAL STOCK VALUATION ================= */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Inventory Valuation</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {formatINR(totalStockValuation)}
              </div>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Based on weighted average unit costs
            </span>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Material Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-center">Current Stock</th>
                    <th className="px-4 py-3 text-right">Avg Unit Cost</th>
                    <th className="px-4 py-3 text-right">Valuation (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {materials.map((m) => {
                    const valuation = (m.currentStock || 0) * (m.averageUnitCost || 0);
                    return (
                      <tr key={m._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-slate-800">{m.name}</td>
                        <td className="px-4 py-3 text-slate-500">{m.category}</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">
                          {m.currentStock} {m.stockUnit}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatINR(m.averageUnitCost)}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">
                          {formatINR(valuation)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: BACKUP & DATA EXPORT ================= */}
      {activeTab === 'backup' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {language === 'hi' ? 'प्रोजेक्ट संपूर्ण बैकअप व JSON निर्यात' : 'Full Project Backup & JSON Snapshot'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'hi'
                  ? 'सभी खाते, लेन-देन, बिल, सामग्री, संपर्क और ऑडिट रिकॉर्ड एक सुरक्षित फ़ाइल में'
                  : 'Exports all financial ledgers, bills, materials, contacts, tasks, and audit records'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>{language === 'hi' ? 'सुरक्षा एवं अखंडता की गारंटी:' : 'Security & Integrity Guaranteed:'}</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-500">
              <li>
                {language === 'hi'
                  ? 'पासवर्ड और टोकन कभी भी निर्यात फ़ाइल में शामिल नहीं किए जाते।'
                  : 'Passphrases, session tokens, and database credentials are NEVER included in exports.'}
              </li>
              <li>
                {language === 'hi'
                  ? 'Excel या Python में विश्लेषण के लिए पूर्ण संगत JSON संरचना।'
                  : 'Complete JSON format compatible with data analysis in Excel, Python, or backup storage.'}
              </li>
              <li>
                {language === 'hi'
                  ? 'ऑफ़लाइन बैकअप एवं कानूनी रिकॉर्ड के लिए उपयोग किया जा सकता है।'
                  : 'Can be used for audits, tax filing calculations, and offline storage.'}
              </li>
            </ul>
          </div>

          <button
            onClick={downloadProjectBackup}
            className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 transition"
          >
            <Download className="h-4 w-4" />
            <span>{language === 'hi' ? 'बैकअप फ़ाइल डाउनलोड करें' : 'Download Backup JSON File'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
