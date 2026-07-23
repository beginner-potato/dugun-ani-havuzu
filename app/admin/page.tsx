/* eslint-disable */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Wedding {
  id: string;
  coupleNames: string;
  gelinAdi: string;
  damatAdi: string;
  salonAdi: string;
  etkinlikTarihi: string;
  slug: string;
  date: string;
  createdAtRaw: string;
  photoCount: number;
  maxPhotos: number;
  status: 'active' | 'scheduled' | 'completed';
  driveUrl?: string;
  retentionDays: number;
}

export default function AdminDashboard() {
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Dashboard states
  const [weddings, setWeddings] = useState<Wedding[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [weddingToDelete, setWeddingToDelete] = useState<Wedding | null>(null);
  const [selectedQrWedding, setSelectedQrWedding] = useState<Wedding | null>(null);

  const qrRef = useRef<HTMLDivElement>(null);

  // Form States (Create & Edit)
  const [formId, setFormId] = useState('');
  const [formGelinAdi, setFormGelinAdi] = useState('');
  const [formDamatAdi, setFormDamatAdi] = useState('');
  const [formSalonAdi, setFormSalonAdi] = useState('');
  const [formEtkinlikTarihiText, setFormEtkinlikTarihiText] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formMaxPhotos, setFormMaxPhotos] = useState(500);
  const [formRetentionDays, setFormRetentionDays] = useState(30);

  const fetchWeddings = async () => {
    const { data, error } = await supabase
      .from('dugunler')
      .select('*')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Düğünler çekilemedi:', error);
    } else if (data) {
      const now = new Date();
      const formatted: Wedding[] = data.map((item: any) => {
        const isExpired = item.expire_at ? new Date(item.expire_at) < now : false;
        
        // Gösterim Başlığı Mantığı (Salon varsa o, yoksa Gelin & Damat)
        let displayTitle = "Anı Havuzu";
        if (item.salon_adi) {
          displayTitle = item.salon_adi;
        } else if (item.gelin_adi && item.damat_adi) {
          displayTitle = `${item.gelin_adi} & ${item.damat_adi}`;
        } else if (item.gelin_adi || item.damat_adi) {
          displayTitle = item.gelin_adi || item.damat_adi;
        }

        return {
          id: item.id,
          coupleNames: displayTitle,
          gelinAdi: item.gelin_adi || '',
          damatAdi: item.damat_adi || '',
          salonAdi: item.salon_adi || '',
          etkinlikTarihi: item.etkinlik_tarihi || '',
          slug: item.slug,
          date: item.created_at ? item.created_at.split('T')[0] : '',
          createdAtRaw: item.created_at,
          photoCount: 0,
          maxPhotos: 500,
          status: isExpired ? 'completed' : 'active',
          driveUrl: item.drive_folder_id || '',
          retentionDays: item.drive_sure_gun || 30
        };
      });
      setWeddings(formatted);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchWeddings();
  }, [session]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
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

  const executeDelete = async () => {
    if (!weddingToDelete) return;
    const { error } = await supabase.from('dugunler').delete().eq('id', weddingToDelete.id);
    if (error) {
      showToast('❌ Silinirken bir hata oluştu!');
    } else {
      showToast('🗑️ Düğün havuzu başarıyla silindi.');
      fetchWeddings();
    }
    setWeddingToDelete(null);
  };

  const generateSlug = (gelin: string, damat: string, salon: string) => {
    const base = salon ? salon : `${gelin} ${damat}`;
    if (!base.trim()) return '';
    const generated = base
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
    return `${generated}-${Math.random().toString(36).substring(2, 6)}`;
  };

  const handleNameChange = (type: 'gelin' | 'damat' | 'salon', val: string) => {
    let g = formGelinAdi, d = formDamatAdi, s = formSalonAdi;
    if (type === 'gelin') { g = val; setFormGelinAdi(val); }
    if (type === 'damat') { d = val; setFormDamatAdi(val); }
    if (type === 'salon') { s = val; setFormSalonAdi(val); }

    if (!isEditModalOpen) {
      setFormSlug(generateSlug(g, d, s));
    }
  };

  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSlug) return;

    const retentionDays = Number(formRetentionDays) || 30;
    
    const finalDate = formDate ? new Date(formDate) : new Date();
    if (!formDate) finalDate.setDate(finalDate.getDate() + retentionDays);
    finalDate.setHours(23, 59, 59, 999);

    const newEntry = {
      gelin_adi: formGelinAdi,
      damat_adi: formDamatAdi,
      salon_adi: formSalonAdi,
      etkinlik_tarihi: formEtkinlikTarihiText,
      slug: formSlug,
      drive_folder_id: 'https://drive.google.com',
      expire_at: finalDate.toISOString(),
      drive_sure_gun: retentionDays,
      is_deleted: false
    };

    const { error } = await supabase.from('dugunler').insert([newEntry]);
    if (error) {
      alert(`Kayıt Hatası: ${error.message}`);
      return;
    }

    fetchWeddings();
    setIsAddModalOpen(false);
    resetForms();
    showToast('🎉 Yeni havuz başarıyla oluşturuldu!');
  };

  const openEditModal = (wedding: Wedding) => {
    setFormId(wedding.id);
    setFormGelinAdi(wedding.gelinAdi);
    setFormDamatAdi(wedding.damatAdi);
    setFormSalonAdi(wedding.salonAdi);
    setFormEtkinlikTarihiText(wedding.etkinlikTarihi);
    setFormSlug(wedding.slug);
    setFormDate(wedding.date);
    setFormMaxPhotos(wedding.maxPhotos);
    setFormRetentionDays(wedding.retentionDays);
    setIsEditModalOpen(true);
  };

  const handleUpdateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    const retentionDays = Number(formRetentionDays) || 30;
    
    const currentWedding = weddings.find(w => w.id === formId);
    let finalDate = new Date();
    
    if (currentWedding) {
      finalDate = new Date(currentWedding.createdAtRaw);
      finalDate.setDate(finalDate.getDate() + retentionDays);
      finalDate.setHours(23, 59, 59, 999);
    }

    const updateData = {
      gelin_adi: formGelinAdi,
      damat_adi: formDamatAdi,
      salon_adi: formSalonAdi,
      etkinlik_tarihi: formEtkinlikTarihiText,
      slug: formSlug,
      expire_at: finalDate.toISOString(),
      drive_sure_gun: retentionDays
    };

    const { error } = await supabase.from('dugunler').update(updateData).eq('id', formId);
    if (error) {
      alert(`Güncelleme Hatası: ${error.message}`);
      return;
    }

    fetchWeddings();
    setIsEditModalOpen(false);
    resetForms();
    showToast('✅ Havuz bilgileri başarıyla güncellendi!');
  };

  const resetForms = () => {
    setFormGelinAdi('');
    setFormDamatAdi('');
    setFormSalonAdi('');
    setFormEtkinlikTarihiText('');
    setFormSlug('');
    setFormDate('');
    setFormRetentionDays(30);
    setFormId('');
  };

  const downloadQR = async () => {
    if (!qrRef.current || !selectedQrWedding) return;
    try {
      const canvas = await html2canvas(qrRef.current, { scale: 3, backgroundColor: null });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedQrWedding.slug}-QR.png`;
      a.click();
      showToast('⬇️ QR Kartı görsellerinize indirildi!');
    } catch (err) {
      console.error(err);
      showToast('❌ İndirme başarısız oldu.');
    }
  };

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    showToast('📋 Link panoya kopyalandı!');
  };

  const filteredWeddings = weddings.filter((w) => {
    const searchTarget = `${w.coupleNames} ${w.etkinlikTarihi} ${w.slug}`.toLowerCase();
    const matchesSearch = searchTarget.includes(searchTerm.toLowerCase());
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
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-rose-500/20">💍</div>
            <h1 className="text-2xl font-bold text-white">Yönetici Girişi</h1>
          </div>
          {authError && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs text-center font-medium">{authError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">E-posta Adresi</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-rose-500 transition" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Şifre</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-rose-500 transition" />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 text-white shadow-lg cursor-pointer">Güvenli Giriş Yap</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-10">
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center font-bold text-lg text-white shadow-rose-500/20">💍</div>
            <div>
              <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Düğün Anı Havuzu</h1>
              <p className="text-xs text-slate-400">Yönetim Paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>Google Drive Aktif
            </span>
            <button onClick={handleLogout} className="px-4 py-2 text-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition cursor-pointer">Çıkış Yap</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-rose-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Toplam Düğün</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white">{weddings.length}</span>
              <span className="text-xs text-slate-400">Kayıtlı Havuz</span>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Aktif Havuzlar</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-400">{activeWeddingsCount}</span>
              <span className="text-xs text-emerald-500/80 font-medium">Şu an açık</span>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Yüklenen Fotoğraf</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-rose-400">{totalPhotos}</span>
              <span className="text-xs text-slate-400">Adet Medya</span>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-2xl p-5">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Drive Kota Durumu</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-amber-400">%12</span>
              <span className="text-xs text-slate-400">15 GB / 100 GB</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-800">
          <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
            <div className="relative w-full sm:w-80">
              <input type="text" placeholder="Düğün veya salon ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:border-rose-500 transition" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['all', 'active', 'completed'].map((st) => (
                <button key={st} onClick={() => setFilterStatus(st)} className={`px-3 py-2 text-xs font-medium rounded-lg capitalize transition ${filterStatus === st ? 'bg-rose-500 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'}`}>
                  {st === 'all' ? 'Tümü' : st === 'active' ? 'Aktif' : 'Tamamlandı'}
                </button>
              ))}
            </div>
          </div>
          <button onClick={() => { resetForms(); setIsAddModalOpen(true); }} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-semibold text-sm rounded-xl cursor-pointer">
            + Yeni Etkinlik Ekle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWeddings.map((wedding) => {
            const progressPercent = Math.min(Math.round((wedding.photoCount / wedding.maxPhotos) * 100), 100);

            return (
              <div key={wedding.id} className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-600 transition group relative">
                
                <button 
                  onClick={() => openEditModal(wedding)}
                  className="absolute top-4 right-4 p-2 bg-slate-700/50 hover:bg-slate-600 rounded-lg text-slate-300 transition cursor-pointer"
                  title="Düzenle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>

                <div>
                  <div className="flex items-start justify-between gap-3 mb-3 pr-10">
                    <div>
                      <h3 className="text-xl font-bold text-white group-hover:text-rose-400 transition">{wedding.coupleNames}</h3>
                      {wedding.etkinlikTarihi && <p className="text-xs text-amber-400 font-semibold mt-1">{wedding.etkinlikTarihi}</p>}
                      <p className="text-xs text-slate-400 font-mono mt-1">/{wedding.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${wedding.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'}`}>
                      {wedding.status === 'active' ? '🟢 Aktif' : '⚪ Bitti'}
                    </span>
                    <span className="text-xs text-slate-400">Oluşturuldu: {wedding.date}</span>
                  </div>

                  <div className="space-y-1.5 mb-6">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Yüklenen</span>
                      <span className="font-semibold text-slate-200">{wedding.photoCount} / {wedding.maxPhotos}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-700/50">
                  <button onClick={() => setSelectedQrWedding(wedding)} className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 hover:text-white transition text-xs font-medium gap-1 cursor-pointer">
                    <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                    QR Kart
                  </button>
                  <button onClick={() => copyToClipboard(wedding.slug)} className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 hover:text-white transition text-xs font-medium gap-1 cursor-pointer">
                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Kopyala
                  </button>
                  <a href={`https://drive.google.com/drive/u/0/search?q=${wedding.slug}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-900 hover:bg-slate-700/60 border border-slate-700/50 text-slate-300 hover:text-white transition text-xs font-medium gap-1">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                    Drive
                  </a>
                  <button onClick={() => setWeddingToDelete(wedding)} className="flex flex-col items-center justify-center p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition text-xs font-medium gap-1 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2.002 2.002 0 0116.138 21H7.862a2.002 2.002 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Sil
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* YENİ ETKİNLİK MODALI */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Yeni Etkinlik Havuzu Oluştur</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition p-1 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateWedding} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Gelin Adı (İsteğe Bağlı)</label>
                  <input type="text" placeholder="Örn: Ayşe" value={formGelinAdi} onChange={(e) => handleNameChange('gelin', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Damat Adı (İsteğe Bağlı)</label>
                  <input type="text" placeholder="Örn: Ahmet" value={formDamatAdi} onChange={(e) => handleNameChange('damat', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Salon / Mekan Adı (Varsa)</label>
                  <input type="text" placeholder="Örn: Altınköşk" value={formSalonAdi} onChange={(e) => handleNameChange('salon', e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Görünecek Tarih Yazısı</label>
                  <input type="text" placeholder="Örn: 23.07.2026" value={formEtkinlikTarihiText} onChange={(e) => setFormEtkinlikTarihiText(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Web Adresi (Otomatik Link / Slug)</label>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400">
                  <span className="text-slate-500 mr-1">dugun.app/</span>
                  <input type="text" required value={formSlug} onChange={(e) => setFormSlug(e.target.value)} className="bg-transparent text-white focus:outline-none w-full font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Sistem Kayıt Tarihi (Arka Plan)</label>
                  <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400 focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Drive Saklama (Gün)</label>
                  <input type="number" min="1" max="365" value={formRetentionDays} onChange={(e) => setFormRetentionDays(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition cursor-pointer">İptal</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-lg cursor-pointer">Oluştur</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DÜZENLEME MODALI */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Havuzu Düzenle</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-white transition p-1 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleUpdateWedding} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Gelin Adı</label>
                  <input type="text" value={formGelinAdi} onChange={(e) => setFormGelinAdi(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Damat Adı</label>
                  <input type="text" value={formDamatAdi} onChange={(e) => setFormDamatAdi(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Salon / Mekan Adı</label>
                  <input type="text" value={formSalonAdi} onChange={(e) => setFormSalonAdi(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Görünecek Tarih Yazısı</label>
                  <input type="text" value={formEtkinlikTarihiText} onChange={(e) => setFormEtkinlikTarihiText(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Web Adresi (Slug)</label>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-400">
                  <span className="text-slate-500 mr-1">dugun.app/</span>
                  <input type="text" required value={formSlug} onChange={(e) => setFormSlug(e.target.value)} className="bg-transparent text-white focus:outline-none w-full font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Drive Saklama Süresi (Gün)</label>
                <input type="number" min="1" max="365" value={formRetentionDays} onChange={(e) => setFormRetentionDays(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500" />
                <p className="text-[11px] text-amber-500 mt-1">Süreyi değiştirirseniz havuzun kapanma tarihi baştan hesaplanır.</p>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition cursor-pointer">İptal</button>
                <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg cursor-pointer">Güncelle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SİLME ONAY MODALI */}
      {weddingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 w-full max-w-sm shadow-2xl shadow-rose-500/10 text-center space-y-5">
            <div className="w-16 h-16 mx-auto bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Emin misiniz?</h3>
              <p className="text-sm text-slate-400">
                <strong className="text-rose-400">{weddingToDelete.coupleNames}</strong> havuzunu siliyorsunuz. Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setWeddingToDelete(null)} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition">Vazgeç</button>
              <button onClick={executeDelete} className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition">Evet, Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* QR MODALI */}
      {selectedQrWedding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl flex flex-col items-center space-y-6">
            <div className="w-full flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">QR Masa Kartı</h3>
              <button onClick={() => setSelectedQrWedding(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <div ref={qrRef} className="w-full bg-gradient-to-b from-rose-50 to-amber-50 p-8 rounded-3xl text-slate-800 text-center shadow-xl border-[6px] border-white flex flex-col items-center space-y-5">
              <div>
                <div className="text-3xl font-serif font-bold text-rose-900 leading-tight">{selectedQrWedding.coupleNames}</div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-rose-700 font-bold mt-2">
                  {selectedQrWedding.etkinlikTarihi ? selectedQrWedding.etkinlikTarihi : "Anı Havuzu"}
                </p>
              </div>

              <div className="p-4 bg-white rounded-3xl shadow-md border border-rose-100">
                <img
                  src={`https://quickchart.io/qr?text=${encodeURIComponent(
                    typeof window !== 'undefined' ? `${window.location.origin}/${selectedQrWedding.slug}` : `https://dugun.app/${selectedQrWedding.slug}`
                  )}&size=300&margin=0&ecLevel=H`}
                  alt="QR Code"
                  className="w-48 h-48 rounded-xl"
                  crossOrigin="anonymous"
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-extrabold text-slate-800">📸 En Güzel Anılarınızı Paylaşın!</p>
                <p className="text-xs text-slate-600 font-medium max-w-[240px] leading-relaxed">
                  Kameranızı QR koda doğrultarak fotoğraflarınızı anında yükleyebilirsiniz.
                </p>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-3">
              <button onClick={downloadQR} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer">
                ⬇️ Görsel İndir
              </button>
              <button onClick={() => window.print()} className="w-full py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 transition cursor-pointer">
                🖨️ Yazdır
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}