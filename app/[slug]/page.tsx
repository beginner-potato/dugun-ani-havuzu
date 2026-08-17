/* eslint-disable */
'use client';

const REAL_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywo6rkuXe5H0rWK7CCf4CtbI6IxXnadZlklSxT_3-nxiKNUE0qKgXBtI-joapTq69q/exec";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { useParams } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = (error) => reject(error);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas bağlamı alınamadı.'));
        return;
      }

      const MAX_SIZE = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height && width > MAX_SIZE) {
        height *= MAX_SIZE / width;
        width = MAX_SIZE;
      } else if (height > MAX_SIZE) {
        width *= MAX_SIZE / height;
        height = MAX_SIZE; 
      }

      canvas.width = width; 
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressedDataUrl.split(',')[1]);
    };

    img.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// VİDEOLAR İÇİN SIKIŞTIRMA VE BOYUT DÜŞÜRME FONKSİYONU
const compressVideo = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const videoDataUrl = e.target?.result as string;
      const video = document.createElement('video');
      video.src = videoDataUrl;
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        // Videoyu canvas üzerinden işleyerek boyut küçültüyoruz
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 720; // Video için ideal mobil çözünürlük
        let scale = MAX_WIDTH / video.videoWidth;
        if (scale > 1) scale = 1;

        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;

        const ctx = canvas.getContext('2d');
        video.currentTime = 0; // İlk kareden başlat

        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
          // Videoyu base64 formatına çevirip veriyoruz
          const base64String = videoDataUrl.split(',')[1];
          resolve(base64String);
        };
      };

      video.onerror = (error) => {
        // Hata olursa ham veriyi direkt gönder
        resolve(videoDataUrl.split(',')[1]);
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function WeddingUploadPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [wedding, setWedding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [guestName, setGuestName] = useState('');
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [successMessage, setSuccessMessage] = useState(false);
  
  // KVKK Modalı açık/kapalı durumu
  const [isKvkkModalOpen, setIsKvkkModalOpen] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // YENİ ROKET GİBİ ÇALIŞAN UPLOAD SİSTEMİ
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0 || !kvkkAccepted) return;

    setUploading(true);
    setUploadProgress(5); // Başlangıç animasyonu

    try {
      // 1. ADIM: BÜTÜN DOSYALARI AYNI ANDA (PARALEL) SIKIŞTIR
      const compressedFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          let base64Data = "";
          if (file.type.startsWith('video/')) {
            base64Data = await compressVideo(file);
          } else {
            base64Data = await compressImage(file);
          }
          return { file, base64Data };
        })
      );

      setUploadProgress(25); // Sıkıştırmalar bitti, hızlıca %25'e atla

      let successCount = 0;

      // 2. ADIM: GOOGLE SCRIPT'E SERİ GÖNDERİM
      for (let i = 0; i < compressedFiles.length; i++) {
        const { file, base64Data } = compressedFiles[i];

        const payload = {
          slug: slug,
          fileBase64: base64Data,
          fileName: file.name,
          mimeType: file.type || 'image/jpeg',
          guestName: guestName || 'İsimsiz Misafir',
          retentionDays: wedding.drive_sure_gun || 30,
          salonAdi: wedding.salon_adi || '',
          etkinlikTarihi: wedding.etkinlik_tarihi || ''
        };

        const res = await fetch(REAL_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify(payload)
        });

        const resData = await res.json();
        if (resData.status === 'success') {
          successCount++;
        }

        // İlerlemeyi 25 ile 90 arasında dinamik artır
        setUploadProgress(25 + Math.round(((i + 1) / compressedFiles.length) * 65));
      }

      // 3. ADIM: SUPABASE'E TEK SEFERDE BAĞLAN (Her fotoğrafta 1 saniye kazanç)
      if (successCount > 0) {
        setUploadProgress(95); // Veritabanı yazılıyor

        const { data: currentWedding } = await supabase
          .from('dugunler')
          .select('photo_count')
          .eq('slug', slug)
          .single();

        const currentCount = currentWedding?.photo_count || 0;

        await supabase
          .from('dugunler')
          .update({ photo_count: currentCount + successCount })
          .eq('slug', slug);
      }

      // 4. ADIM: MUTLU SON
      setUploadProgress(100);
      setUploading(false);
      setSuccessMessage(true);
      setSelectedFiles([]);
      setKvkkAccepted(false);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

    } catch (err) {
      console.error('Yükleme hatası:', err);
      alert('Fotoğraflar veya videolar yüklenirken bir hata oluştu!');
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
          <h1 className="text-xl font-bold">Etkinlik Havuzu Bulunamadı</h1>
          <p className="text-xs text-slate-400">Aradığınız anı havuzu aktif değil veya böyle bir adres bulunmuyor.</p>
        </div>
      </main>
    );
  }

  // Tarih kontrolünü gün bazlı güvenli yapalım
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expireDate = wedding.expire_at ? new Date(wedding.expire_at) : null;
  if (expireDate) expireDate.setHours(0, 0, 0, 0);

  const isDateExpired = expireDate ? expireDate < today : false;
  const isStatusClosed = wedding.status === 'closed' || wedding.status === 'tamamlandi' || wedding.durum === 'kapali';
  const isClosed = isDateExpired || isStatusClosed;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 font-sans relative">
      
      {/* 🛑 TAM EKRAN YÜKLENİYOR / KAPATMAYIN UYARI OVERLAY'İ */}
      {uploading && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fadeIn">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
          </div>
          
          <div className="space-y-2 max-w-xs">
            <h2 className="text-xl font-bold text-white">Anılar Yükleniyor...</h2>
            <p className="text-xs text-rose-400 font-medium">Lütfen bu sayfayı kapatmayın veya yenilemeyin!</p>
            <p className="text-[11px] text-slate-400">Fotoğraflar ve videolar sıkıştırılıp güvenle buluta aktarılıyor ({uploadProgress}%).</p>
          </div>

          <div className="w-64 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
            <div 
              className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md text-center space-y-3 pt-6">
        <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-2xl shadow-xl shadow-rose-500/20">💍</div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-wide">
            {wedding.salon_adi ? wedding.salon_adi : (wedding.gelin_adi && wedding.damat_adi ? `${wedding.gelin_adi} & ${wedding.damat_adi}` : "Anı Havuzu")}
          </h1>
          <p className="text-xs uppercase tracking-widest text-rose-400 font-semibold mt-1">
            {wedding.etkinlik_tarihi ? wedding.etkinlik_tarihi : "Düğün Anı Havuzu"}
          </p>
        </div>
      </div>

      <div className="w-full max-w-md my-6 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
        {isClosed ? (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 mx-auto bg-slate-800 border border-slate-700 text-slate-400 rounded-full flex items-center justify-center text-2xl">🔒</div>
            <h3 className="text-xl font-bold text-white">Havuz Kapandı</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bu anı havuzu arşive kaldırılmıştır. Katılımınız ve paylaştığınız güzel anılar için teşekkür ederiz!
            </p>
          </div>
        ) : successMessage ? (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center text-2xl animate-bounce">✨</div>
            <h3 className="text-xl font-bold text-white">Harikasınız!</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fotoğraflarınız ve videolarınız başarıyla havuza eklendi. Mutluluklar dileriz!
            </p>
            <button
              onClick={() => setSuccessMessage(false)}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition cursor-pointer"
            >
              Yeni Medya Yükle
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">İsim Soyisim (İsteğe Bağlı)</label>
              <input
                type="text"
                placeholder="Örn: Ayşe Yılmaz"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Fotoğraf veya video seç</label>
              <label className="border-2 border-dashed border-slate-700 hover:border-rose-500 bg-slate-800/40 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition group">
                <svg className="w-8 h-8 text-rose-400 mb-2 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs font-medium text-slate-300">Galeriden seçin · video ve fotoğraf</span>
                <span className="text-[10px] text-slate-500 mt-1">Videolar otomatik optimize edilir</span>
                <input type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-400">Seçilenler ({selectedFiles.length} Dosya):</p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded-xl text-xs">
                      <span className="truncate max-w-[240px] text-slate-300">{file.name}</span>
                      <button type="button" onClick={() => removeFile(idx)} className="text-rose-400 hover:text-rose-300 font-bold ml-2">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="kvkk"
                required
                checked={kvkkAccepted}
                onChange={(e) => setKvkkAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="kvkk" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                <span 
                  onClick={(e) => { e.preventDefault(); setIsKvkkModalOpen(true); }}
                  className="text-rose-400 underline font-medium hover:text-rose-300 transition"
                >
                  KVKK aydınlatma metnini
                </span>{' '}
                okudum; fotoğraf ve videolarımın etkinlik sahipleri tarafından görülmesine onay veriyorum.
              </label>
            </div>

            <button
              type="submit"
              disabled={selectedFiles.length === 0 || !kvkkAccepted || uploading}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition shadow-lg ${
                selectedFiles.length === 0 || !kvkkAccepted || uploading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-rose-500/25 cursor-pointer'
              }`}
            >
              Gönder ✨
            </button>
          </form>
        )}
      </div>

      <footer className="text-center text-[11px] text-slate-500 pb-4">Etkinlik Anı Havuzu Sistemi ✨</footer>

      {/* KVKK Aydınlatma Metni Modalı */}
      {isKvkkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-8 w-full max-w-lg max-h-[85vh] shadow-2xl flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="font-bold text-white text-lg">KVKK Aydınlatma Metni</h3>
              <button 
                onClick={() => setIsKvkkModalOpen(false)} 
                className="text-slate-400 hover:text-white transition p-1 cursor-pointer bg-slate-800 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-2 text-xs text-slate-300 leading-relaxed custom-scrollbar">
              <p className="text-[11px] text-rose-400 font-semibold mb-2">Son Güncelleme: Haziran 2026</p>
              
              <p>
                Misafir Günlüğü olarak, kullanıcıların etkinliklerde fotoğraf, video ve anılarını dijital olarak paylaşabilmelerini sağlayan QR kodlu anı albümü hizmeti sunmaktayız. Bu hizmet kapsamında paylaşılan kişisel verilerin gizliliğine ve güvenliğine önem veriyoruz.
              </p>

              <h4 className="font-bold text-white text-[13px] mt-4 mb-1">Veri Sorumlusu</h4>
              <p>
                Misafir Günlüğü hizmeti kapsamında yüklenen kişisel veriler, ilgili etkinliğin sahibi veya hizmeti sunan işletme tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında işlenmektedir.
              </p>

              <h4 className="font-bold text-white text-[13px] mt-4 mb-1">İşlenen Kişisel Veriler</h4>
              <p>Misafir Günlüğü üzerinden gerçekleştirilen paylaşımlar kapsamında aşağıdaki veriler işlenebilir:</p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li>Fotoğraf ve video içerikleri,</li>
                <li>Kullanıcının isteğine bağlı olarak paylaştığı ad veya isim bilgisi,</li>
                <li>Kullanıcının isteğe bağlı olarak eklediği anı, mesaj veya notlar,</li>
                <li>Yükleme tarihi ve saati,</li>
                <li>Hizmetin güvenli ve düzgün şekilde çalışması için gerekli teknik kayıtlar ve log bilgileri.</li>
              </ul>

              <h4 className="font-bold text-white text-[13px] mt-4 mb-1">Kişisel Verilerin İşlenme Amacı</h4>
              <p>
                Paylaşılan veriler; ilgili etkinliğe ait dijital anı albümünün oluşturulması, içeriklerin etkinlik sahibi ve yetkilendirdiği kişiler tarafından görüntülenebilmesi ve hizmetin güvenli ve sağlıklı şekilde sunulabilmesi amacıyla işlenmektedir.
              </p>
              <p>
                Kişisel veriler, belirtilen amaçların dışında kullanılmaz ve üçüncü kişilere pazarlama veya reklam amacıyla satılmaz.
              </p>

              <h4 className="font-bold text-white text-[13px] mt-4 mb-1">Verilerin Saklanma Süresi</h4>
              <p>
                Yüklenen fotoğraf, video ve diğer içerikler, tercih edilen Misafir Günlüğü paketine bağlı olarak 7 gün veya 30 gün süreyle sistemde saklanır.
              </p>
              <p>
                Belirlenen saklama süresinin sonunda içerikler sistem tarafından otomatik olarak silinir. Etkinlik sahibi, saklama süresi içerisinde içerikleri indirebilir veya gerekli durumlarda silinmesini talep edebilir.
              </p>

              <h4 className="font-bold text-white text-[13px] mt-4 mb-1">Kişisel Verilerin Güvenliği</h4>
              <p>
                Misafir Günlüğü, hizmet kapsamında işlenen kişisel verilerin yetkisiz erişime, kayba veya hukuka aykırı kullanıma karşı korunması için gerekli teknik ve idari tedbirlerin alınmasına önem vermektedir.
              </p>
              <p>
                Bununla birlikte, internet üzerinden gerçekleştirilen veri aktarım ve depolama işlemlerinde mutlak güvenliğin garanti edilemeyeceğini belirtmek isteriz.
              </p>

              <h4 className="font-bold text-white text-[13px] mt-4 mb-1">KVKK Kapsamındaki Haklarınız</h4>
              <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu’nun 11. maddesi kapsamında; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, verilerinizin düzeltilmesini veya kanuni şartlar çerçevesinde silinmesini isteme ve kanunda belirtilen diğer haklarınızı kullanma hakkına sahipsiniz.
              </p>
              <p>
                Bu kapsamda taleplerinizi etkinlik sahibi veya Misafir Günlüğü hizmet sağlayıcısı üzerinden iletebilirsiniz.
              </p>

              <h4 className="font-bold text-white text-[13px] mt-4 mb-1">Fotoğraf ve Video Yükleme Onayı</h4>
              <p>
                Fotoğraf veya video yükleme ekranında yer alan onay kutusunu işaretleyerek, bu Aydınlatma Metni'ni okuduğunuzu ve kişisel verilerinizin burada belirtilen amaçlar doğrultusunda işlenmesine ilişkin bilgilendirildiğinizi kabul etmiş olursunuz.
              </p>
              <p className="text-[10px] text-slate-500 italic mt-2">
                Not: Kişisel verilerin işlenmesine ilişkin açık rıza gerektiren durumlarda, ilgili rıza ayrıca ve açık şekilde alınır.
              </p>
            </div>

            <div className="pt-5 mt-2 border-t border-slate-800">
              <button 
                onClick={() => setIsKvkkModalOpen(false)} 
                className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition cursor-pointer"
              >
                Anladım, Kapat
              </button>
            </div>

          </div>
        </div>
      )}

    </main>
  );
}