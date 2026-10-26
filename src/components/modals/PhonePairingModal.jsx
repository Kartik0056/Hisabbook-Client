import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../services/api';
import { formatFileSize } from '../../utils/formatters';
import {
  X,
  Smartphone,
  RefreshCw,
  CheckCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

export const PhonePairingModal = ({ isOpen, onClose, onDocumentsReceived }) => {
  const { t } = useLanguage();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [pollingInterval, setPollingInterval] = useState(null);

  const initSession = async () => {
    try {
      setLoading(true);
      const res = await api.createPairingSession();
      if (res.success) {
        setSession(res);
        setUploadedDocs([]);
      }
    } catch (err) {
      console.error('Pairing session initialization error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      initSession();
    } else {
      setSession(null);
      setUploadedDocs([]);
      if (pollingInterval) clearInterval(pollingInterval);
    }
  }, [isOpen]);

  // Polling to detect received files from phone
  useEffect(() => {
    if (!session?.token) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getPairingSessionStatus(session.token);
        if (res.success && res.documents) {
          setUploadedDocs(res.documents);
          if (onDocumentsReceived) {
            onDocumentsReceived(res.documents);
          }
        }
      } catch (err) {
        console.error('Session poll failed:', err);
      }
    }, 2500);

    setPollingInterval(interval);
    return () => clearInterval(interval);
  }, [session?.token]);

  const copyUrl = () => {
    if (session?.pairingUrl) {
      navigator.clipboard.writeText(session.pairingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t('connectMobileTitle')}
              </h3>
              <p className="text-xs text-slate-500">
                {t('connectMobileHint')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3 text-xs text-slate-500">{t('generatingSession')}</p>
          </div>
        ) : session ? (
          <div className="py-4 space-y-4">
            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4 border border-slate-200">
              <img
                src={session.qrCodeDataUrl}
                alt="Wi-Fi Pairing QR"
                className="h-56 w-56 rounded-xl border border-white shadow-md"
              />
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{t('sessionInfo')}</span>
              </div>
            </div>

            {/* Direct Link Copy */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
              <input
                type="text"
                readOnly
                value={session.pairingUrl}
                className="w-full bg-transparent px-2 text-xs font-mono text-slate-700 outline-none truncate"
              />
              <button
                onClick={copyUrl}
                className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
              >
                {copied ? <CheckCircle className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? t('copied') : t('copy')}</span>
              </button>
              <a
                href={session.pairingUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg p-1 text-slate-400 hover:text-blue-600"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>

            {/* Received Files Live Status */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
                <span className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {t('receivedFromPhone')} ({uploadedDocs.length})
                </span>
                <span className="text-[11px] text-emerald-700 font-normal">{t('listeningOnLan')}</span>
              </div>

              {uploadedDocs.length > 0 ? (
                <div className="mt-2.5 max-h-32 space-y-1.5 overflow-y-auto">
                  {uploadedDocs.map((doc, idx) => (
                    <div
                      key={doc._id || idx}
                      className="flex items-center justify-between rounded-xl bg-white px-3 py-1.5 text-xs border border-emerald-200 shadow-sm"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span className="truncate font-medium text-slate-700">
                          {doc.title || doc.originalFileName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">{formatFileSize(doc.fileSize)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  {t('scanQRInstruction')}
                </p>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
          >
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );
};
