import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET(request) {
  // Cookie'den kullanıcı e-postasını al
  const cookies = request.headers.get('cookie');
  const emailCookie = cookies?.match(/user_email=([^;]+)/);
  const email = emailCookie ? decodeURIComponent(emailCookie[1]) : null;

  if (!email) {
    return NextResponse.json({ role: 'guest' });
  }

  try {
    // Veritabanı bağlantısı
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'userdb',
    });

    // Kullanıcı rolünü kontrol et
    const [rows] = await connection.execute(
      'SELECT role FROM users WHERE user_email = ?',
      [email]
    );

    await connection.end();

    // Kullanıcı bulunduysa rolünü döndür
    if (rows.length > 0) {
      return NextResponse.json({ role: rows[0].role });
    } else {
      return NextResponse.json({ role: 'guest' });
    }
  } catch (error) {
    console.error('Hata:', error);
    return NextResponse.json({ role: 'guest', error: 'Sunucu hatası.' });
  }
}
