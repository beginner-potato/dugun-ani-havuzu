import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;

    if (!file) {
      return NextResponse.json({ error: 'Dosya bulunamadı' }, { status: 400 });
    }

    // OAuth Playground'dan aldığın "Refresh token" kutusundaki uzun kodu buraya gir
    const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
    
    const CLIENT_ID = '743555234559-4vdu71k1q0as.apps.googleusercontent.com';
    const CLIENT_SECRET = 'GOCSPX-v1_x_pD6uNnB9l0q9tXF';

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: `Google Token Alınamadı: ${tokenData.error_description || 'Geçersiz Token'}` }, { status: 500 });
    }

    const metadata = {
      name: `dugun_ani_${Date.now()}.${file.type.split('/')[1] || 'jpg'}`,
      mimeType: file.type,
    };

    const driveFormData = new FormData();
    driveFormData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    driveFormData.append('file', file);

    const driveResponse = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: driveFormData,
      }
    );

    const driveData = await driveResponse.json();

    if (driveData.id) {
      return NextResponse.json({ success: true, fileId: driveData.id });
    } else {
      return NextResponse.json({ error: `Drive Hatası: ${driveData.error?.message || 'Yüklenemedi'}` }, { status: 500 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}