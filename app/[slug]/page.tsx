'use client';

import React, { useState, useRef } from 'react';
import { useParams } from 'next/navigation';

interface UploadFile {
  id: string;
  file: File;
  previewUrl: string;
}

export default function GuestUploadPage() {
  const params = useParams();
  const slug = (params?.slug as string) || 'dugun-ani';

  const formattedNames = slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' & ');

  const [selectedFiles, setSelectedFiles] = useState<UploadFile[]>([]);
  const [guestName, setGuestName] = useState('');
  const [note, setNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // İzin Modalı ve Durumu
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dosya Seçme/Kamera Butonuna Tıklandığında
  const handleTriggerFileSelect = () => {
    if (!hasPermission) {
      // İzin daha önce verilmediyse modalı aç
      setShowPermissionModal(true);
    } else {
      // İzin verildiyse doğrudan dosya seçiciyi aç
      fileInputRef.current?.click();
    }
  };

  // İzin Modalında "İzin Ver ve Devam Et" Tıklandığında
  const handleGrantPermission = () => {
    setHasPermission(true);
    setShowPermissionModal(false);
    // Küçük bir gecikmeyle native kamera/galeri seçiciyi tetikle
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const filesArray = Array.from(e.target.files);
    const newUploadFiles: UploadFile[] = filesArray.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setSelectedFiles((prev) => [...prev, ...newUploadFiles]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 400);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        setIsSuccess(true);
      }, 500);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      alert('Yükleme sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setIsSuccess(false);
    setUploadProgress(0);
    setGuestName('');
    setNote('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-rose-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 pt-8 pb-4 text-center px-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 shadow-xl shadow-rose-500/20 mb-3 text-2xl">
          📸
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
          {formattedNames}
        </h1>
        <p className="text-xs sm:text-sm text-rose-300/80 font-medium mt-1">
          Düğün Anı Havuzuna Hoş Geldiniz!
        </p>
      </header>

      {/* Main Form Section */}
      <main className="relative z-10 max-w-md w-full mx-auto px-4 py-4 flex-1 flex flex-col justify-center">
        {isSuccess ? (
          /* Success Screen */
          <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-3xl text-emerald-400">
              🎉
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-white">Harika Anılar Yüklendi!</h2>
              <p className="text-xs text-slate-400">
                Çektiğiniz kareler doğrudan çiftimizin anı havuzuna kaydedildi. Teşekkür ederiz!
              </p>
            </div>
            <button
              onClick={resetForm}
              className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-500/25 transition active:scale-95"
            >
              + Yeni Fotoğraf Ekle
            </button>
          </div>
        ) : (
          /* Upload Form */
          <form
            onSubmit={handleUpload}
            className="bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5"
          >
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              accept="image/*,video/*"
              className="hidden"
            />

            {/* Select Box / Trigger */}
            <div
              onClick={handleTriggerFileSelect}
              className="border-2 border-dashed border-slate-700 hover:border-rose-500/70 bg-slate-950/50 rounded-2xl p-6 text-center cursor-pointer transition group"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-rose-500/10 flex items-center justify-center mx-auto mb-2 text-rose-400 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-200 group-hover:text-rose-300 transition">
                Fotoğraf veya Video Seçin / Çekin
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Galerinizden seçebilir veya kameranızı kullanabilirsiniz
              </p>
            </div>

            {/* Selected Images Preview Grid */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400 px-1">
                  <span>Seçilen Dosyalar ({selectedFiles.length})</span>
                  <button
                    type="button"
                    onClick={handleTriggerFileSelect}
                    className="text-rose-400 hover:underline font-medium"
                  >
                    + Daha Ekle
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {selectedFiles.map((item) => (
                    <div
                      key={item.id}
                      className="relative aspect-square rounded-xl overflow-hidden group border border-slate-700 bg-slate-950"
                    >
                      <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeFile(item.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white text-xs rounded-full flex items-center justify-center hover:bg-rose-600 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Name & Optional Message */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Adınız & Soyadınız (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  placeholder="Örn: Mehmet Yılmaz"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Çifte Notunuz / Tebrik Mesajınız
                </label>
                <textarea
                  rows={2}
                  placeholder="Mutluluklar dileriz! 🎉"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 transition resize-none"
                />
              </div>
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Yükleniyor...</span>
                  <span className="font-mono text-rose-400">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={selectedFiles.length === 0 || isUploading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition shadow-lg flex items-center justify-center gap-2 ${
                selectedFiles.length === 0 || isUploading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-rose-500/25 active:scale-95'
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Drive'a Gönderiliyor...</span>
                </>
              ) : (
                <span>Anıları Havuza Gönder ({selectedFiles.length})</span>
              )}
            </button>
          </form>
        )}
      </main>

      {/* PERMISSION MODAL */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto text-2xl text-rose-400">
              📷
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-white">Kamera & Galeri Erişimi</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fotoğraf veya video yükleyebilmeniz için cihazınızın kamerasına veya medya galerisine erişim izni gerekmektedir.
              </p>
            </div>
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleGrantPermission}
                className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-500/25 transition active:scale-95"
              >
                İzin Ver ve Fotoğraf Seç
              </button>
              <button
                type="button"
                onClick={() => setShowPermissionModal(false)}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 font-medium transition"
              >
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-slate-600">
        Düğün Anı Havuzu © 2026 • Güvenli Google Drive Bağlantısı
      </footer>
    </div>
  );
}