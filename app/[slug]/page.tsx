'use client';

import { useState, use } from 'react';

export default function WeddingUploadPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [progressText, setProgressText] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgressText(`${i + 1} / ${files.length} yükleniyor...`);

        const base64Data = await toBase64(file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: slug,
            fileName: file.name,
            fileBase64: base64Data,
            mimeType: file.type,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.error || 'Yükleme başarısız oldu.');
        }
      }

      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Bir hata oluştu.');
    } finally {
      setUploading(false);
      setProgressText('');
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Code = result.split(',')[1];
        resolve(base64Code);
      };
      reader.onerror = (error) => reject(error);
    });

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
        <h1 className="text-2xl font-bold mb-2 text-pink-500">Düğün Anı Havuzu 📸</h1>
        <p className="text-slate-400 text-sm mb-6">
          Bu düğünde çektiğin anıları anında çiftin albümüne gönder!
        </p>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6 font-medium">
            🎉 Fotoğraflar başarıyla yüklendi! Harikasın!
          </div>
        ) : null}

        {error ? (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl mb-6 text-sm">
            ❌ {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          {/* 1. Seçenek: Galeriden Çoklu Seçim */}
          <label className={`w-full flex items-center justify-center gap-3 bg-pink-600 hover:bg-pink-500 text-white font-semibold py-4 px-6 rounded-xl cursor-pointer transition shadow-lg shadow-pink-600/20 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-xl">🖼️</span>
            <span>{uploading ? progressText : 'Galeriden Fotoğraf Seç'}</span>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>

          {/* 2. Seçenek: Direkt Kamera ile Çek */}
          <label className={`w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-4 px-6 rounded-xl cursor-pointer transition border border-slate-700 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-xl">📷</span>
            <span>Kamera ile Hemen Çek</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>
    </main>
  );
}