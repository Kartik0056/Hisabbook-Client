import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatINR, formatDate } from '../utils/formatters';
import { InvoicePrintModal } from '../components/modals/InvoicePrintModal';
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  Printer,
  X,
  Loader2,
  Calendar,
  DollarSign,
  Pencil,
} from 'lucide-react';

export const PurchasesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeProject } = useAuth();
  const { t, language } = useLanguage();

  const [purchases, setPurchases] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState(null);

  // Bill Form State
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [freightTotal, setFreightTotal] = useState(0);
  const [notes, setNotes] = useState('');
  const [autoUpdateInventory, setAutoUpdateInventory] = useState(true);

  const [items, setItems] = useState([
    {
      material: '',
      description: '',
      quantityOrdered: 1,
      quantityReceived: 1,
      unit: 'piece',
      unitPrice: 0,
      discount: 0,
      taxPercent: 0,
      freightCharges: 0,
    },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openAddModal();
      searchParams.delete('add');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const loadPurchases = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const [purRes, conRes, matRes] = await Promise.all([
        api.getPurchases(),
        api.getContacts({ role: 'supplier' }),
        api.getMaterials(),
      ]);

      if (purRes.success) setPurchases(purRes.data);
      if (conRes.success) setContacts(conRes.data);
      if (matRes.success) setMaterials(matRes.data);
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [activeProject?._id]);

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingPurchaseId(null);
    setBillNumber(`BILL-${Date.now().toString().slice(-6)}`);
    setBillDate(new Date().toISOString().slice(0, 10));
    setDueDate('');
    setSupplier(contacts[0]?._id || '');
    setFreightTotal(0);
    setNotes('');
    setAutoUpdateInventory(true);
    setItems([
      {
        material: '',
        description: '',
        quantityOrdered: 1,
        quantityReceived: 1,
        unit: 'piece',
        unitPrice: 0,
        discount: 0,
        taxPercent: 18,
        freightCharges: 0,
      },
    ]);
    setError('');
    setAddModalOpen(true);
  };

  const openEditModal = (purchase) => {
    setIsEditMode(true);
    setEditingPurchaseId(purchase._id);
    setBillNumber(purchase.billNumber || '');
    setBillDate(
      purchase.billDate
        ? new Date(purchase.billDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    );
    setDueDate(
      purchase.dueDate ? new Date(purchase.dueDate).toISOString().slice(0, 10) : ''
    );
    setSupplier(purchase.supplier?._id || purchase.supplier || '');
    setFreightTotal(purchase.freightTotal || 0);
    setNotes(purchase.notes || '');
    setAutoUpdateInventory(false);

    if (purchase.items && purchase.items.length > 0) {
      setItems(
        purchase.items.map((item) => ({
          material: item.material?._id || item.material || '',
          description: item.description || '',
          quantityOrdered: item.quantityOrdered || 1,
          quantityReceived: item.quantityReceived || 1,
          unit: item.unit || 'piece',
          unitPrice: item.unitPrice || 0,
          discount: item.discount || 0,
          taxPercent: item.taxPercent || 0,
          freightCharges: item.freightCharges || 0,
        }))
      );
    }
    setError('');
    setAddModalOpen(true);
  };

  const openInvoicePrint = (purchase) => {
    setSelectedPurchase(purchase);
    setPrintModalOpen(true);
  };

  const handleDeletePurchase = async (purchase) => {
    const confirmMsg =
      language === 'hi'
        ? `क्या आप वास्तव में बिल #${purchase.billNumber} (रकम: ${formatINR(
            purchase.grandTotal
          )}) को हटाना चाहते हैं?`
        : `Are you sure you want to delete bill #${purchase.billNumber} for ${formatINR(
            purchase.grandTotal
          )}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.deletePurchase(purchase._id);
      if (res.success) {
        await loadPurchases();
      }
    } catch (err) {
      alert(err.message || 'Failed to delete bill.');
    }
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        material: '',
        description: '',
        quantityOrdered: 1,
        quantityReceived: 1,
        unit: 'piece',
        unitPrice: 0,
        discount: 0,
        taxPercent: 18,
        freightCharges: 0,
      },
    ]);
  };

  const removeItemRow = (idx) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;

    if (field === 'material' && value) {
      const selectedMat = materials.find((m) => m._id === value);
      if (selectedMat) {
        updated[idx].description = selectedMat.name;
        updated[idx].unit = selectedMat.purchaseUnit || selectedMat.stockUnit;
        if (selectedMat.averageUnitCost) {
          updated[idx].unitPrice = selectedMat.averageUnitCost;
        }
      }
    }

    setItems(updated);
  };

  // Grand Total Calculation
  const calculateTotals = () => {
    let subtotal = 0;
    let discTotal = 0;
    let taxTotal = 0;

    items.forEach((item) => {
      const qty = Number(item.quantityOrdered) || 0;
      const rate = Number(item.unitPrice) || 0;
      const gross = qty * rate;
      const disc = Number(item.discount) || 0;
      const taxable = Math.max(0, gross - disc);
      const taxRate = Number(item.taxPercent) || 0;
      const tax = (taxable * taxRate) / 100;

      subtotal += gross;
      discTotal += disc;
      taxTotal += tax;
    });

    const freight = Number(freightTotal) || 0;
    const grand = subtotal - discTotal + taxTotal + freight;

    return {
      subtotal,
      discTotal,
      taxTotal,
      freight,
      grandTotal: grand,
    };
  };

  const totals = calculateTotals();

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!billNumber.trim()) {
      setError(language === 'hi' ? 'बिल नंबर आवश्यक है।' : 'Bill number is required.');
      return;
    }
    if (!supplier) {
      setError(language === 'hi' ? 'कृपया सप्लायर चुनें।' : 'Please select a supplier.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (isEditMode && editingPurchaseId) {
        const res = await api.updatePurchase(editingPurchaseId, {
          billNumber: billNumber.trim(),
          billDate,
          dueDate: dueDate || null,
          supplier,
          items,
          freightTotal: Number(freightTotal) || 0,
          notes,
        });

        if (res.success) {
          setAddModalOpen(false);
          setIsEditMode(false);
          setEditingPurchaseId(null);
          await loadPurchases();
        }
      } else {
        const res = await api.createPurchase({
          billNumber: billNumber.trim(),
          billDate,
          dueDate: dueDate || null,
          supplier,
          items,
          freightTotal: Number(freightTotal) || 0,
          notes,
          autoUpdateInventory,
        });

        if (res.success) {
          setAddModalOpen(false);
          await loadPurchases();
        }
      }
    } catch (err) {
      setError(err.message || (language === 'hi' ? 'त्रुटि हुई।' : 'Error occurred.'));
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
            <FileText className="h-6 w-6 text-indigo-600" />
            <span>{t('purchases')}</span>
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'hi'
              ? 'सप्लायर बिल, पक्का इनवॉइस, चालान एवं बकाया भुगतान ट्रैकर'
              : 'Record vendor purchase bills, track line-item material deliveries, and tax totals'}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>{t('addBill')}</span>
        </button>
      </div>

      {/* Bill Records Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">{language === 'hi' ? 'बिल नं. व तारीख' : 'Bill # & Date'}</th>
                <th className="px-4 py-3">{language === 'hi' ? 'सप्लायर / फर्म' : 'Supplier / Party'}</th>
                <th className="px-4 py-3">{language === 'hi' ? 'सामग्री' : 'Items'}</th>
                <th className="px-4 py-3">{t('status')}</th>
                <th className="px-4 py-3 text-right">{language === 'hi' ? 'कुल रकम' : 'Grand Total'}</th>
                <th className="px-4 py-3 text-right">{language === 'hi' ? 'बकाया' : 'Outstanding'}</th>
                <th className="px-4 py-3 text-right">{language === 'hi' ? 'कार्यवाही' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    {language === 'hi' ? 'बिल लोड हो रहे हैं...' : 'Loading Invoices...'}
                  </td>
                </tr>
              ) : purchases.length > 0 ? (
                purchases.map((p) => {
                  const isPaid = p.paymentStatus === 'paid';
                  return (
                    <tr key={p._id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="font-bold text-slate-900 font-mono text-[11px]">
                          {p.billNumber}
                        </div>
                        <div className="text-[10px] text-slate-400">{formatDate(p.billDate)}</div>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {p.supplier?.name || p.supplier?.companyName || 'Supplier'}
                      </td>

                      <td className="px-4 py-3 text-slate-500">
                        {p.items?.length || 0} {language === 'hi' ? 'सामग्री' : 'items'}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold capitalize ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.paymentStatus === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.paymentStatus?.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatINR(p.grandTotal)}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-rose-600 whitespace-nowrap">
                        {formatINR(p.amountOutstanding)}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Print / Download Tax Invoice */}
                          <button
                            onClick={() => openInvoicePrint(p)}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition"
                            title={language === 'hi' ? 'इनवॉइस देखें व प्रिंट करें' : 'Print & Download Invoice'}
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>{language === 'hi' ? 'बिल' : 'Invoice'}</span>
                          </button>

                          {/* Edit Bill */}
                          <button
                            onClick={() => openEditModal(p)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                            title={t('edit')}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Bill */}
                          <button
                            onClick={() => handleDeletePurchase(p)}
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
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    {language === 'hi'
                      ? 'कोई बिल दर्ज नहीं है। नया बिल जोड़ने के लिए ऊपर बटन दबाएं।'
                      : 'No purchase bills recorded yet. Click "New Bill" to record material invoices.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT BILL MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setAddModalOpen(false)}
          />
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {isEditMode ? t('editBill') : t('addBill')}
                </h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
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

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'बिल नंबर *' : 'Bill Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t('invoiceDate')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'अंतिम तिथि' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'hi' ? 'सप्लायर / विक्रेता *' : 'Supplier *'}
                  </label>
                  <select
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none"
                  >
                    <option value="">{language === 'hi' ? '-- सप्लायर चुनें --' : '-- Select Supplier --'}</option>
                    {contacts.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {language === 'hi' ? 'बिल सामग्री प्रविष्टियां (Line Items)' : 'Bill Items'}
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition"
                  >
                    <Plus className="h-3 w-3" />
                    <span>{language === 'hi' ? '+ सामग्री जोड़ें' : 'Add Item'}</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 rounded-2xl border border-slate-200 p-3 bg-white items-center text-xs"
                    >
                      <div className="col-span-12 sm:col-span-4">
                        <select
                          value={item.material}
                          onChange={(e) => updateItemRow(idx, 'material', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none"
                        >
                          <option value="">{language === 'hi' ? '-- स्टॉक सामग्री चुनें --' : '-- Select Material --'}</option>
                          {materials.map((m) => (
                            <option key={m._id} value={m._id}>
                              {m.name} ({m.stockUnit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder={language === 'hi' ? 'विवरण (जैसे 50 किग्रा बोरी)' : 'Description'}
                          value={item.description}
                          onChange={(e) => updateItemRow(idx, 'description', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none mt-1"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-2">
                        <label className="text-[10px] text-slate-400 block">{language === 'hi' ? 'मात्रा' : 'Qty'}</label>
                        <input
                          type="number"
                          min="0.01"
                          step="any"
                          required
                          value={item.quantityOrdered}
                          onChange={(e) => updateItemRow(idx, 'quantityOrdered', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold outline-none"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-2">
                        <label className="text-[10px] text-slate-400 block">{language === 'hi' ? 'दर / भाव (₹)' : 'Rate (₹)'}</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          required
                          value={item.unitPrice}
                          onChange={(e) => updateItemRow(idx, 'unitPrice', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold outline-none"
                        />
                      </div>

                      <div className="col-span-4 sm:col-span-1">
                        <label className="text-[10px] text-slate-400 block">{language === 'hi' ? 'टैक्स %' : 'Tax %'}</label>
                        <input
                          type="number"
                          min="0"
                          value={item.taxPercent}
                          onChange={(e) => updateItemRow(idx, 'taxPercent', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-1.5 py-1 text-xs outline-none text-center"
                        />
                      </div>

                      <div className="col-span-6 sm:col-span-2 text-right">
                        <span className="text-[10px] text-slate-400 block">{language === 'hi' ? 'रकम' : 'Total'}</span>
                        <div className="font-bold text-slate-900 mt-1">
                          {formatINR(
                            (Number(item.quantityOrdered) || 0) * (Number(item.unitPrice) || 0) +
                              (((Number(item.quantityOrdered) || 0) *
                                (Number(item.unitPrice) || 0) *
                                (Number(item.taxPercent) || 0)) /
                                100)
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 sm:col-span-1 text-right">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Freight, Notes, and Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'hi' ? 'भाड़ा / परिवहन खर्च (₹)' : 'Freight / Transport (₹)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={freightTotal}
                      onChange={(e) => setFreightTotal(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      {language === 'hi' ? 'विशेष टिप्पणी' : 'Notes'}
                    </label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Received at site store room..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Calculation Summary */}
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{language === 'hi' ? 'उप-योग:' : 'Subtotal:'}</span>
                    <span>{formatINR(totals.subtotal)}</span>
                  </div>
                  {totals.taxTotal > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>{language === 'hi' ? 'टैक्स / जीएसटी:' : 'Tax Total:'}</span>
                      <span>+{formatINR(totals.taxTotal)}</span>
                    </div>
                  )}
                  {totals.freight > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>{language === 'hi' ? 'भाड़ा:' : 'Freight:'}</span>
                      <span>+{formatINR(totals.freight)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-slate-900">
                    <span>{language === 'hi' ? 'कुल बिल रकम:' : 'Grand Total:'}</span>
                    <span className="text-indigo-600">{formatINR(totals.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting
                    ? language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...'
                    : isEditMode
                    ? language === 'hi' ? 'बदलाव सहेजें' : 'Save Changes'
                    : language === 'hi' ? 'बिल सहेजें' : 'Save Bill'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAX INVOICE PRINTABLE MODAL */}
      <InvoicePrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        purchase={selectedPurchase}
      />
    </div>
  );
};
