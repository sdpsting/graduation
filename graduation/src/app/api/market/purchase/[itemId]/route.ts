// src/app/api/market/purchase/[itemId]/route.ts (Dosya adını .ts yapmanız önerilir)

import { NextResponse, NextRequest } from 'next/server'; // NextRequest importu ekledim
import { createPool, Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise'; // Tipler eklendi

// Veritabanı bağlantı bilgileri
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234', // .env.local dosyanızda olmalı
  database: process.env.DB_NAME || 'marketdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Pool'u global scope'ta tanımla, böylece her istekte yeniden oluşturulmaz
let pool: Pool;
try {
    pool = createPool(dbConfig);
    console.log("[PURCHASE API] Database pool created successfully.");
} catch (error) {
    console.error("[PURCHASE API] Failed to create database pool:", error);
}

// Dönen veriler için tipler (isteğe bağlı ama iyi pratik)
interface ItemFromDB extends RowDataPacket {
    id: string;
    price: string; // Veritabanından string olarak gelebilir
    status: string;
    seller_id: number | null; // Satıcı ID'si
}
interface UserFromDB extends RowDataPacket {
    id: number;
    balance: string; // Veritabanından string olarak gelebilir
}

export async function POST(request: NextRequest, { params }: { params: { itemId: string } }) {
  const { itemId } = params;
  const buyerUserIdString = request.headers.get('x-user-id'); // Middleware'den gelen alıcı ID'si

  if (!buyerUserIdString) {
    return NextResponse.json({ success: false, message: 'Yetkisiz işlem: Alıcı kimliği bulunamadı.' }, { status: 403 });
  }
  // buyerUserIdString'i sayıya çevir ve NaN kontrolü yap
  const buyerUserId = parseInt(buyerUserIdString, 10);
  if (isNaN(buyerUserId)) {
    return NextResponse.json({ success: false, message: 'Geçersiz alıcı kimliği formatı.' }, { status: 400 });
  }

  if (!itemId) {
    return NextResponse.json({ success: false, message: 'Geçersiz istek: Ürün kimliği eksik.' }, { status: 400 });
  }

  let connection;

  try {
    if (!pool) {
        console.error("[PURCHASE API] Database pool is not available.");
        return NextResponse.json(
          { message: "Sunucu yapılandırma hatası: Veritabanı bağlantısı kurulamadı." },
          { status: 500 }
        );
    }
    connection = await pool.getConnection();
    // console.log(`[PURCHASE API] Connected for user ${buyerUserId}, item ${itemId}`);

    await connection.beginTransaction();
    // console.log("[PURCHASE API] Transaction started.");

    // 1. Ürün bilgilerini al (fiyat, status VE seller_id)
    const [itemRows] = await connection.execute<ItemFromDB[]>(
      "SELECT id, price, status, seller_id FROM items WHERE id = ? AND status = 'available' FOR UPDATE",
      [itemId]
    );

    if (itemRows.length === 0) {
      await connection.rollback();
      // console.log("[PURCHASE API] Rollback: Item not found or not available.");
      return NextResponse.json({ success: false, message: 'Ürün bulunamadı, satışta değil veya zaten satın alınmış.' }, { status: 404 });
    }
    const itemBeingPurchased = itemRows[0];
    const itemPrice = parseFloat(itemBeingPurchased.price); // String ise float'a çevir
    const sellerUserId = itemBeingPurchased.seller_id; 

    if (isNaN(itemPrice) || itemPrice <= 0) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: 'Ürün fiyatı geçersiz veya sıfır.' }, { status: 400 });
    }

    // 2. Alıcının bakiyesini al ve kontrol et
    const [buyerUserRows] = await connection.execute<UserFromDB[]>(
      'SELECT id, balance FROM users WHERE id = ? FOR UPDATE',
      [buyerUserId]
    );

    if (buyerUserRows.length === 0) {
      await connection.rollback();
      // console.log("[PURCHASE API] Rollback: Buyer user not found.");
      return NextResponse.json({ success: false, message: 'Alıcı kullanıcı bulunamadı.' }, { status: 404 });
    }
    const buyerUser = buyerUserRows[0];
    const buyerCurrentBalance = parseFloat(buyerUser.balance);

    if (buyerCurrentBalance < itemPrice) {
      await connection.rollback();
      // console.log("[PURCHASE API] Rollback: Insufficient balance.");
      return NextResponse.json({ success: false, message: 'Yetersiz bakiye.' }, { status: 400 });
    }

    // 3. Alıcının bakiyesini düşür
    const buyerNewBalance = buyerCurrentBalance - itemPrice;
    await connection.execute(
      'UPDATE users SET balance = ? WHERE id = ?',
      [buyerNewBalance.toFixed(2), buyerUserId]
    );
    // console.log(`[PURCHASE API] Buyer ${buyerUserId} balance updated to: ${buyerNewBalance.toFixed(2)}`);

    // ---- 4. SATICIYA BAKİYE EKLEME ----
    if (sellerUserId && sellerUserId !== buyerUserId) {
      // İsteğe bağlı: Komisyon hesaplama
      // const commissionRate = 0.05; // %5 komisyon
      // const amountToSeller = itemPrice * (1 - commissionRate);
      const amountToSeller = itemPrice; // Şimdilik komisyonsuz

      const [sellerUpdateResult] = await connection.execute(
        'UPDATE users SET balance = balance + ? WHERE id = ?',
        [amountToSeller.toFixed(2), sellerUserId]
      );
      // Tip iddiası ile affectedRows kontrolü
      if ((sellerUpdateResult as ResultSetHeader).affectedRows === 0) {
          // Bu, satıcının bulunamadığı veya bir sorun olduğu anlamına gelebilir.
          // Bu durumu nasıl yöneteceğinize karar vermelisiniz (işlemi geri al, logla vs.).
          // Şimdilik bir uyarı loglayıp devam ediyoruz. Kritik bir durumsa rollback yapılmalı.
          console.warn(`[PURCHASE API] DİKKAT: Satıcı ${sellerUserId} bulunamadı veya bakiye güncellenemedi. Satış tutarı: ${amountToSeller.toFixed(2)}`);
      } else {
        console.log(`[PURCHASE API] Satıcı ${sellerUserId} bakiyesine ${amountToSeller.toFixed(2)} eklendi.`);
      }
    } else if (sellerUserId && sellerUserId === buyerUserId) {
        console.log(`[PURCHASE API] Alıcı kendi listelediği ürünü satın aldı. Satıcıya bakiye transferi yapılmadı.`);
    } else {
        console.log(`[PURCHASE API] Ürünün bir satıcısı yok (seller_id NULL) veya satıcı alıcı ile aynı. Bakiye transferi (satıcıya) yapılmadı.`);
        // Bu durumda para "sisteme" gitmiş olur veya bir admin/komisyon hesabına aktarılabilir.
    }
    // ---- SATICIYA BAKİYE EKLEME SONU ----

    // 5. Ürün durumunu 'sold' yap ve buyer_id'yi güncelle
    // previous_price'a dokunmuyoruz, o en son listeleme fiyatı olarak kalabilir.
    // seller_id de aynı kalır (kimden alındığını bilmek için).
    await connection.execute(
      "UPDATE items SET status = 'sold', buyer_id = ? WHERE id = ?",
      [buyerUserId, itemId]
    );
    // console.log(`[PURCHASE API] Item ${itemId} marked as sold to buyer ${buyerUserId}.`);

    // 6. Kullanıcının envanterine ürünü ve satın alma fiyatını ekle
    try {
      const [inventoryResult] = await connection.execute<ResultSetHeader>( // Tip eklendi
        'INSERT INTO user_inventory (user_id, item_id, price_at_purchase) VALUES (?, ?, ?)',
        [buyerUserId, itemId, itemPrice.toFixed(2)]
      );
      // console.log(`[PURCHASE API] Item ${itemId} (price: ${itemPrice.toFixed(2)}) added to user ${buyerUserId}'s inventory. Insert ID: ${inventoryResult.insertId}`);
    } catch (invError: any) {
      if (invError.code === 'ER_DUP_ENTRY') {
        console.warn(`[PURCHASE API] Inventory insert ER_DUP_ENTRY for user ${buyerUserId}, item ${itemId}. Bu genellikle olmamalı eğer item marketten alınıyorsa.`);
        // Bu durumda, user_inventory tablosunda (user_id, item_id) için UNIQUE kısıtlaması varsa bu hata alınır.
        // Eğer bir kullanıcı aynı item'dan envanterinde birden fazla tutabiliyorsa bu UNIQUE kısıtlama olmamalı.
        // Eğer her item benzersiz bir listeleme ise ve satın alınınca 'sold' oluyorsa,
        // aynı item'ı tekrar satın almaya çalışmak zaten itemRows.length === 0 ile yakalanmalı.
        // Bu hata yine de geliyorsa, mantıkta bir tutarsızlık olabilir.
      } else {
        console.error(`[PURCHASE API] Error adding item to inventory for user ${buyerUserId}, item ${itemId}:`, invError);
      }
      throw invError; // Transaction'ın rollback olması için hatayı yeniden fırlat
    }

    await connection.commit();
    // console.log("[PURCHASE API] Transaction committed successfully.");

    return NextResponse.json({
      success: true,
      message: 'Ürün başarıyla satın alındı ve envanterinize eklendi!',
      newBalance: buyerNewBalance.toFixed(2), // Alıcının yeni bakiyesi
      itemId: itemId,
      purchasedPrice: itemPrice.toFixed(2)
    });

  } catch (error: any) { // Tip any olarak belirtildi
    if (connection) {
      try {
        await connection.rollback();
        console.log("[PURCHASE API] Transaction rolled back due to error:", error.message);
      } catch (rollbackError: any) { // Tip any olarak belirtildi
        console.error("[PURCHASE API] Error during transaction rollback:", rollbackError.message);
      }
    }
    console.error(`[PURCHASE API] Satın alma API hatası (Item: ${itemId}, Alıcı: ${buyerUserIdString}):`, error.message, error.stack);
    // if (error.sqlMessage) { // error objesinde bu property olmayabilir
    //     console.error("SQL Error:", error.sqlMessage, "SQL State:", error.sqlState, "Error No:", error.errno);
    // }
    return NextResponse.json(
      { 
        success: false, 
        message: 'Satın alma sırasında bir sunucu hatası oluştu.', 
        errorDetail: error.message, // error.message daha genel ve güvenli
        // details: error.sqlMessage || 'No SQL message',
        // code: error.code || 'UNKNOWN_ERROR'
      }, 
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        connection.release();
        // console.log("[PURCHASE API] Database connection released to pool.");
      } catch (releaseError: any) { // Tip any olarak belirtildi
        console.error("[PURCHASE API] Error releasing database connection:", releaseError.message);
      }
    }
  }
}