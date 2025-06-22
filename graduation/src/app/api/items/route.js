// src/app/api/items/route.js
import { NextResponse } from 'next/server';
import { createPool } from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234', // .env.local dosyanızda olmalı
  database: process.env.DB_NAME || 'marketdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // charset: 'utf8mb4_unicode_ci' // Gerekirse karakter seti
};

let pool;
try {
    pool = createPool(dbConfig);
    console.log("[ITEMS API] Veritabanı bağlantı havuzu başarıyla oluşturuldu.");
} catch (error) {
    console.error("[ITEMS API] Veritabanı bağlantı havuzu oluşturulamadı:", error);
    // Pool oluşturulamazsa, API istekleri hata verecektir.
    // Bu durumu handle etmek için bir mekanizma eklenebilir veya uygulamanın başlaması engellenebilir.
}

export async function GET(request) {
  let connection;
  try {
    if (!pool) {
        console.error("[ITEMS API] Veritabanı havuzu mevcut değil. İstek işlenemiyor.");
        return NextResponse.json(
          { message: "Sunucu yapılandırma hatası: Veritabanı bağlantısı kurulamadı." },
          { status: 500 }
        );
    }

    connection = await pool.getConnection();
    // console.log("[ITEMS API] Havuzdan bağlantı başarıyla alındı.");

    // ---- SQL SORGUSU GÜNCELLENDİ: seller_name users tablosundan JOIN ile eklendi ----
    const query = `
      SELECT 
        i.id, 
        i.name, 
        i.image, 
        i.wears, 
        i.price, 
        i.previous_price,
        i.inspect, 
        i.ingame, 
        i.status, 
        i.category_name,
        i.seller_id,
        u.user_name AS seller_name 
      FROM items i
      LEFT JOIN users u ON i.seller_id = u.id 
      WHERE i.status = 'available' 
      ORDER BY i.id DESC
    `;
    // --------------------------------------------------------------------
    
    const [rows] = await connection.execute(query);
    // console.log(`[ITEMS API] Sorgu başarılı, ${rows.length} item çekildi.`);

    return NextResponse.json(rows);

  } catch (error) {
    console.error("API /api/items GET hatası:", error.message);
    // if (error.sqlMessage) { /* ... */ } // Bu kısım aynı kalabilir
    return NextResponse.json(
      { 
        message: "Ürünler yüklenirken bir sunucu hatası oluştu.", 
        errorDetail: error.message,
        sqlError: error.sqlMessage || null,
        errorCode: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        connection.release();
        // console.log("[ITEMS API] Veritabanı bağlantısı havuza geri bırakıldı.");
      } catch (releaseError) {
        console.error("[ITEMS API] Bağlantı serbest bırakılırken hata:", releaseError.message);
      }
    }
  }
}