// src/app/api/items/route.js

import { NextResponse } from 'next/server';
import { createConnection } from 'mysql2/promise'; // Eğer havuz kullanmıyorsanız bu kalır

// Veritabanı bağlantı bilgileri
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'YOUR_SECURE_PASSWORD', // GERÇEK ŞİFRENİZİ KULLANIN (.env.local)
  database: process.env.DB_NAME || 'marketdb',
  // Havuz kullanmıyorsanız waitForConnections, connectionLimit, queueLimit'e gerek yok
};

export async function GET(request) { // request parametresi Next.js App Router'da standarttır
  let connection;
  try {
    console.log(`[ITEMS API] Connecting to database: '${dbConfig.database}' on host '${dbConfig.host}' with user '${dbConfig.user}'`);
    
    connection = await createConnection(dbConfig); // Her istekte yeni bağlantı (performans için pool daha iyidir)
    console.log("[ITEMS API] Successfully connected to the database.");

    // ---- DEĞİŞİKLİK: SQL SORGUSUNA `category_name` EKLENDİ ----
    const query = `
      SELECT 
        id, 
        name, 
        image, 
        wears, 
        price, 
        inspect, 
        ingame, 
        status, 
        category_name  -- Bu sütunu items tablonuzdan seçiyoruz
      FROM items 
      WHERE status = 'available' 
      ORDER BY id DESC
    `;
    // ----------------------------------------------------------
    
    console.log("[ITEMS API] Executing query:", query);
    const [rows] = await connection.execute(query); // execute<RowDataPacket[]> tipini kullanabilirsiniz eğer .ts dosyası olsaydı
    console.log(`[ITEMS API] Query successful, ${rows.length} items fetched.`);

    return NextResponse.json(rows);

  } catch (error) { // error'a tip vermek (any veya Error) iyi bir pratiktir
    console.error("API /api/items GET hatası:", error.message); // error.message daha spesifik olabilir
    if (error.sqlMessage) { // MySQL'den gelen spesifik hata
      console.error("SQL Error:", error.sqlMessage, "SQL State:", error.sqlState, "Error No:", error.errno);
    }
    return NextResponse.json(
      { 
        message: "Ürünler yüklenirken bir sunucu hatası oluştu.", 
        errorDetail: error.message, // error.message daha açıklayıcı
        sqlError: error.sqlMessage || null, // SQL hatası varsa onu da gönderelim
        errorCode: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.end(); // Her istekte yeni bağlantı açılıyorsa end() ile kapatılır
        console.log("[ITEMS API] Database connection closed.");
      } catch (closeError) {
        console.error("[ITEMS API] Bağlantı kapatılırken ek hata:", closeError.message);
      }
    }
  }
}