/* eslint-disable */
'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white flex flex-col justify-between">
      
      {/* Header / Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-rose-500/20">
              💍
            </div>
            <span className="font-serif font-bold text-xl tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Misafir Günlüğü
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition shadow-sm"
            >
              Yönetici Paneli Girişi
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center space-y-10 my-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs sm:text-sm font-medium animate-pulse">
          <span>✨</span> Profesyonel Düğün Fotoğrafçıları İçin Yeni Nesil Anı Havuzu
        </div>

        <div className="space-y-6 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-serif font-bold text-white tracking-tight leading-[1.1]">
            En Güzel Düğün Anıları, <br />
            <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              Tek Tıkla Google Drive'da.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Uygulama indirme derdi yok! Masalara koyacağınız QR kodlar ile misafirler saniyeler içinde fotoğraflarını yüklesin, doğrudan sizin Google Drive klasörünüzde depolansın.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/admin"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-sm bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-xl shadow-rose-500/25 transition transform active:scale-95 text-center"
          >
            Hemen Panele Git 🚀
          </Link>
          <a
            href="#ozellikler"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl font-medium text-sm bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition text-center"
          >
            Nasıl Çalışır?
          </a>
        </div>

        {/* Feature Grid */}
        <div id="ozellikler" className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 text-left">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 space-y-3 backdrop-blur">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center text-lg font-bold border border-rose-500/20">
              ⚡
            </div>
            <h3 className="font-bold text-white text-base">Işık Hızında Sıkıştırma</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Misafirler devasa boyutlu fotoğraflar seçse bile telefonlarında anında sıkıştırılır, kota derdi biter.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 space-y-3 backdrop-blur">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-lg font-bold border border-amber-500/20">
              🖨️
            </div>
            <h3 className="font-bold text-white text-base">QR Masa Kartları</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Her düğün için özel tasarlanmış QR kartlarını tek tıkla PNG olarak indirip matbaada bastırabilirsiniz.
            </p>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 space-y-3 backdrop-blur">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-lg font-bold border border-emerald-500/20">
              📂
            </div>
            <h3 className="font-bold text-white text-base">Google Drive Entegrasyonu</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tüm dosyalar doğrudan sizin belirlediğiniz Drive klasörüne akar. Belirlediğiniz süre sonunda otomatik kilitlenir.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>© 2026 Misafir Günlüğü — Tüm Hakları Saklıdır.</p>
      </footer>
    </div>
  );
}