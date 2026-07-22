'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Güvenli ve stabil istemci tanımı
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Wedding {
  id: string;
  coupleNames: string;
  slug: string;
  date: string;
  photoCount: number;
  maxPhotos: number;
  status: 'active' | 'scheduled' | 'completed';
  driveUrl?: string;
}

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard states
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedQrWedding, setSelectedQrWedding] = useState<Wedding | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Wedding Form State
  const [newCouple, setNewCouple] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newMaxPhotos, setNewMaxPhotos] = useState(500);
  const [newRetentionDays, setNewRetentionDays] = useState(30); // 👈 Yeni eklenen saklama süresi (gün)

  // Oturum kontrolü
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Oturum açıldıktan sonra Supabase'den düğünleri çek
  useEffect(() => {
    if (session) {
      fetchWeddings();
    }
  }, [session]);

  const fetchWeddings = async () => {
    const { data, error } = await supabase
      .from('dugunler')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Düğünler çekilemedi:', error);
    } else if (data) {
      const formatted: Wedding[] = data.map((item: any) => ({
        id: item.id,
        coupleNames: `${item.gelin_adi || ''} & ${item.damat_adi || ''}`,
        slug: item.slug,
        date: item.created_at ? item.created_at.split('T')[0] : '2026-08-15',
        photoCount: 0,
        maxPhotos: 500,
        status: 'active' as const,
        driveUrl: item.drive_folder_id || ''
      }));

      setWeddings(formatted);
    }
  };

  // Düğün havuzunu silme fonksiyonu
  const handleDeleteWedding = async (id: string, coupleNames: string) => {
    if (!confirm(`"${coupleNames}" düğün havuzunu kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }

    const { error } = await supabase
      .from('dugunler')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Silme hatası:', error);
      showToast('❌ Silinirken bir hata oluştu!');
    } else {
      showToast('🗑️ Düğün havuzu başarıyla silindi.');
      fetchWeddings(); // Listeyi tazele
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError('Giriş başarısız: E-posta veya şifre hatalı.');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    }
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/admin';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCoupleNameChange = (val: string) => {
    setNewCouple(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/&/g, 've')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    const uniqueSlug = `${generatedSlug}-${Math.random().toString(36).substring(2, 6)}`;
    setNewSlug(uniqueSlug);
  };

  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouple || !newSlug) return;

    const names = newCouple.split('&').map((n) => n.trim());
    const gelinAdi = names[0] || newCouple;
    const damat_adi = names[1] || '';

    // Seçilen gün sayısına göre expire_at tarihini otomatik hesaplıyoruz
    const finalDate = newDate ? new Date(newDate) : new Date();
    if (!newDate) {
      finalDate.setDate(finalDate.getDate() + Number(newRetentionDays));
    }
    finalDate.setHours(23, 59, 59, 999);

    const newEntry = {
      gelin_adi: gelinAdi,
      damat_adi: damat_adi,
      slug: newSlug,
      drive_folder_id: 'https://drive.google.com',
      expire_at: finalDate.toISOString(),
      storage_retention_days: Number(newRetentionDays) // 👈 Veritabanına gönderilen süre
    };

    const { data, error } = await supabase.from('dugunler').insert([newEntry]).select();

    if (error) {
      console.error('Supabase Detaylı Hata:', error);
      alert(`Kayıt Hatası: ${error.message} (Kod: ${error.code})`);
      return;
    }

    if (error) {
      console.error('Kayıt hatası:', error);
      showToast('❌ Hata: Bu web adresi (slug) zaten alınmış olabilir!');
      return;
    }

    fetchWeddings();
    setIsAddModalOpen(false);
    setNewCouple('');
    setNewSlug('');
    setNewDate('');
    setNewRetentionDays(30);
    showToast('🎉 Yeni düğün Supabase veritabanına kaydedildi!');
  };

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    showToast('📋 Yükleme linki panoya kopyalandı!');
  };

  const filteredWeddings = weddings.filter((w) => {
    const matchesSearch = w.coupleNames.toLowerCase().includes(searchTerm.toLowerCase()) || w.slug.includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || w.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPhotos = weddings.reduce((acc, w) => acc + w.photoCount, 0);
  const activeWeddingsCount = weddings.filter((w) => w.status === 'active').length;

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-rose-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-rose-500/20">
              💍
            </div>
            <h1 className="text-2xl font-bold text-white">Yönetici Girişi</h1>
            <p className="text-xs text-slate-400">Düğün Anı Havuzu Kontrol Paneli</p>
          </div>

          {authError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs text-center font-medium">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">E-posta Adresi</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@fotografci.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Şifre</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25 transition cursor-pointer"
            >
              Güvenli Giriş Yap
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-rose-500/20">
              💍
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Düğün Anı Havuzu
              </h1>
              <p className="text-xs text-slate-400">Yönetim Paneli</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Google Drive Bağlı
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer z-50"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-rose-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 backdrop-blur">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Toplam Düğün</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{weddings.length}</span>
              <span className="text-xs text-slate-400">Kayıtlı Havuz</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 backdrop-blur">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Aktif Canlı Havuzlar</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-400">{activeWeddingsCount}</span>
              <span className="text-xs text-emerald-500/80 font-medium">Şu an açık</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 backdrop-blur">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Yüklenen Fotoğraf</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-rose-400">{totalPhotos}</span>
              <span className="text-xs text-slate-400">Adet Medya</span>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5 backdrop-blur">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Drive Kota Durumu</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-amber-400">%12</span>
              <span className="text-xs text-slate-400">15 GB / 100 GB</span>
            </div>
          </div>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Düğün veya çift ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {['all', 'active', 'scheduled', 'completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg capitalize transition ${
                    filterStatus === st
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st === 'all' ? 'Tümü' : st === 'active' ? 'Aktif' : st === 'scheduled' ? 'Planlanan' : 'Tamamlandı'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-rose-500/25 transition transform active:scale-95 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Yeni Düğün Ekle
          </button>
        </div>

        {/* Weddings List / Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWeddings.map((wedding) => {
            const progressPercent = Math.min(Math.round((wedding.photoCount / wedding.maxPhotos) * 100), 100);

            return (
              <div
                key={wedding.id}
                className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-600 transition group relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition">
                        {wedding.coupleNames}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">/{wedding.slug}</p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        wedding.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : wedding.status === 'scheduled'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {wedding.status === 'active' ? 'Aktif' : wedding.status === 'scheduled' ? 'Bekliyor' : 'Bitti'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-5">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Tarih: {wedding.date}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mb-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Yüklenen Fotoğraf</span>
                      <span className="font-semibold text-slate-200">
                        {wedding.photoCount} / {wedding.maxPhotos}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => setSelectedQrWedding(wedding)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 hover:text-white transition text-xs font-medium gap-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    QR Kartı
                  </button>

                  <button
                    onClick={() => copyToClipboard(wedding.slug)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 hover:text-white transition text-xs font-medium gap-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Kopyala
                  </button>

                  <a
                    href={wedding.driveUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 hover:text-white transition text-xs font-medium gap-1"
                  >
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                    Drive
                  </a>

                  <button
                    onClick={() => handleDeleteWedding(wedding.id, wedding.coupleNames)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition text-xs font-medium gap-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2.002 2.002 0 0116.138 21H7.862a2.002 2.002 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Modal 1: Create New Wedding */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Yeni Düğün Havuzu Oluştur</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWedding} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Gelin & Damat İsimleri
                </label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Ayşe & Ahmet"
                  value={newCouple}
                  onChange={(e) => handleCoupleNameChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Özel Web Adresi (Slug)
                </label>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400">
                  <span className="text-slate-500 mr-1">dugun.app/</span>
                  <input
                    type="text"
                    required
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="bg-transparent text-slate-100 focus:outline-none w-full font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Düğün Tarihi
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Max Fotoğraf Limiti
                  </label>
                  <input
                    type="number"
                    value={newMaxPhotos}
                    onChange={(e) => setNewMaxPhotos(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* 👈 YENİ EKLENEN KISIM: Drive'da Saklama Süresi (Gün) */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Drive Saklama Süresi (Gün Olarak)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={newRetentionDays}
                  onChange={(e) => setNewRetentionDays(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">Bu süre dolduğunda havuz otomatik olarak kilitlenir.</p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 transition cursor-pointer"
                >
                  Havuzu Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Printable QR Card View */}
      {selectedQrWedding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col items-center space-y-6">
            <div className="w-full flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">QR Yazdırılabilir Kart</h3>
              <button
                onClick={() => setSelectedQrWedding(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="w-full bg-gradient-to-b from-rose-50 to-amber-50 p-6 rounded-3xl text-slate-800 text-center shadow-xl border-4 border-white flex flex-col items-center space-y-4">
              <div className="text-2xl font-serif font-bold text-rose-900">
                {selectedQrWedding.coupleNames}
              </div>
              <p className="text-xs uppercase tracking-widest text-rose-700 font-semibold">
                Düğün Anı Havuzu
              </p>

              <div className="p-3 bg-white rounded-2xl shadow-inner border border-rose-100">
                <img
                  src={`https://quickchart.io/qr?text=${encodeURIComponent(
                    typeof window !== 'undefined'
                      ? `${window.location.origin}/${selectedQrWedding.slug}`
                      : `https://dugun.app/${selectedQrWedding.slug}`
                  )}&size=200&margin=1&ecLevel=H`}
                  alt="QR Code"
                  className="w-48 h-48 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">📸 En Güzel Anılarınızı Paylaşın!</p>
                <p className="text-[11px] text-slate-500 max-w-[220px]">
                  Telefonunuzun kamerasını QR koda doğrultarak fotoğraflarınızı anında yükleyebilirsiniz.
                </p>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-3">
              <button
                onClick={() => window.print()}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                🖨️ Karta Yazdır
              </button>
              <button
                onClick={() => {
                  copyToClipboard(selectedQrWedding.slug);
                  setSelectedQrWedding(null);
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition cursor-pointer"
              >
                🔗 Linki Al
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}