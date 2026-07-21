import { NextResponse } from 'next/server';

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

    const scriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      return NextResponse.json(
        { success: false, error: 'Google Script URL konfigüre edilmemiş.' },
        { status: 500 }
      );
    }

    // Google Apps Script Webhook'una istek atıyoruz
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slug,
        fileName: fileName || `photo-${Date.now()}.jpg`,
        fileBase64,
        mimeType: mimeType || 'image/jpeg',
      }),
    });

    const result = await response.json();

    if (result.status === 'success') {
      return NextResponse.json({
        success: true,
        fileId: result.fileId,
        fileUrl: result.fileUrl,
      });
    } else {
      console.error('Google Script Error:', result.message);
      return NextResponse.json(
        { success: false, error: result.message || 'Drive yükleme hatası.' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('Upload Route Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Sunucu hatası.' },
      { status: 500 }
    );
  }
}