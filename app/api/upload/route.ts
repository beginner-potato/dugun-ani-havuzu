import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slug, fileName, fileBase64, mimeType } = body;

    if (!fileBase64 || !slug) {
      return NextResponse.json(
        { success: false, error: 'Eksik dosya veya düğün bilgisi.' },
        { status: 400 }
      );
    } 

    const scriptUrl = 'https://script.google.com/macros/s/AKfycbz1A9fJ0etViudPpsidMyjsMN6kZHkVoJrrZRTrOZG6hU6mQmYpX3zQ3fkUgGg-X69y/exec';
    if (!scriptUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Script URL konfigüre edilmemiş.' },
        { status: 500 }
      );
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        slug,
        fileName: fileName || `photo-${Date.now()}.jpg`,
        fileBase64,
        mimeType: mimeType || 'image/jpeg',
      }),
    });

    const textResponse = await response.text();
    let result;
    try {
      result = JSON.parse(textResponse);
    } catch (e) {
      console.error('Google Raw Response:', textResponse);
      throw new Error('Google Drive bağlantı yanıtı işlenemedi.');
    }

    if (result.status === 'success') {
      return NextResponse.json({
        success: true,
        fileId: result.fileId,
        fileUrl: result.fileUrl,
      });
    } else {
      throw new Error(result.message || 'Drive yükleme hatası.');
    }
  } catch (err: any) {
    console.error('Upload Route Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Sunucu hatası.' },
      { status: 500 }
    );
  }
}