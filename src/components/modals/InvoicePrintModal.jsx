import React, { useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatINR, formatDate } from '../../utils/formatters';
import { Printer, Download, X, FileText, CheckCircle } from 'lucide-react';

export const InvoicePrintModal = ({ isOpen, onClose, purchase }) => {
  const { t, language } = useLanguage();
  const { activeProject } = useAuth();
  const printRef = useRef(null);

  if (!isOpen || !purchase) return null;

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
          <title>Invoice_${purchase.billNumber || 'Bill'}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; font-weight: bold; }
            .text-right { text-align: right; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 16px; }
            .title { font-size: 20px; font-weight: 800; }
            .totals { margin-left: auto; width: 300px; margin-top: 16px; }
            .totals td { border: none; padding: 4px 8px; }
            .totals .grand-total { font-weight: 800; font-size: 14px; border-top: 2px solid #0f172a; }
            .signatures { margin-top: 48px; display: flex; justify-content: space-between; }
            .sig-box { border-top: 1px dashed #64748b; width: 180px; text-align: center; font-size: 11px; padding-top: 6px; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${purchase.billNumber || 'bill'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const supplier = purchase.supplier || {};
  const isPaid = purchase.paymentStatus === 'paid';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      {/* Top action bar outside print view */}
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 print:hidden flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              {language === 'hi' ? 'बिल / इनवॉइस प्रपत्र (Invoice Preview)' : 'Tax Invoice / Bill Voucher'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition active:scale-95"
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

        {/* Printable Invoice Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-white print:p-0 print:m-0" ref={printRef}>
          {/* Invoice Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
                {language === 'hi' ? 'कर बीजक / खरीद बिल' : 'TAX INVOICE / PURCHASE VOUCHER'}
              </span>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {supplier.name || supplier.companyName || 'Supplier / Vendor'}
              </h1>
              {supplier.companyName && (
                <div className="text-xs font-semibold text-slate-600">{supplier.companyName}</div>
              )}
              {supplier.address && (
                <div className="text-[11px] text-slate-500 mt-1 max-w-sm">{supplier.address}</div>
              )}
              <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-x-4">
                {supplier.phone && <span>📞 {supplier.phone}</span>}
                {supplier.gstin && <span>GSTIN: <strong className="text-slate-700">{supplier.gstin}</strong></span>}
              </div>
            </div>

            <div className="sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-slate-200">
              <div className="inline-block rounded-lg px-2.5 py-1 text-xs font-black font-mono bg-slate-900 text-white mb-2">
                #{purchase.billNumber || 'BILL-000'}
              </div>
              <div className="text-xs text-slate-600">
                <span className="text-slate-400">{t('invoiceDate')}: </span>
                <strong>{formatDate(purchase.billDate)}</strong>
              </div>
              {purchase.dueDate && (
                <div className="text-xs text-slate-600 mt-0.5">
                  <span className="text-slate-400">{language === 'hi' ? 'अंतिम तिथि' : 'Due Date'}: </span>
                  <strong>{formatDate(purchase.dueDate)}</strong>
                </div>
              )}
              <div className="mt-2">
                <span
                  className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    isPaid
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : purchase.paymentStatus === 'partially_paid'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {purchase.paymentStatus?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Billed To / Project Section */}
          <div className="my-5 rounded-2xl bg-slate-50 p-4 border border-slate-200 text-xs flex flex-col sm:flex-row justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {t('billedTo')}
              </span>
              <div className="font-black text-slate-900 text-sm mt-0.5">
                {activeProject?.name || 'Current Project'}
              </div>
              {activeProject?.description && (
                <div className="text-[11px] text-slate-500 mt-0.5">{activeProject.description}</div>
              )}
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                {language === 'hi' ? 'भुगतान माध्यम' : 'Payment Currency'}
              </span>
              <div className="font-bold text-slate-700 mt-0.5">₹ INR (भारतीय रुपया)</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mt-4 border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2.5 w-8">#</th>
                  <th className="px-3 py-2.5">{language === 'hi' ? 'विवरण / सामग्री' : 'Item Description'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'hi' ? 'मात्रा' : 'Qty'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'hi' ? 'दर / भाव' : 'Rate'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'hi' ? 'छूट' : 'Disc.'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'hi' ? 'टैक्स' : 'Tax'}</th>
                  <th className="px-3 py-2.5 text-right">{language === 'hi' ? 'कुल रकम' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchase.items && purchase.items.length > 0 ? (
                  purchase.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-slate-800">
                        <div>{item.description || item.material?.name || 'Item'}</div>
                        {item.material?.name && item.description !== item.material?.name && (
                          <div className="text-[10px] text-slate-400">{item.material.name}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-800 whitespace-nowrap">
                        {item.quantityReceived || item.quantityOrdered || 1} {item.unit}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-700 whitespace-nowrap">
                        {formatINR(item.unitPrice)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500 whitespace-nowrap">
                        {item.discount > 0 ? `-${formatINR(item.discount)}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500 whitespace-nowrap">
                        {item.taxPercent ? `${item.taxPercent}%` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-black text-slate-900 whitespace-nowrap">
                        {formatINR(item.totalAmount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-3 py-4 text-center text-slate-400">
                      No items listed
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Breakdown & Totals */}
          <div className="mt-5 flex flex-col sm:flex-row justify-between items-start gap-6">
            {/* Notes */}
            <div className="flex-1 text-xs">
              {purchase.notes && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    {language === 'hi' ? 'विशेष टिप्पणी / नोट' : 'Notes & Instructions'}
                  </span>
                  <p className="text-slate-600">{purchase.notes}</p>
                </div>
              )}
            </div>

            {/* Total Math Table */}
            <div className="w-full sm:w-72 bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>{language === 'hi' ? 'उप-योग (Subtotal)' : 'Subtotal'}:</span>
                <span className="font-semibold">{formatINR(purchase.subtotal)}</span>
              </div>
              {purchase.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>{language === 'hi' ? 'कुल छूट (Discount)' : 'Total Discount'}:</span>
                  <span className="font-semibold">-{formatINR(purchase.discountTotal)}</span>
                </div>
              )}
              {purchase.taxTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'hi' ? 'जीएसटी / टैक्स' : 'GST / Tax'}:</span>
                  <span className="font-semibold">+{formatINR(purchase.taxTotal)}</span>
                </div>
              )}
              {purchase.freightTotal > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>{language === 'hi' ? 'भाड़ा / माल ढुलाई' : 'Freight / Transport'}:</span>
                  <span className="font-semibold">+{formatINR(purchase.freightTotal)}</span>
                </div>
              )}
              <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-slate-900 font-black text-sm">
                <span>{language === 'hi' ? 'कुल देय (Grand Total)' : 'Grand Total'}:</span>
                <span>{formatINR(purchase.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 text-xs font-bold pt-1">
                <span>{language === 'hi' ? 'भुगतान किया गया' : 'Amount Paid'}:</span>
                <span>{formatINR(purchase.amountPaid || 0)}</span>
              </div>
              <div className="flex justify-between text-rose-700 text-xs font-bold">
                <span>{language === 'hi' ? 'बकाया रकम' : 'Balance Due'}:</span>
                <span>{formatINR(purchase.amountOutstanding)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-end text-center text-xs">
            <div className="w-44 border-t border-slate-400 pt-2 text-slate-600">
              <div className="font-bold text-slate-800">{t('receiverSignature')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{language === 'hi' ? 'हस्ताक्षर व तारीख' : 'Sign & Date'}</div>
            </div>

            <div className="w-44 border-t border-slate-400 pt-2 text-slate-600">
              <div className="font-bold text-slate-800">{t('authorizedSignatory')}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{language === 'hi' ? 'मोहर व हस्ताक्षर' : 'Seal & Signature'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
