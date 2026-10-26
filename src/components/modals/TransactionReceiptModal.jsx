import React, { useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatINR, formatDate, formatDateTime } from '../../utils/formatters';
import { Printer, Download, X, Receipt, CheckCircle } from 'lucide-react';

export const TransactionReceiptModal = ({ isOpen, onClose, transaction }) => {
  const { t, language } = useLanguage();
  const { activeProject } = useAuth();
  const printRef = useRef(null);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printContent = printRef.current?.innerHTML || '';
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Receipt_${transaction.transactionId || 'Txn'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #1e293b; }
            .box { border: 2px solid #0f172a; padding: 24px; border-radius: 12px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
            .title { font-size: 20px; font-weight: 900; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; }
            td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
            .amount-box { margin-top: 16px; background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
            .signatures { margin-top: 48px; display: flex; justify-content: space-between; }
            .sig-box { border-top: 1px dashed #64748b; width: 160px; text-align: center; font-size: 11px; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="box">
            ${printContent}
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${transaction.transactionId || 'voucher'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isInflow = ['income', 'loan_received', 'refund'].includes(transaction.type);
  const isAdvance = transaction.isAdvance || transaction.type === 'advance';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              {language === 'hi' ? 'भुगतान / जमा रसीद प्रपत्र' : 'Payment / Receipt Voucher'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
            >
              <Printer className="h-4 w-4" />
              <span>{t('print')}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-100 transition active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span>{t('download')}</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 transition ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white" ref={printRef}>
          <div className="border-2 border-slate-900 rounded-3xl p-6 sm:p-8 bg-white">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 border-slate-900 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 block">
                  {activeProject?.name || 'UNIVERSAL HISABBOOK'}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                  {isInflow
                    ? language === 'hi' ? 'जमा रसीद (RECEIPT VOUCHER)' : 'RECEIPT VOUCHER'
                    : isAdvance
                    ? language === 'hi' ? 'पेशगी वाउचर (ADVANCE VOUCHER)' : 'ADVANCE PAYMENT VOUCHER'
                    : language === 'hi' ? 'भुगतान वाउचर (PAYMENT VOUCHER)' : 'PAYMENT VOUCHER'}
                </h1>
                <div className="text-xs text-slate-500 mt-1">
                  {activeProject?.description || 'Project Financial Ledger Entry'}
                </div>
              </div>

              <div className="sm:text-right">
                <div className="inline-block rounded-lg px-2.5 py-1 text-xs font-black font-mono bg-slate-900 text-white mb-1">
                  {transaction.transactionId || 'TXN-0000'}
                </div>
                <div className="text-xs text-slate-600">
                  <span className="text-slate-400">{t('date')}: </span>
                  <strong>{formatDate(transaction.date)}</strong>
                </div>
              </div>
            </div>

            {/* Voucher Details Table */}
            <div className="my-6 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {isInflow
                      ? language === 'hi' ? 'किससे प्राप्त हुआ' : 'Received From'
                      : language === 'hi' ? 'किसको दिया गया' : 'Paid To (Party)'}
                  </span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {transaction.contact?.name || language === 'hi' ? 'स्वयं / सामान्य खर्च' : 'Self / General'}
                  </div>
                  {transaction.contact?.phone && (
                    <div className="text-[11px] text-slate-500">📞 {transaction.contact.phone}</div>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {language === 'hi' ? 'खाता / माध्यम' : 'Account & Method'}
                  </span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {transaction.account?.name || 'Account'} ({transaction.paymentMethod?.toUpperCase()})
                  </div>
                  {transaction.referenceNumber && (
                    <div className="text-[11px] text-slate-500 font-mono">
                      Ref/UTR: {transaction.referenceNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">{t('category')}:</span>
                  <span className="font-semibold text-slate-800">{transaction.category}</span>
                </div>

                {(transaction.description || transaction.purpose) && (
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500">{t('description')}:</span>
                    <span className="font-semibold text-slate-800 max-w-sm text-right">
                      {transaction.description || transaction.purpose}
                    </span>
                  </div>
                )}

                {transaction.notes && (
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500">{language === 'hi' ? 'नोट' : 'Notes'}:</span>
                    <span className="text-slate-700 italic max-w-sm text-right">{transaction.notes}</span>
                  </div>
                )}
              </div>

              {/* Highlighting Amount Box */}
              <div className="rounded-2xl bg-blue-50/70 border-2 border-blue-200 p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 block">
                    {language === 'hi' ? 'कुल रकम (Amount in Figures)' : 'Total Amount'}
                  </span>
                  <span className="text-xs text-blue-700 font-medium mt-0.5 block">
                    {language === 'hi' ? 'सत्यापित वित्तीय प्रविष्टि' : 'Verified Financial Transaction'}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-blue-900">
                  {formatINR(transaction.amount)}
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-end text-center text-xs">
              <div className="w-40 border-t border-slate-400 pt-2 text-slate-600">
                <div className="font-bold text-slate-800">
                  {language === 'hi' ? 'जारीकर्ता के हस्ताक्षर' : 'Prepared By'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'hi' ? 'हस्ताक्षर व तारीख' : 'Sign & Date'}
                </div>
              </div>

              <div className="w-40 border-t border-slate-400 pt-2 text-slate-600">
                <div className="font-bold text-slate-800">{t('receiverSignature')}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {language === 'hi' ? 'प्राप्तकर्ता हस्ताक्षर' : 'Receiver Sign'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
