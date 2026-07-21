'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white flex flex-col justify-between">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-rose-500/15 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header / Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-rose-500/20">
              📸
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Düğün Anı Havuzu
              </span>
              <p className="text-[10px] text-rose-400 font-semibold uppercase tracking-widest">Digital QR Cloud</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/25 transition transform active:scale-95 flex items-center gap-2"
            >
              <span>🔑 Admin Paneline Giriş</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
          Düğün Salonları & Fotoğrafçılar İçin Yeni Nesil Çözüm
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight max-w-4xl leading-tight sm:leading-none">
          Misafirlerin Çektiği Tüm Anılar{' '}
          <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
            Tek Bir Havuzda!
          </span>
        </h1>

        {/* Hero Description */}
        <p className="mt-6 text-slate-400 text-base sm:text-xl max-w-2xl font-normal leading-relaxed">
          Düğün davetlileri masalardaki QR kodu taratarak hiçbir uygulama indirmeden kendi telefonlarından çektikleri fotoğraf ve videoları anında Google Drive havuzunuza yükler.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/admin"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-xl shadow-rose-500/30 transition transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-3"
          >
            <span>Yönetim Panelini İncele</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>

          <Link
            href="/ayse-ahmet"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition flex items-center justify-center gap-2"
          >
            <span>📱 Misafir Ekranı Demosu</span>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-sm hover:border-slate-700 transition group">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              📲
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sıfır İndirme, Anında Erişim</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Davetlilerin App Store veya Play Store'dan uygulama indirmesine gerek kalmaz. Sadece kamerayı QR koda doğrultmak yeterlidir.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-sm hover:border-slate-700 transition group">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              ☁️
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Doğrudan Google Drive Bağlantısı</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Yüklenen tüm medya dosyaları kaliteden ödün vermeden güvenle Google Drive hesabınıza aktarılır.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 p-8 rounded-3xl backdrop-blur-sm hover:border-slate-700 transition group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition">
              🖨️
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Hazır QR Kart Tasarımı</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Yönetim panelinden tek tıkla düğün masalarına yerleştirilecek özel isimli QR baskı kartlarını oluşturup yazdırın.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-8 text-center text-xs text-slate-500">
        <p>Düğün Anı Havuzu Platformu © 2026 • Tüm Hakları Saklıdır.</p>
      </footer>
    </div>
  );
}