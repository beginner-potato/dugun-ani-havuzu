import Link from 'next/link';

export const runtime = 'edge';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-6 font-sans">
      {/* Üst Alan */}
      <div className="w-full max-w-md text-center space-y-4 pt-12">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-3xl shadow-xl shadow-rose-500/20">
          💍
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-serif font-bold text-white tracking-wide">
            Düğün Anı Havuzu
          </h1>
          <p className="text-xs uppercase tracking-widest text-rose-400 font-semibold">
            QR Kod ile Anı Paylaşım Platformu
          </p>
        </div>
      </div>

      {/* Orta Kart / Açıklama */}
      <div className="w-full max-w-md my-8 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6 text-center">
        <p className="text-sm text-slate-300 leading-relaxed">
          En özel gününüzdeki tüm kareler misafirlerinizin lensinden doğrudan Google Drive arşivinizde toplansın. Hızlı, şık ve zahmetsiz!
        </p>

        <div className="pt-2 space-y-3">
          <Link
            href="/admin"
            className="w-full block py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold text-sm transition shadow-lg shadow-rose-500/25"
          >
            Yönetici Paneline Giriş 🚀
          </Link>
        </div>
      </div>

      {/* Alt Bilgi */}
      <footer className="text-center text-[11px] text-slate-500 pb-4">
        Düğün Anı Havuzu Sistemi ✨
      </footer>
    </main>
  );
}