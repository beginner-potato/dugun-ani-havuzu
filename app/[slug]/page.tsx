'use client';

import { useState, use } from 'react';
import { supabase } from '@/lib/supabase';

export default function WeddingUploadPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Dosya seçilip yükle butonuna basıldığında
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    setSuccess(false);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Dosyayı Base64 formatına çeviriyoruz
        const base64Data = await toBase64(file);

        // Next.js API route'umuza gönderiyoruz
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
    }
  };

  // Helper: Dosyayı Base64'e çevir
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // "data:image/jpeg;base64,..." kısmını atıp sadece saf base64'ü alıyoruz
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
          Bu düğünde çektiğin fotoğraf ve videoları anında çiftin albümüne gönder!
        </p>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl mb-6">
            🎉 Fotoğraflar başarıyla yüklendi! Harikasın!
          </div>
        ) : null}

        {error ? (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl mb-6">
            ❌ {error}
          </div>
        ) : null}

        <label className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-pink-500/50 rounded-2xl p-8 cursor-pointer hover:bg-pink-500/5 transition ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="text-4xl mb-2">📤</div>
          <span className="font-semibold text-pink-400">
            {uploading ? 'Yükleniyor, Lütfen Bekle...' : 'Fotoğraf / Video Seç'}
          </span>
          <span className="text-xs text-slate-500 mt-1">İstediğin kadar çoklu seçebilirsin</span>
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </label>
      </div>
    </main>
  );
}