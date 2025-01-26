import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Token doğrulama fonksiyonu (örnek bir mekanizma)
function verifyToken(token) {
  // Burada token doğrulama işlemini yap
  if (token === 'valid-admin-token') {
    return 1; // Örnek kullanıcı ID'si
  }
  return null;
}

export async function GET(request) {
  // Authorization başlığından token'ı al
  const authHeader = request.headers.get('Authorization');
  const token = authHeader ? authHeader.split(' ')[1] : null;
  
  if (!token) {
    return NextResponse.json({ isAdmin: false });
  }

  // Token doğrula ve kullanıcı ID'sini al
  const userId = verifyToken(token);
  if (!userId) {
    return NextResponse.json({ isAdmin: false });
  }

  try {
    // MySQL bağlantısı
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'userdb',
    });

    // Kullanıcı rolünü kontrol et
    const [rows] = await connection.execute(
      'SELECT role FROM users WHERE user_id = ?',
      [userId]
    );

    await connection.end();

    // Kullanıcı admin mi?
    if (rows.length > 0 && rows[0].role === 'admin') {
      return NextResponse.json({ isAdmin: true });
    } else {
      return NextResponse.json({ isAdmin: false });
    }
  } catch (error) {
    console.error('Hata:', error);
    return NextResponse.json({ isAdmin: false, error: 'Sunucu hatası' });
  }
}
