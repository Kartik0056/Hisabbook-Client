import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Smartphone,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';

export const PhoneUploadPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('receipt');
  const [uploading, setUploading] = useState(false);
  const [successCount, setSuccessCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMessage('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please capture or select a photo first.');
      return;
    }
    if (!token) {
      setErrorMessage('Missing pairing token. Please rescan QR code from PC.');
      return;
    }

    try {
      setUploading(true);
      setErrorMessage('');

      const formData = new FormData();
      formData.append('files', selectedFile);
      formData.append('title', docTitle || `Mobile Photo ${new Date().toLocaleTimeString('en-IN')}`);
      formData.append('documentType', docType);

      const res = await fetch(`/api/pairing/upload?token=${token}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Upload failed.');
      }

      setSuccessCount((prev) => prev + 1);
      setSelectedFile(null);
      setPreviewUrl(null);
      setDocTitle('');
    } catch (err) {
      setErrorMessage(err.message || 'Error transferring photo to PC.');
    } finally {
      setUploading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-white">
        <div className="max-w-xs text-center space-y-3">
          <AlertCircle className="h-12 w-12 text-rose-500 mx-auto" />
          <h1 className="text-lg font-bold">Invalid QR Link</h1>
          <p className="text-xs text-slate-400">
            Please scan the QR code displayed on the Hisabbook PC dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl">
      {/* Mobile Header */}
      <header className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
            <Smartphone className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">Hisabbook Mobile Sync</div>
            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Connected to PC
            </div>
          </div>
        </div>
        {successCount > 0 && (
          <span className="rounded-full bg-emerald-600/30 border border-emerald-500 px-2 py-0.5 text-xs text-emerald-300 font-bold">
            {successCount} Sent
          </span>
        )}
      </header>

      {/* Main Upload Box */}
      <main className="p-4 flex-1 flex flex-col justify-center">
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-slate-300 bg-black aspect-square flex items-center justify-center shadow-lg">
              <img
                src={previewUrl}
                alt="Selected"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Photo label (e.g. Cement receipt, Diesel slip)..."
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-blue-600"
              />

              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 outline-none"
              >
                <option value="bill">Supplier / Contractor Bill</option>
                <option value="receipt">Cash / Labour Receipt</option>
                <option value="payment_screenshot">UPI / Bank Screenshot</option>
                <option value="challan">Delivery Challan / Weight Slip</option>
                <option value="photo_progress">Site Work Progress Photo</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="rounded-xl border border-slate-300 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Retake
              </button>
              <button
                type="button"
                disabled={uploading}
                onClick={handleUpload}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Sending to PC...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Send to PC</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            {successCount > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-4 text-emerald-800 flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <span className="text-xs font-bold">
                  Photo #{successCount} received on your PC!
                </span>
              </div>
            )}

            <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-8 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Camera className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Snap Bill or Site Photo
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Transfers instantly over Wi-Fi directly into your project vault on PC
                </p>
              </div>

              {/* Direct Camera Button */}
              <label className="flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 active:scale-98 transition cursor-pointer">
                <Camera className="h-4 w-4" />
                <span>Take Photo with Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {/* Gallery Pick Button */}
              <label className="flex items-center justify-center gap-2 w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-semibold text-slate-700 active:scale-98 transition cursor-pointer">
                <ImageIcon className="h-4 w-4 text-slate-500" />
                <span>Choose from Gallery / Files</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}
      </main>

      <footer className="p-3 text-center text-[10px] text-slate-400 bg-white border-t border-slate-200">
        Same Wi-Fi Direct Peer Transfer • End-to-End Encrypted
      </footer>
    </div>
  );
};
