import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Camera, RefreshCw, X, Check, AlertCircle } from 'lucide-react';

export const WebcamCaptureModal = ({ isOpen, onClose, onPhotoCaptured }) => {
  const { t } = useLanguage();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [photoDataUrl, setPhotoDataUrl] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const startCamera = async () => {
    try {
      setIsInitializing(true);
      setCameraError(null);
      setPhotoDataUrl(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam API not supported');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Webcam access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? t('permissionDenied')
          : err.message || t('cameraUnavailable')
      );
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setPhotoDataUrl(null);
    }
    return () => stopCamera();
  }, [isOpen]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPhotoDataUrl(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setPhotoDataUrl(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (photoDataUrl && onPhotoCaptured) {
      fetch(photoDataUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File(
            [blob],
            `webcam_${new Date().toISOString().slice(0, 10)}_${Date.now()}.jpg`,
            { type: 'image/jpeg' }
          );
          onPhotoCaptured(file, photoDataUrl);
          onClose();
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl z-10 border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{t('webcamCapture')}</h3>
              <p className="text-xs text-slate-500">{t('webcamHint')}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="py-4">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
              <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
              <div className="text-sm font-semibold text-rose-800">{t('cameraUnavailable')}</div>
              <p className="mt-1 text-xs text-rose-600 max-w-xs">{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-4 rounded-xl bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50"
              >
                {t('retry')}
              </button>
            </div>
          ) : photoDataUrl ? (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-black aspect-video flex items-center justify-center">
                <img
                  src={photoDataUrl}
                  alt="Captured"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={retake}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>{t('retake')}</span>
                </button>
                <button
                  onClick={confirmPhoto}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-blue-700"
                >
                  <Check className="h-4 w-4" />
                  <span>{t('attachPhoto')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black aspect-video flex items-center justify-center">
                {isInitializing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-xs">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" /> {t('startingCamera')}
                  </div>
                )}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex justify-center">
                <button
                  onClick={capturePhoto}
                  className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700"
                >
                  <Camera className="h-4 w-4" />
                  <span>{t('capturePhoto')}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};
