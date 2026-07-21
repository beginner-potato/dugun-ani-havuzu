'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import QRCode from 'qrcode';

export default function AdminPanel() {
  const [gelin, setGelin] = useState('');
  const [damat, setDamat] = useState('');
  const [slug, setSlug] = useState('');
  const [driveSaklamaGunu, setDriveSaklamaGunu] = useState(7); // Varsayılan Drive süresi 7 gün
  const [dugunler, setDugunler] = useState<any[]>([]);
  const [secilenQr, setSecilenQr] = useState<string | null>(null);
  const [secilenCift, setSecilenCift] = useState('');
  const [loading, setLoading] = useState(false);

  const dugunleriGetir = async () => {
    const { data, error } = await supabase
      .from('dugunler')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setDugunler(data);
  };

  useEffect(() => {
    dugunleriGetir();
  }, []);

  const havuzOlustur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gelin || !damat || !slug) return;

    setLoading(true);

    const simdi = new Date();

    // 1. Misafir Yükleme Süresi: HER ZAMAN SABİT 1 GÜN (24 Saat)
    const expireAt = new Date(simdi);
    expireAt.setDate(expireAt.getDate() + 1);

    // 2. Drive Depolama Süresi: Seçilen esnek güne göre hesaplanıyor (7, 15, 30 gün)
    const driveDeleteAt = new Date(simdi);
    driveDeleteAt.setDate(driveDeleteAt.getDate() + Number(driveSaklamaGunu));

    const { error } = await supabase.from('dugunler').insert([
      {
        gelin_adi: gelin,
        damat_adi: damat,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        expire_at: expireAt.toISOString(),
        drive_delete_at: driveDeleteAt.toISOString(),
      },
    ]);

    setLoading(false);

    if (!error) {
      setGelin('');
      setDamat('');
      setSlug('');
      setDriveSaklamaGunu(7); // Varsayılana geri çek
      dugunleriGetir();
      alert('🎉 Düğün havuzu (1 gün yükleme) ve Drive saklama süresi başarıyla oluşturuldu!');
    } else {
      alert('❌ Bir hata oluştu veya bu URL (slug) zaten kullanımda.');
    }
  };

  const qrKodUret = async (ciftSlug: string, ciftIsim: string) => {
    try {
      const siteUrl = `${window.location.origin}/${ciftSlug}`;
      const qrDataUrl = await QRCode.toDataURL(siteUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#1c1917',
          light: '#ffffff',
        },
      });
      setSecilenQr(qrDataUrl);
      setSecilenCift(ciftIsim);
    } catch (err) {
      console.error(err);
    }
  };

  // Kalan Drive saklama süresini gösteren şık yardımcı fonksiyon
  const driveDurumHesapla = (deleteDateStr: string) => {
    if (!deleteDateStr) return <span className="text-stone-400 text-xs">-</span>;
    
    const simdi = new Date();
    const bitis = new Date(deleteDateStr);
    const farkMs = bitis.getTime() - simdi.getTime();
    
    if (farkMs <= 0) {
      return <span className="text-rose-600 font-bold text-xs uppercase">Drive'dan Silindi</span>;
    }
    
    const kalanGun = Math.ceil(farkMs / (1000 * 60 * 60 * 24));
    return <span className="text-amber-700 font-semibold text-xs">{kalanGun} Gün Sonra Silinecek</span>;
  };

  // Misafirlerin durumunu (Havuzun açık olup olmadığını) gösteren fonksiyon
  const havuzDurumHesapla = (expireDateStr: string) => {
    const simdi = new Date();
    const bitis = new Date(expireDateStr);
    return simdi > bitis 
      ? <span className="text-rose-500 font-medium text-xs">Yüklemeye Kapalı</span> 
      : <span className="text-emerald-600 font-medium text-xs">Yükleme Aktif (1 Gün)</span>;
  };

  return (
    <div className="min-h-screen bg-[#fcf9f5] p-6 font-sans antialiased text-stone-800">
      <div className="max-w-6xl mx-auto">
        
        {/* Üst Başlık */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-stone-900">FOTOĞRAFÇI YÖNETİM PANELİ</h1>
            <p className="text-xs text-stone-500 mt-1">Misafirlere 1 gün yükleme izni verilir. Drive temizlik süresi panelden yönetilir.</p>
          </div>
          <div className="bg-[#a47e5b] text-white text-xs font-bold px-3 py-1.5 rounded-full tracking-widest uppercase">
            Süre Otomasyonu Aktif
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Sol Form: Yeni Kayıt */}
          <div className="bg-white p-6 rounded-2xl border border-stone-200/60 shadow-sm h-fit">
            <h2 className="text-sm font-bold tracking-wider uppercase text-stone-700 mb-4">✨ Yeni Havuz Oluştur</h2>
            
            <form onSubmit={havuzOlustur} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Gelin Adı</label>
                <input 
                  type="text" required value={gelin} onChange={(e) => setGelin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[#a47e5b]" 
                  placeholder="Örn: Aslı"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Damat Adı</label>
                <input 
                  type="text" required value={damat} onChange={(e) => setDamat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-[#a47e5b]" 
                  placeholder="Örn: Esra"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Özel Link Uzantısı (Slug)</label>
                <div className="flex items-center">
                  <span className="bg-stone-50 border border-r-0 border-stone-200 px-2.5 py-2 rounded-l-xl text-xs text-stone-400">/</span>
                  <input 
                    type="text" required value={slug} onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3 py-2 rounded-r-xl border border-stone-200 text-sm focus:outline-none focus:border-[#a47e5b]" 
                    placeholder="asli-esra"
                  />
                </div>
              </div>

              {/* GÜNCELLENEN DRIVE ESNEK SÜRE AYARI */}
              <div>
                <label className="block text-[11px] font-bold text-stone-500 uppercase mb-1">Google Drive Depolama Süresi</label>
                <select 
                  value={driveSaklamaGunu} 
                  onChange={(e) => setDriveSaklamaGunu(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white focus:outline-none focus:border-[#a47e5b]"
                >
                  <option value={7}>7 Gün (Standart Paket)</option>
                  <option value={15}>15 Gün (Uzatılmış Paket)</option>
                  <option value={30}>30 Gün (Premium Arşiv)</option>
                </select>
                <p className="text-[10px] text-stone-400 mt-1">Fotoğraflar bu sürenin sonunda Drive'dan uçurulur.</p>
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-stone-900 text-white text-xs font-bold py-3 rounded-xl hover:bg-stone-800 tracking-wider uppercase transition-colors"
              >
                {loading ? 'KAYDEDİLİYOR...' : 'KAYDET VE AKTİF ET'}
              </button>
            </form>
          </div>

          {/* Sağ Kolon: Liste ve İkili Süre Durumu */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold tracking-wider uppercase text-stone-700">📸 Aktif Düğünler ve Silinme Takvimi</h2>
            
            {dugunler.length === 0 ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-sm text-stone-400">
                Henüz tanımlanmış bir düğün havuzu bulunmuyor.
              </div>
            ) : (
              <div className="bg-white border border-stone-200/60 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-100 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                      <th className="p-4">Çiftler</th>
                      <th className="p-4">Misafir Erişimi</th>
                      <th className="p-4">Drive Temizlik Durumu</th>
                      <th className="p-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {dugunler.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-stone-900 uppercase">{d.gelin_adi} & {d.damat_adi}</div>
                          <div className="text-[11px] text-stone-400 font-mono mt-0.5">/{d.slug}</div>
                        </td>
                        <td className="p-4">
                          {havuzDurumHesapla(d.expire_at)}
                        </td>
                        <td className="p-4">
                          {driveDurumHesapla(d.drive_delete_at)}
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => qrKodUret(d.slug, `${d.gelin_adi} & ${d.damat_adi}`)}
                            className="bg-[#f5ede4] text-[#a47e5b] border border-[#ede1d4] hover:bg-[#ede1d4] text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                          >
                            🔲 QR Kod
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* QR Kod Modalı */}
        {secilenQr && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl border border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-tight">{secilenCift}</h3>
              <div className="my-6 p-2 bg-stone-50 rounded-2xl flex items-center justify-center">
                <img src={secilenQr} alt="Düğün QR Kod" className="w-full h-auto rounded-xl" />
              </div>
              <div className="space-y-2">
                <a 
                  href={secilenQr} download={`qr_${secilenCift.toLowerCase().replace(/\s+/g, '_')}.png`}
                  className="block w-full bg-[#a47e5b] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#8e6e50] text-center"
                >
                  📥 İndir
                </a>
                <button onClick={() => setSecilenQr(null)} className="w-full bg-stone-100 text-stone-600 text-xs font-bold py-2.5 rounded-xl">
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}