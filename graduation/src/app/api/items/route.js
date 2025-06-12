// src/app/api/items/route.js

import { NextResponse } from 'next/server';
import { createPool } from 'mysql2/promise'; // createConnection yerine createPool kullanmak daha iyidir

// Veritabanı bağlantı bilgileri (Pool için de aynı şekilde kullanılabilir)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234', // .env.local dosyanızda olmalı
  database: process.env.DB_NAME || 'marketdb',
  waitForConnections: true, // Pool için
  connectionLimit: 10,    // Pool için
  queueLimit: 0           // Pool için
};

// Bağlantı havuzu oluştur (uygulama başladığında bir kez)
let pool;
try {
    pool = createPool(dbConfig);
    console.log("[ITEMS API] Database pool created successfully.");
} catch (error) {
    console.error("[ITEMS API] Failed to create database pool:", error);
    // Pool oluşturulamazsa, API istekleri hata verecektir.
    // Bu durumu handle etmek için bir mekanizma eklenebilir veya uygulamanın başlaması engellenebilir.
}


export async function GET(request) {
  let connection;
  try {
    if (!pool) {
        // Bu log, pool'un bir önceki try-catch'te oluşup oluşmadığını anlamamıza yardımcı olur.
        console.error("[ITEMS API] Database pool is not available.");
        return NextResponse.json(
          { message: "Sunucu yapılandırma hatası: Veritabanı bağlantısı kurulamadı." },
          { status: 500 }
        );
    }

    // console.log(`[ITEMS API] Attempting to get connection from pool...`);
    connection = await pool.getConnection();
    // console.log("[ITEMS API] Successfully connected to the database via pool.");

    // ---- SQL SORGUSU GÜNCELLENDİ: previous_price ve seller_id eklendi ----
    const query = `
      SELECT 
        id, 
        name, 
        image, 
        wears, 
        price, 
        previous_price, -- İndirim hesaplaması için
        inspect, 
        ingame, 
        status, 
        category_name,
        seller_id  
      FROM items
      WHERE status = 'available' 
    `;
    // --------------------------------------------------------------------
    
    // console.log("[ITEMS API] Executing query:", query);
    const [rows] = await connection.execute(query);
    // console.log(`[ITEMS API] Query successful, ${rows.length} items fetched.`);

    return NextResponse.json(rows); // rows zaten bir dizi, doğrudan döndür

  } catch (error) {
    console.error("API /api/items GET hatası:", error.message);
    if (error.sqlMessage) {
      console.error("SQL Error:", error.sqlMessage, "SQL State:", error.sqlState, "Error No:", error.errno);
    }
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
        connection.release(); // Havuzdan alınan bağlantıyı serbest bırak
        // console.log("[ITEMS API] Database connection released back to the pool.");
      } catch (releaseError) {
        console.error("[ITEMS API] Bağlantı serbest bırakılırken hata:", releaseError.message);
      }
    }
  }
}