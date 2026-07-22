'use client';
const REAL_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzFViXBdHK9gXPhRQnyuEMzlqqe_y5uwhm4HA7l6_HGFdZyUNtUAgPkBVNrYmHb6ViY/exec";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { useParams } from 'next/navigation';
export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function WeddingUploadPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [wedding, setWedding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [guestName, setGuestName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState(false);

  // Slug adresine göre veritabanından düğün bilgilerini çek
  useEffect(() => {
    if (slug) {
      fetchWeddingDetails();
    }
  }, [slug]);

  const fetchWeddingDetails = async () => {
    const { data, error } = await supabase
      .from('dugunler')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      console.error('Düğün bulunamadı:', error);
    } else {
      setWedding(data);
    }
    setLoading(false);
  };

  // Dosya seçme
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  // Seçilen bir fotoğrafı listeden çıkarma
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Fotoğrafları Google Apps Script (Drive) Web App'e gönderen gerçek fonksiyon
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(30);

    try {
      // YENİ VE DOĞRU GOOGLE APPS SCRIPT URL'N BURAYA ENTEGRE EDİLDİ
      const scriptUrl = 'https://script.google.com/macros/s/AKfycbzFViXBdHK9gXPhRQnyuEMzlqqe_y5uwhm4HA7l6_HGFdZyUNtUAgPkBVNrYmHb6ViY/exec';

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Dosyayı Base64 formatına çeviriyoruz
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => {
            const result = reader.result as string;
            const base64Code = result.split(',')[1];
            resolve(base64Code);
          };
          reader.onerror = (error) => reject(error);
        });

        // Apps Script'in beklediği JSON yapısı
        const payload = {
          slug: slug,
          fileBase64: base64Data,
          fileName: file.name,
          mimeType: file.type || 'image/jpeg'
        };

        // Apps Script'e POST isteği atıyoruz
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
      }

      setUploading(false);
      setSuccessMessage(true);
      setSelectedFiles([]);

      // Kutlama konfeti efekti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

    } catch (err) {
      console.error('Yükleme hatası:', err);
      alert('Fotoğraflar yüklenirken bir hata oluştu!');
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500"></div>
      </div>
    );
  }

  if (!wedding) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="space-y-3 max-w-md">
          <div className="text-4xl">🔍</div>
          <h1 className="text-xl font-bold">Düğün Havuzu Bulunamadı</h1>
          <p className="text-xs text-slate-400">Aradığınız düğün anı havuzu aktif değil veya böyle bir adres bulunmuyor.</p>
        </div>
      </main>
    );
  }

  const isClosed = wedding.expire_at ? new Date(wedding.expire_at) < new Date() : false;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 font-sans">
      {/* Header */}
      <div className="w-full max-w-md text-center space-y-3 pt-6">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-2xl shadow-xl shadow-rose-500/20">
          💍
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
            {wedding.gelin_adi} & {wedding.damat_adi}
          </h1>
          <p className="text-xs uppercase tracking-widest text-rose-400 font-semibold mt-1">
            Düğün Anı Havuzu
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-md my-6 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        {isClosed ? (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 mx-auto bg-slate-800 border border-slate-700 text-slate-400 rounded-full flex items-center justify-center text-2xl">
              🔒
            </div>
            <h3 className="text-xl font-bold text-white">Havuz Kapandı</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Bu düğün anı havuzu arşive kaldırılmıştır. Katılımınız ve paylaştığınız güzel anılar için teşekkür ederiz!
            </p>
          </div>
        ) : successMessage ? (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center text-2xl animate-bounce">
              ✨
            </div>
            <h3 className="text-xl font-bold text-white">Harikasınız!</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fotoğraflarınız başarıyla havuza eklendi. Çifte mutluluklar dileriz!
            </p>
            <button
              onClick={() => setSuccessMessage(false)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer"
            >
              Yeni Fotoğraf Yükle
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Adınız Soyadınız (İsteğe Bağlı)
              </label>
              <input
                type="text"
                placeholder="Örn: Merve & Burak"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            {/* Dosya Seçim Alanı */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Fotoğraf veya Video Seçin
              </label>
              <label className="border-2 border-dashed border-slate-700 hover:border-rose-500 bg-slate-800/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition group">
                <svg className="w-8 h-8 text-rose-400 mb-2 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-slate-300">Galeriden Seçmek İçin Dokunun</span>
                <span className="text-[10px] text-slate-500 mt-1">Birden fazla fotoğraf seçebilirsiniz</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Seçilen Dosyaların Listesi */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400">Seçilenler ({selectedFiles.length} Dosya):</p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded-xl text-xs">
                      <span className="truncate max-w-[240px] text-slate-300">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-rose-400 hover:text-rose-300 font-bold ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Yükleme İlerleme Çubuğu */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Yükleniyor...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={selectedFiles.length === 0 || uploading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition shadow-lg ${
                selectedFiles.length === 0 || uploading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-rose-500/25 cursor-pointer'
              }`}
            >
              {uploading ? 'Yükleniyor...' : 'Anıları Havuza Gönder 🚀'}
            </button>
          </form>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 pb-4">
        Düğün Anı Havuzu Sistemi ✨
      </footer>
    </main>
  );
}