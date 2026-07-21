'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '../../lib/supabase';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function DugunHavuzu({ params }: PageProps) {
  const resolvedParams = use(params);
  
  const [dugun, setDugun] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [süreBittiMi, setSüreBittiMi] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState('');

  useEffect(() => {
    async function dugunVerisiniGetir() {
      if (!resolvedParams?.slug) return;

      const { data, error } = await supabase
        .from('dugunler')
        .select('*')
        .eq('slug', resolvedParams.slug)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      setDugun(data);

      const simdi = new Date();
      const bitis = new Date(data.expire_at);
      if (simdi > bitis) {
        setSüreBittiMi(true);
      }

      setLoading(false);
    }

    dugunVerisiniGetir();
  }, [resolvedParams?.slug]);

  const dosyaYukle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const secilenDosya = e.target.files[0];
    setYukleniyor(true);
    setDurumMesaji('📸 Fotoğrafınız sunucu üzerinden Drive\'a aktarılıyor...');

    try {
      const data = new FormData();
      data.append('file', secilenDosya);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });

      const sonuc = await response.json();

      if (sonuc.success) {
        setYukleniyor(false);
        setDurumMesaji('🎉 BAŞARILI! Fotoğraf Google Drive hesabına yüklendi.');
      } else {
        throw new Error(sonuc.error || 'Sunucu yüklemeyi reddetti.');
      }
    } catch (error: any) {
      setYukleniyor(false);
      setDurumMesaji(`❌ Hata Detayı: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfbf7]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-600 border-r-transparent" />
          <p className="mt-4 text-xs font-semibold tracking-widest uppercase text-stone-500">Anı Havuzu Hazırlanıyor</p>
        </div>
      </div>
    );
  }

  if (!dugun) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfbf7] p-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center border border-stone-100 shadow-xl">
          <span className="text-4xl">🕊️</span>
          <h2 className="mt-4 text-lg font-bold text-stone-800">Havuz Bulunamadı</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#fcf9f5] via-[#f5ede4] to-[#fbf8f3] p-4 antialiased">
      <div className="relative w-full max-w-sm rounded-[32px] bg-white/70 backdrop-blur-xl p-8 shadow-[0_20px_50px_rgba(142,120,98,0.08)] border border-white/80 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f5ede4] text-[#a47e5b] text-xl border border-[#ede1d4]">
          ✨
        </div>
        <h1 className="mt-6 font-sans text-2xl font-black tracking-tight text-stone-800 uppercase">
          {dugun.gelin_adi} <span className="text-[#c19a74] font-light lowercase">&</span> {dugun.damat_adi}
        </h1>
        <div className="mt-8">
          <label className={`group flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
            yukleniyor ? 'border-stone-200 bg-stone-50/40 pointer-events-none' : 'border-[#dccfbf] bg-[#faf7f2]/50 hover:bg-[#faf7f2] hover:border-[#a47e5b]'
          }`}>
            <div className="flex flex-col items-center justify-center p-5">
              {yukleniyor ? <div className="h-7 w-7 animate-spin rounded-full border-2 border-solid border-[#a47e5b] border-r-transparent" /> : <div className="text-3xl mb-3">📸</div>}
              <p className="text-xs font-bold text-stone-700 tracking-wide mt-1">{yukleniyor ? 'MEDYA YÜKLENİYOR...' : 'FOTOĞRAF VEYA VİDEO EKLE'}</p>
            </div>
            <input type="file" accept="image/*,video/*" capture="environment" onChange={dosyaYukle} disabled={yukleniyor} className="hidden" />
          </label>
        </div>
        {durumMesaji && (
          <div className={`mt-6 p-4 rounded-xl text-xs font-semibold border transition-all duration-300 ${durumMesaji.startsWith('🎉') ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-700'}`}>
            {durumMesaji}
          </div>
        )}
      </div>
    </div>
  );
}