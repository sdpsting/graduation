// src/app/api/admin/users/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createPool } from 'mysql2/promise'; // Bağlantı havuzu kullanmak daha iyi

// Veritabanı bağlantı bilgileri
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'marketdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = createPool(dbConfig);

export async function GET(request: NextRequest) {
  // Middleware zaten rol kontrolü yapmış olmalı, ama burada ek bir güvence olarak
  // x-user-role header'ını kontrol edebiliriz.
  // Ancak, middleware'in işini doğru yaptığını varsayarak bu kontrolü atlayabiliriz
  // ya da daha merkezi bir yetkilendirme fonksiyonu kullanabiliriz.
  // Şimdilik, middleware'e güveniyoruz.

  const requestUserRole = request.headers.get('x-user-role');
  if (requestUserRole !== 'admin') {
      // Bu durum normalde middleware tarafından yakalanmalı.
      // Eğer buraya kadar geldiyse, middleware'de bir sorun olabilir veya bu yol matcher'a eklenmemiş olabilir.
      // Middleware'in bu yolu koruduğundan emin olun!
      console.warn("[API /admin/users] Yetkisiz erişim denemesi (middleware atlatılmış olabilir?) Rol:", requestUserRole);
      return NextResponse.json({ success: false, message: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    console.log("[API /admin/users] Admin kullanıcısı için tüm kullanıcılar çekiliyor.");

    // Şifre hash'ini ASLA frontend'e göndermeyin!
    // İhtiyaç duyulan alanları seçin: id, user_name, user_email, role, balance, steam_id, created_at (varsa)
    // `users` tablonuzdaki sütun adlarına göre güncelleyin.
    const query = `
      SELECT id, user_name, user_email, role, balance, steam_id 
      FROM users
      ORDER BY id ASC; 
    `;
    // Belki bir created_at sütununuz varsa ona göre sıralama da yapabilirsiniz.

    const [rows] = await connection.execute(query);

    return NextResponse.json({ success: true, users: rows });

  } catch (error: any) {
    console.error("[API /admin/users] Kullanıcıları çekerken hata:", error.message);
    return NextResponse.json(
      { success: false, message: 'Kullanıcı listesi yüklenirken bir sunucu hatası oluştu.', error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}