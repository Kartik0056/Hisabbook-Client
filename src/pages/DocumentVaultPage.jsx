import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../services/api';
import { formatFileSize, formatDate } from '../utils/formatters';
import { WebcamCaptureModal } from '../components/modals/WebcamCaptureModal';
import { PhonePairingModal } from '../components/modals/PhonePairingModal';
import {
  FolderLock,
  Upload,
  Camera,
  Smartphone,
  Search,
  Filter,
  FileText,
  Image as ImageIcon,
  Trash2,
  Eye,
  X,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export const DocumentVaultPage = () => {
  const { activeProject } = useAuth();
  const { t } = useLanguage();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [pairingOpen, setPairingOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Upload Form
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('bill');
  const [docNotes, setDocNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const loadDocuments = async () => {
    if (!activeProject) return;
    try {
      setLoading(true);
      const params = {};
      if (typeFilter) params.documentType = typeFilter;
      if (search) params.search = search;

      const res = await api.getDocuments(params);
      if (res.success) {
        setDocuments(res.data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [activeProject?._id, typeFilter, search]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (filesToUpload.length === 0) {
      setError('Please select at least one file.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const formData = new FormData();
      filesToUpload.forEach((f) => formData.append('files', f));
      formData.append('title', docTitle.trim() || filesToUpload[0].name);
      formData.append('documentType', docType);
      formData.append('notes', docNotes.trim());

      const res = await api.uploadDocuments(formData);
      if (res.success) {
        setUploadModalOpen(false);
        setFilesToUpload([]);
        setDocTitle('');
        setDocNotes('');
        await loadDocuments();
      }
    } catch (err) {
      setError(err.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this document from the vault?')) return;
    try {
      const res = await api.deleteDocument(id);
      if (res.success) {
        await loadDocuments();
      }
    } catch (err) {
      alert(err.message || 'Error deleting document.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & 3-Channel Capture Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderLock className="h-6 w-6 text-blue-600" />
            <span>Document Vault (दस्तावेज़ व फोटो)</span>
          </h1>
          <p className="text-xs text-slate-500">
            Secure storage for bills, payment screenshots, challans, and site photos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Channel 1: Wi-Fi Phone Connect */}
          <button
            onClick={() => setPairingOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 shadow-sm hover:bg-emerald-100 transition"
          >
            <Smartphone className="h-4 w-4 text-emerald-600" />
            <span>Phone Wi-Fi QR</span>
          </button>

          {/* Channel 2: PC Webcam */}
          <button
            onClick={() => setWebcamOpen(true)}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Camera className="h-4 w-4 text-blue-600" />
            <span>PC Webcam</span>
          </button>

          {/* Channel 3: Local File Upload */}
          <button
            onClick={() => {
              setFilesToUpload([]);
              setError('');
              setUploadModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition"
          >
            <Upload className="h-4 w-4" />
            <span>Upload Files</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search document by title or filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-600 shadow-sm"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none shadow-sm"
        >
          <option value="">All Document Types (सभी दस्तावेज़)</option>
          <option value="bill">Contractor / Material Bill</option>
          <option value="receipt">Cash Receipt / Voucher</option>
          <option value="payment_screenshot">UPI / Bank Screenshot</option>
          <option value="challan">Delivery Challan / Weight Slip</option>
          <option value="photo_progress">Site Work Progress Photo</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Document Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : documents.length > 0 ? (
          documents.map((doc) => {
            const isImage = doc.mimeType?.startsWith('image/');
            const fileUrl = `/api/documents/${doc._id}/file`;

            return (
              <div
                key={doc._id}
                className="group rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                {/* Visual Preview / Thumbnail */}
                <div
                  onClick={() => setPreviewDoc(doc)}
                  className="relative aspect-video sm:aspect-square bg-slate-100 flex items-center justify-center cursor-pointer overflow-hidden"
                >
                  {isImage ? (
                    <img
                      src={fileUrl}
                      alt={doc.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <FileText className="h-12 w-12 text-rose-500 mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">PDF Document</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="rounded-full bg-slate-900/60 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold text-white uppercase">
                      {doc.documentType.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Info & Footer */}
                <div className="p-3">
                  <h4 className="font-bold text-xs text-slate-800 truncate" title={doc.title}>
                    {doc.title || doc.originalFileName}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{formatDate(doc.documentDate || doc.createdAt)}</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline"
                    >
                      <span>Open</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>

                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="text-slate-300 hover:text-rose-500 transition"
                      title="Delete from Vault"
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
            <FolderLock className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <div className="text-sm font-semibold text-slate-600">Document Vault is Empty</div>
            <p className="text-xs text-slate-400 mt-1">
              Upload bills, photos, and payment slips directly from your PC or paired mobile phone.
            </p>
          </div>
        )}
      </div>

      {/* UPLOAD MODAL */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setUploadModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Upload to Document Vault</h3>
              </div>
              <button
                onClick={() => setUploadModalOpen(false)}
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

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-3.5">
              {/* File Drop Area */}
              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                <label className="inline-block cursor-pointer rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                  Select Files
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files) {
                        setFilesToUpload(Array.from(e.target.files));
                      }
                    }}
                    className="hidden"
                  />
                </label>
                <div className="text-[11px] text-slate-400 mt-2">
                  Supports JPEG, PNG, WebP, and PDF (Up to 15MB each)
                </div>
                {filesToUpload.length > 0 && (
                  <div className="mt-3 text-xs font-semibold text-emerald-700">
                    {filesToUpload.length} file(s) selected: {filesToUpload.map((f) => f.name).join(', ')}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. March Cement Supplier Invoice..."
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Document Type
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none"
                >
                  <option value="bill">Contractor / Material Bill</option>
                  <option value="receipt">Cash / Labour Receipt</option>
                  <option value="payment_screenshot">UPI / Bank Screenshot</option>
                  <option value="challan">Delivery Challan / Weight Slip</option>
                  <option value="photo_progress">Site Work Progress Photo</option>
                  <option value="other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows="2"
                  placeholder="Any extra remarks..."
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Upload Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setPreviewDoc(null)}
          />
          <div className="relative max-w-3xl w-full rounded-3xl bg-white p-4 shadow-2xl z-10 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm truncate">
                {previewDoc.title || previewDoc.originalFileName}
              </span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950 rounded-2xl my-2">
              {previewDoc.mimeType?.startsWith('image/') ? (
                <img
                  src={`/api/documents/${previewDoc._id}/file`}
                  alt="Preview"
                  className="max-h-[70vh] max-w-full object-contain rounded-lg"
                />
              ) : (
                <iframe
                  src={`/api/documents/${previewDoc._id}/file`}
                  title="PDF Preview"
                  className="w-full h-[65vh] rounded-lg bg-white"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>Uploaded on {formatDate(previewDoc.createdAt)}</span>
              <a
                href={`/api/documents/${previewDoc._id}/file`}
                download={previewDoc.originalFileName}
                className="rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700"
              >
                Download File
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modals for Webcam and Pairing */}
      <WebcamCaptureModal
        isOpen={webcamOpen}
        onClose={() => setWebcamOpen(false)}
        onPhotoCaptured={async (file) => {
          const form = new FormData();
          form.append('files', file);
          form.append('title', `Webcam Capture ${new Date().toLocaleTimeString('en-IN')}`);
          form.append('documentType', 'receipt');
          await api.uploadDocuments(form);
          await loadDocuments();
        }}
      />

      <PhonePairingModal
        isOpen={pairingOpen}
        onClose={() => setPairingOpen(false)}
        onDocumentsReceived={async () => {
          await loadDocuments();
        }}
      />
    </div>
  );
};
