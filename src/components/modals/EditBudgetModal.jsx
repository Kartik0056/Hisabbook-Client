import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { formatINR } from '../../utils/formatters';
import { X, TrendingUp, Sparkles, Check, AlertCircle } from 'lucide-react';

export const EditBudgetModal = ({ isOpen, onClose, currentBudget, totalFunds, onSaved }) => {
  const { language } = useLanguage();
  const { activeProject, updateActiveProject } = useAuth();

  const [budgetAmount, setBudgetAmount] = useState(currentBudget > 0 ? String(currentBudget) : '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(budgetAmount);
    if (isNaN(num) || num < 0) {
      setError(language === 'hi' ? 'कृपया एक वैध बजट राशि दर्ज करें।' : 'Please enter a valid budget amount.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const defaultReason = language === 'hi' ? 'प्रोजेक्ट बजट अपडेट किया' : 'Updated project budget';
      const res = await api.updateProject(activeProject._id, {
        originalBudget: num,
        revisedBudget: num,
        budgetRevisionReason: reason.trim() || defaultReason,
      });

      if (res.success) {
        updateActiveProject(res.data);
        if (onSaved) onSaved(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || (language === 'hi' ? 'बजट अपडेट करने में विफल।' : 'Failed to update budget.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800">
                {language === 'hi' ? 'स्वीकृत प्रोजेक्ट बजट सेट करें' : 'Set Approved Project Budget'}
              </h3>
              <p className="text-[11px] text-slate-500">{activeProject?.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {language === 'hi' ? 'कुल स्वीकृत बजट (₹):' : 'Total Approved Budget (₹):'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                autoFocus
                placeholder="उदा. 350000"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white pl-8 pr-4 py-3 text-base font-black text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {language === 'hi'
                ? 'यह आपके पूरे प्रोजेक्ट का आधिकारिक स्वीकृत बजट है।'
                : 'The official approved budget cap for this project.'}
            </p>
          </div>

          {/* Quick presets */}
          {totalFunds > 0 && (
            <div className="rounded-2xl bg-indigo-50/70 border border-indigo-100 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span>{language === 'hi' ? 'उपलब्ध फंड (अकाउंट बैलेंस):' : 'Available Liquid Funds:'}</span>
                <span className="font-black">{formatINR(totalFunds)}</span>
              </div>
              <button
                type="button"
                onClick={() => setBudgetAmount(String(totalFunds))}
                className="w-full text-left rounded-xl bg-white border border-indigo-200 px-3 py-1.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100/50 transition flex items-center justify-between"
              >
                <span>{language === 'hi' ? '⚡ उपलब्ध फंड को ही बजट सेट करें' : '⚡ Use Available Funds as Budget'}</span>
                <span>{formatINR(totalFunds)}</span>
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'hi' ? 'रिमार्क / कारण (वैकल्पिक):' : 'Reason / Note (Optional):'}
            </label>
            <input
              type="text"
              placeholder={language === 'hi' ? 'उदा. प्रारंभिक स्वीकृत लागत' : 'e.g. Initial sanctioned estimate'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-600 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <span>{language === 'hi' ? 'सहेज रहे हैं...' : 'Saving...'}</span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>{language === 'hi' ? 'बजट सहेजें' : 'Save Budget'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
