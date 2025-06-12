// src/app/api/market/sell-item/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createPool, Pool, ResultSetHeader } from 'mysql2/promise'; // ResultSetHeader eklendi

const dbConfig = { 
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'marketdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool: Pool;
try {
    pool = createPool(dbConfig);
} catch (error) {
    console.error("Veritabanı havuzu oluşturulurken hata:", error);
}

interface SellItemRequestBody {
  inventoryId: number;
  itemId: string;
  sellPrice: number;
}

export async function POST(request: NextRequest) {
  const currentUserId = request.headers.get('x-user-id');
  if (!currentUserId) {
    return NextResponse.json({ success: false, message: 'Yetkisiz işlem: Kullanıcı kimliği bulunamadı.' }, { status: 403 });
  }

  let connection;
  try {
    const body = await request.json() as SellItemRequestBody;
    const { inventoryId, itemId, sellPrice } = body;

    if (!inventoryId || !itemId || typeof sellPrice !== 'number' || sellPrice <= 0) {
      return NextResponse.json({ success: false, message: 'Geçersiz istek: inventoryId, itemId ve pozitif bir satış fiyatı gerekli.' }, { status: 400 });
    }

    if (!pool) {
        console.error("Veritabanı havuzu mevcut değil!");
        return NextResponse.json({ success: false, message: 'Sunucu hatası: Veritabanı bağlantısı kurulamadı.' }, { status: 500 });
    }
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [inventoryRows] = await connection.execute<any[]>(
      'SELECT ii.item_id, i.name as item_name, i.image as item_image, i.wears as item_wears, i.inspect as item_inspect, i.ingame as item_ingame, i.category_name as item_category FROM user_inventory ii JOIN items i ON ii.item_id = i.id WHERE ii.inventory_id = ? AND ii.user_id = ? AND ii.item_id = ?',
      [inventoryId, currentUserId, itemId]
    );

    if (inventoryRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ success: false, message: 'Satılacak eşya envanterinizde bulunamadı veya size ait değil.' }, { status: 404 });
    }
    const itemToSellDetails = inventoryRows[0];

    // items tablosundaki ilgili item'ı güncelle
    const [updateResult] = await connection.execute(
      'UPDATE items SET status = ?, price = ?, buyer_id = NULL, seller_id = ? WHERE id = ?',
      ['available', sellPrice.toFixed(2), currentUserId, itemId]
    );

    // ---- Tip İddiası (Type Assertion) ----
    if ((updateResult as ResultSetHeader).affectedRows === 0) {
      await connection.rollback();
      console.warn(`[API/sell-item] Items tablosunda item güncellenemedi. Item ID: ${itemId}, Satıcı: ${currentUserId}`);
      return NextResponse.json({ success: false, message: 'Eşya markette listelenirken bir sorun oluştu (item bulunamadı/güncellenemedi).' }, { status: 500 });
    }

    // user_inventory'den bu kaydı sil
    const [deleteResult] = await connection.execute(
      'DELETE FROM user_inventory WHERE inventory_id = ? AND user_id = ?',
      [inventoryId, currentUserId]
    );

    // ---- Tip İddiası (Type Assertion) ----
    if ((deleteResult as ResultSetHeader).affectedRows === 0) {
      await connection.rollback();
      console.warn(`[API/sell-item] user_inventory'den item silinemedi. Inventory ID: ${inventoryId}, Kullanıcı: ${currentUserId}`);
      return NextResponse.json({ success: false, message: 'Eşya envanterden silinirken bir sorun oluştu.' }, { status: 500 });
    }

    await connection.commit();
    
    return NextResponse.json({ success: true, message: `"${itemToSellDetails.item_name}" başarıyla ${sellPrice.toFixed(2)} fiyatıyla markete geri konuldu.` });

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("[API /market/sell-item] Hata:", error.message, error.stack);
    return NextResponse.json({ success: false, message: 'Eşya markete konulurken bir sunucu hatası oluştu.', errorDetail: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}