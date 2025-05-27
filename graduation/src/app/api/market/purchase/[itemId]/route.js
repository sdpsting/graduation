// src/app/api/market/purchase/[itemId]/route.js

import { NextResponse } from 'next/server';
import { createPool } from 'mysql2/promise';

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

export async function POST(request, { params }) {
  const { itemId } = params;
  const userId = request.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ success: false, message: 'Yetkisiz işlem: Kullanıcı kimliği bulunamadı.' }, { status: 403 });
  }

  if (!itemId) {
    return NextResponse.json({ success: false, message: 'Geçersiz istek: Ürün kimliği eksik.' }, { status: 400 });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    console.log(`[PURCHASE API] Connected to database: '${dbConfig.database}' for user ${userId}, item ${itemId}`);

    await connection.beginTransaction();
    console.log("[PURCHASE API] Transaction started.");

    const [itemRows] = await connection.execute(
      "SELECT id, price, status FROM items WHERE id = ? AND status = 'available' FOR UPDATE",
      [itemId]
    );

    if (itemRows.length === 0) {
      await connection.rollback();
      console.log("[PURCHASE API] Rollback: Item not found or not available.");
      return NextResponse.json({ success: false, message: 'Ürün bulunamadı, satışta değil veya zaten satın alınmış.' }, { status: 404 });
    }
    const item = itemRows[0];
    const itemPrice = parseFloat(item.price); // <<< Bu itemPrice'ı kullanacağız

    const [userRows] = await connection.execute(
      'SELECT id, balance FROM users WHERE id = ? FOR UPDATE',
      [userId]
    );

    if (userRows.length === 0) {
      await connection.rollback();
      console.log("[PURCHASE API] Rollback: User not found.");
      return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }
    const user = userRows[0];
    const currentUserBalance = parseFloat(user.balance);

    if (currentUserBalance < itemPrice) {
      await connection.rollback();
      console.log("[PURCHASE API] Rollback: Insufficient balance.");
      return NextResponse.json({ success: false, message: 'Yetersiz bakiye.' }, { status: 400 });
    }

    const newBalance = currentUserBalance - itemPrice;
    await connection.execute(
      'UPDATE users SET balance = ? WHERE id = ?',
      [newBalance.toFixed(2), userId]
    );
    console.log(`[PURCHASE API] User ${userId} balance updated to: ${newBalance.toFixed(2)}`);

    await connection.execute(
      "UPDATE items SET status = 'sold', buyer_id = ? WHERE id = ?",
      [userId, itemId]
    );
    console.log(`[PURCHASE API] Item ${itemId} marked as sold to user ${userId}.`);

    // ---------- DEĞİŞİKLİK BURADA BAŞLIYOR ----------
    // Kullanıcının envanterine ürünü ve satın alma fiyatını ekle
    try {
      const [inventoryResult] = await connection.execute(
        'INSERT INTO user_inventory (user_id, item_id, price_at_purchase) VALUES (?, ?, ?)',
        [userId, itemId, itemPrice.toFixed(2)] // itemPrice'ı buraya ekledik
      );
      console.log(`[PURCHASE API] Item ${itemId} (price: ${itemPrice.toFixed(2)}) added to user ${userId}'s inventory. Insert ID: ${inventoryResult.insertId}`);
    } catch (invError) {
      // UNIQUE kısıtlaması (uk_user_item) nedeniyle hata alabiliriz (Duplicate entry)
      // veya price_at_purchase için NOT NULL kısıtlaması varsa ve null gönderilirse (ama itemPrice dolu olmalı)
      if (invError.code === 'ER_DUP_ENTRY') {
        console.warn(`[PURCHASE API] Inventory insert failed for user ${userId}, item ${itemId}: Item already in inventory. (ER_DUP_ENTRY)`);
        // Bu durumda, kullanıcının zaten sahip olduğu bir ürünü tekrar eklemeye çalıştığı anlamına gelir.
        // Transaction'ı geri alarak durumu yönetiyoruz.
      } else {
        // Diğer olası envanter ekleme hataları
        console.error(`[PURCHASE API] Error adding item to inventory for user ${userId}, item ${itemId}:`, invError);
      }
      throw invError; // Hatayı yeniden fırlatarak genel catch bloğunun rollback yapmasını sağla
    }
    // ---------- DEĞİŞİKLİK BURADA BİTİYOR ----------

    await connection.commit();
    console.log("[PURCHASE API] Transaction committed successfully.");

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla satın alındı ve envanterinize eklendi!', // Mesajı güncelledik
      newBalance: newBalance.toFixed(2),
      itemId: itemId,
      purchasedPrice: itemPrice.toFixed(2) // Yanıta satın alınan fiyatı ekledik
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
        console.log("[PURCHASE API] Transaction rolled back due to error.");
      } catch (rollbackError) {
        console.error("[PURCHASE API] Error during transaction rollback:", rollbackError);
      }
    }
    console.error(`Satın alma API hatası (Ürün: ${itemId}, Kullanıcı: ${userId}):`, error);
    if (error.sqlMessage) {
        console.error("SQL Error:", error.sqlMessage, "SQL State:", error.sqlState, "Error No:", error.errno);
    }
    return NextResponse.json(
      { 
        success: false, 
        message: 'Satın alma sırasında bir sunucu hatası oluştu.', 
        error: error.message,
        details: error.sqlMessage || 'No SQL message',
        code: error.code || 'UNKNOWN_ERROR'
      }, 
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        connection.release();
        console.log("[PURCHASE API] Database connection released to pool.");
      } catch (releaseError) {
        console.error("[PURCHASE API] Error releasing database connection:", releaseError);
      }
    }
  }
}