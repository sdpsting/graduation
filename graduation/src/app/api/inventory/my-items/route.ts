// src/app/api/inventory/my-items/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createPool } from 'mysql2/promise'; // Bağlantı havuzu kullanmak daha iyi

// Veritabanı bağlantı bilgileri (ortam değişkenlerinden alınmalı)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'YOUR_SECURE_PASSWORD',
  database: process.env.DB_NAME || 'marketdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = createPool(dbConfig);

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id'); // Middleware'den gelen kullanıcı ID'si

  if (!userId) {
    return NextResponse.json({ success: false, message: 'Yetkisiz işlem: Kullanıcı kimliği bulunamadı.' }, { status: 403 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    console.log(`[API /inventory/my-items] User ${userId} için envanter çekiliyor.`);

    // user_inventory tablosunu items tablosuyla join ederek ürün detaylarını alalım
    // Hangi bilgileri göstermek istediğinize göre SELECT kısmını düzenleyebilirsiniz.
    const query = `
      SELECT 
        ui.inventory_id,         -- Envanter kaydının kendi ID'si
        ui.item_id,              -- Satın alınan ürünün items tablosundaki ID'si
        ui.price_at_purchase,    -- Satın alma anındaki fiyat
        ui.purchase_date,        -- Satın alma tarihi
        i.name AS item_name,     -- Ürünün adı
        i.image AS item_image,   -- Ürünün resmi
        i.wears AS item_wears,   -- Ürünün aşınmışlığı (items tablosundan)
        i.inspect AS item_inspect,
        i.ingame AS item_ingame,
        i.category_name AS item_category
      FROM user_inventory ui
      JOIN items i ON ui.item_id = i.id
      WHERE ui.user_id = ?
      ORDER BY ui.purchase_date DESC; -- En son alınanlar en üstte
    `;

    const [rows] = await connection.execute(query, [userId]);

    return NextResponse.json({ success: true, items: rows });

  } catch (error: any) {
    console.error(`[API /inventory/my-items] Hata (User ${userId}):`, error.message);
    return NextResponse.json(
      { success: false, message: 'Envanter yüklenirken bir sunucu hatası oluştu.', error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}