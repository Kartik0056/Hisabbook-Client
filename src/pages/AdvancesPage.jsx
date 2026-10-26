import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import {
  HandCoins,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  FileCheck,
  User,
  X,
  Loader2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const AdvancesPage = () => {
  const { activeProject } = useAuth();
  const { t } = useLanguage();

  const [advances, setAdvances] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [summary, setSummary] = useState({ totalAdvancesPaid: 0, totalSettled: 0, totalUnsettled: 0 });
  const [loading, setLoading] = useState(true);

  // Modal State
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);

  // Settlement Form
  const [settleAmount, setSettleAmount] = useState('');
  const [linkedBillId, setLinkedBillId] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [remainingClassification, setRemainingClassification] = useState('still_with_recipient');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadAdvances = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const [advRes, purRes] = await Promise.all([
        api.getAdvances(),
        api.getPurchases(),
      ]);

      if (advRes.success) {
        setAdvances(advRes.data);
        if (advRes.summary) setSummary(advRes.summary);
      }
      if (purRes.success) {
        setPurchases(purRes.data);
      }
    } catch (err) {
      console.error('Error fetching advances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvances();
  }, [activeProject?._id]);

  const openSettleModal = (adv) => {
    setSelectedAdvance(adv);
    const unsettled = adv.advanceDetails?.unsettledAmount ?? adv.amount;
    setSettleAmount(unsettled);
    setLinkedBillId('');
    setBillNumber('');
    setRemainingClassification('still_with_recipient');
    setNotes('');
    setError('');
    setSettleModalOpen(true);
  };

  const handleSettleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(settleAmount);
    if (!num || num <= 0) {
      setError('Please provide a valid settlement amount greater than 0.');
      return;
    }

    const currentUnsettled = selectedAdvance.advanceDetails?.unsettledAmount ?? selectedAdvance.amount;
    if (num > currentUnsettled) {
      setError(`Settlement amount cannot exceed remaining unsettled balance of ${formatINR(currentUnsettled)}`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api.settleAdvance(selectedAdvance._id, {
        settledAmount: num,
        linkedBillId: linkedBillId || null,
        billNumber: billNumber.trim(),
        remainingClassification,
        notes: notes.trim(),
      });

      if (res.success) {
        setSettleModalOpen(false);
        setSelectedAdvance(null);
        await loadAdvances();
      }
    } catch (err) {
      setError(err.message || 'Failed to settle advance.');
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
            <HandCoins className="h-6 w-6 text-amber-600" />
            <span>Advances & Settlements (पेशगी व हिसाब चुकता)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Reconcile contractor & supplier advance deposits against verified measurement bills
          </p>
        </div>
      </div>

      {/* 3 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Advances Given</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <HandCoins className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {formatINR(summary.totalAdvancesPaid)}
          </div>
          <p className="text-xs text-slate-400 mt-1">Cash outflow before final billing</p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <span>Total Settled Against Bills</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">
            {formatINR(summary.totalSettled)}
          </div>
          <p className="text-xs text-emerald-600 mt-1">Converted into verified expenses</p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase tracking-wider">
            <span>Remaining Unsettled</span>
            <div className="h-8 w-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-800">
            {formatINR(summary.totalUnsettled)}
          </div>
          <p className="text-xs text-amber-700 mt-1">Still with party / unadjusted deposit</p>
        </div>
      </div>

      {/* Advance List Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : advances.length > 0 ? (
          advances.map((adv) => {
            const unsettled = adv.advanceDetails?.unsettledAmount ?? adv.amount;
            const settled = adv.advanceDetails?.settledAmount || 0;
            const percentSettled = adv.amount > 0 ? Math.round((settled / adv.amount) * 100) : 0;
            const isFullySettled = unsettled === 0;

            return (
              <div
                key={adv._id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Party & Date Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {adv.contact?.name || 'Contractor / Party'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 capitalize">
                      {adv.contact?.role || 'Advance'}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isFullySettled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isFullySettled ? 'Fully Settled' : 'Unsettled'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {adv.description || 'Advance payment'} • Paid on {formatDate(adv.date)} from{' '}
                    <span className="font-semibold text-slate-700">{adv.account?.name}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-400">
                    Txn ID: {adv.transactionId} {adv.referenceNumber ? `• Ref: ${adv.referenceNumber}` : ''}
                  </div>
                </div>

                {/* Progress & Amounts Breakdown */}
                <div className="flex items-center gap-6">
                  <div className="w-40 sm:w-52">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-400">Settled: {percentSettled}%</span>
                      <span className="text-slate-700 font-bold">{formatINR(settled)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${percentSettled}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Total Advance: <span className="font-bold text-slate-700">{formatINR(adv.amount)}</span>
                    </div>
                  </div>

                  {/* Unsettled Balance Callout */}
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Unsettled Remaining
                    </div>
                    <div className={`text-lg font-black ${isFullySettled ? 'text-slate-400' : 'text-amber-800'}`}>
                      {formatINR(unsettled)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedAdvance(adv);
                        setHistoryModalOpen(true);
                      }}
                      title="View Settlement History"
                      className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 hover:bg-slate-100"
                    >
                      <History className="h-4 w-4" />
                    </button>
                    {!isFullySettled && (
                      <button
                        onClick={() => openSettleModal(adv)}
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        Settle Bill
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-400">
            <HandCoins className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-semibold text-slate-600">No Advance Records Found</div>
            <p className="text-xs text-slate-400 mt-1">
              When paying contractors in advance before receiving a final bill, mark the transaction as "Advance (पेशगी)".
            </p>
          </div>
        )}
      </div>

      {/* SETTLE ADVANCE MODAL */}
      {settleModalOpen && selectedAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSettleModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Settle Contractor / Supplier Advance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reconcile cash advance against verified work bill or material invoice
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSettleModalOpen(false)}
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

            <form onSubmit={handleSettleSubmit} className="mt-4 space-y-4">
              {/* Advance Summary Banner */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-700 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block">Party / Contractor:</span>
                  <span className="font-bold text-slate-900">{selectedAdvance.contact?.name || 'Contractor'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block">Unsettled Balance:</span>
                  <span className="font-black text-amber-800 text-sm">
                    {formatINR(selectedAdvance.advanceDetails?.unsettledAmount ?? selectedAdvance.amount)}
                  </span>
                </div>
              </div>

              {/* Settlement Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Settled Amount (₹) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  min="1"
                  max={selectedAdvance.advanceDetails?.unsettledAmount ?? selectedAdvance.amount}
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-base font-black text-slate-900 outline-none focus:border-emerald-600"
                />
              </div>

              {/* Select Existing Purchase Bill or Custom Bill No */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Link to Purchase Bill / Invoice (Optional)
                </label>
                <select
                  value={linkedBillId}
                  onChange={(e) => {
                    setLinkedBillId(e.target.value);
                    const selected = purchases.find((p) => p._id === e.target.value);
                    if (selected) setBillNumber(selected.billNumber);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none"
                >
                  <option value="">Manual Bill Number (No linked system bill)</option>
                  {purchases.map((p) => (
                    <option key={p._id} value={p._id}>
                      Bill #{p.billNumber} — Total {formatINR(p.grandTotal)} (Due: {formatINR(p.amountOutstanding)})
                    </option>
                  ))}
                </select>
              </div>

              {!linkedBillId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bill / Voucher / Measurement Slip Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SLAB-BILL-104, VOUCHER-99"
                    value={billNumber}
                    onChange={(e) => setBillNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none"
                  />
                </div>
              )}

              {/* Classification of Remaining Unadjusted Balance */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Classification of Remaining Balance
                </label>
                <select
                  value={remainingClassification}
                  onChange={(e) => setRemainingClassification(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none"
                >
                  <option value="still_with_recipient">Advance still with the recipient (सामान्य बाकी पेशगी)</option>
                  <option value="refund_due">Refund Due from party (पार्टी से वापसी लेना)</option>
                  <option value="used_other_expense">Used for another approved expense</option>
                  <option value="disputed">Disputed amount (विवादित)</option>
                  <option value="fully_settled">Mark as Fully Settled (हिसाब चुकता)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Settlement Notes / Remarks
                </label>
                <textarea
                  rows="2"
                  placeholder="Measurement details, verification notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettleModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTLEMENT HISTORY MODAL */}
      {historyModalOpen && selectedAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setHistoryModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Settlement History & Ledger
                </h3>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-xs border border-slate-200">
                <div className="font-bold text-slate-900">
                  {selectedAdvance.contact?.name || 'Contractor'}
                </div>
                <div>Original Advance: <span className="font-bold">{formatINR(selectedAdvance.amount)}</span></div>
                <div>Remaining Unadjusted: <span className="font-bold text-amber-800">{formatINR(selectedAdvance.advanceDetails?.unsettledAmount)}</span></div>
              </div>

              {selectedAdvance.settlements && selectedAdvance.settlements.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Settlement Adjustments ({selectedAdvance.settlements.length})
                  </h4>
                  {selectedAdvance.settlements.map((s, idx) => (
                    <div
                      key={s._id || idx}
                      className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-1 shadow-sm text-xs"
                    >
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-emerald-700">Settled: {formatINR(s.settledAmount)}</span>
                        <span className="text-slate-400 text-[10px]">{formatDateTime(s.settledAt)}</span>
                      </div>
                      {s.billNumber && (
                        <div className="text-slate-600">Bill #: <span className="font-mono font-semibold">{s.billNumber}</span></div>
                      )}
                      <div className="text-slate-500 text-[11px]">
                        Remaining unadjusted was: {formatINR(s.remainingUnadjusted)} ({s.remainingClassification.replace(/_/g, ' ')})
                      </div>
                      {s.notes && (
                        <div className="text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">
                          "{s.notes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No settlements recorded yet for this advance.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
