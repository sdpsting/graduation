// src/app/api/admin/items/[itemId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createPool } from 'mysql2/promise';

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

// --- GET - Tek Item Detayını Getirme (Düzenleme Formu İçin) ---
export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const tokenUserRole = request.headers.get('x-user-role');
  if (tokenUserRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Yetkisiz işlem.' }, { status: 403 });
  }

  const itemId = params.itemId;
  if (!itemId) {
    return NextResponse.json({ success: false, message: 'Item ID gerekli.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    // items tablonuzdaki tüm sütunları veya düzenleme için ihtiyaç duyacaklarınızı seçin
    const [rows] = await connection.execute(
      'SELECT id, name, category_name, price, wears, status, collections, image, inspect, ingame, stattrak, wear_float FROM items WHERE id = ?',
      [itemId]
    );

    if ((rows as any[]).length === 0) {
      return NextResponse.json({ success: false, message: 'Item bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, item: (rows as any[])[0] });
  } catch (error: any) {
    console.error(`[API /admin/items/${itemId}] GET hatası:`, error.message);
    return NextResponse.json({ success: false, message: 'Item detayı alınırken bir hata oluştu.', error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}


// --- PUT - Item Güncelleme ---
export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const tokenUserRole = request.headers.get('x-user-role');
  if (tokenUserRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Yetkisiz işlem: Sadece adminler item güncelleyebilir.' }, { status: 403 });
  }

  const itemId = params.itemId;
  if (!itemId) {
    return NextResponse.json({ success: false, message: 'Item ID gerekli.' }, { status: 400 });
  }

  let connection;
  try {
    const body = await request.json();
    // Frontend'den sadece güncellenecek alanlar gönderilebilir veya tüm alanlar gönderilip burada ayıklanabilir.
    // Örnek olarak, frontend'den gelen tüm potansiyel alanları alalım:
    const { 
        name, category_name, price, wears, status, collections, 
        image, inspect, ingame, stattrak, wear_float 
    } = body;

    // Güncellenecek alanları ve değerlerini dinamik olarak oluştur
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    // Sadece gönderilen ve null olmayan değerleri güncellemeye ekle
    // Frontend'den hangi alanların güncellenebileceğine siz karar vermelisiniz.
    // Örneğin, item ID'si genellikle güncellenmez.
    if (name !== undefined) { fieldsToUpdate.push('name = ?'); values.push(name); }
    if (category_name !== undefined) { fieldsToUpdate.push('category_name = ?'); values.push(category_name || null); }
    if (price !== undefined) {
        const numericPrice = parseFloat(String(price));
        if (!isNaN(numericPrice) && numericPrice >= 0) {
            fieldsToUpdate.push('price = ?'); values.push(numericPrice.toFixed(2));
        } else { return NextResponse.json({ success: false, message: 'Geçersiz fiyat.' }, { status: 400 });}
    }
    if (wears !== undefined) { fieldsToUpdate.push('wears = ?'); values.push(wears || null); }
    if (status !== undefined) { fieldsToUpdate.push('status = ?'); values.push(status); }
    if (collections !== undefined) { fieldsToUpdate.push('collections = ?'); values.push(collections || null); }
    if (image !== undefined) { fieldsToUpdate.push('image = ?'); values.push(image || null); }
    if (inspect !== undefined) { fieldsToUpdate.push('inspect = ?'); values.push(inspect || null); }
    if (ingame !== undefined) { fieldsToUpdate.push('ingame = ?'); values.push(ingame || null); }
    if (stattrak !== undefined) { fieldsToUpdate.push('stattrak = ?'); values.push(stattrak ? 1 : 0); }
    if (wear_float !== undefined) {
        const numericWearFloat = wear_float !== null ? parseFloat(String(wear_float)) : null;
        if (numericWearFloat === null || (!isNaN(numericWearFloat) && numericWearFloat >= 0 && numericWearFloat <= 1)) {
            fieldsToUpdate.push('wear_float = ?'); values.push(numericWearFloat !== null ? numericWearFloat.toFixed(5) : null);
        } else { return NextResponse.json({ success: false, message: 'Geçersiz wear_float.' }, { status: 400 });}
    }
    
    if (fieldsToUpdate.length === 0) {
      return NextResponse.json({ success: false, message: 'Güncellenecek alan bulunamadı.' }, { status: 400 });
    }

    values.push(itemId); // WHERE id = ? için

    connection = await pool.getConnection();
    const query = `UPDATE items SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
    
    const [result] = await connection.execute(query, values);

    if ((result as any).affectedRows > 0) {
      const [updatedRows] = await connection.execute('SELECT * FROM items WHERE id = ?', [itemId]);
      return NextResponse.json({ success: true, message: 'Item başarıyla güncellendi.', item: (updatedRows as any[])[0] });
    } else {
      return NextResponse.json({ success: false, message: 'Item bulunamadı veya güncelleme yapılamadı.' }, { status: 404 });
    }

  } catch (error: any) {
    console.error(`[API /admin/items/${itemId}] PUT hatası:`, error.message, error.sqlMessage ? `SQL: ${error.sqlMessage}` : '');
    if (error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ success: false, message: 'Bu isimde bir item zaten mevcut (eğer isim güncelleniyorsa ve UNIQUE ise).' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Item güncellenirken bir sunucu hatası oluştu.', error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}


// --- DELETE - Item Silme ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const tokenUserRole = request.headers.get('x-user-role');
  if (tokenUserRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Yetkisiz işlem: Sadece adminler item silebilir.' }, { status: 403 });
  }

  const itemId = params.itemId;
  if (!itemId) {
    return NextResponse.json({ success: false, message: 'Item ID gerekli.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [result] = await connection.execute('DELETE FROM items WHERE id = ?', [itemId]);

    if ((result as any).affectedRows > 0) {
      return NextResponse.json({ success: true, message: 'Item başarıyla silindi.' });
    } else {
      return NextResponse.json({ success: false, message: 'Item bulunamadı veya silinemedi.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`[API /admin/items/${itemId}] DELETE hatası:`, error.message, error.sqlMessage ? `SQL: ${error.sqlMessage}` : '');
    // Eğer item başka tablolarda FOREIGN KEY ile kullanılıyorsa ve ON DELETE ayarı yoksa, silme hatası olabilir.
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return NextResponse.json({ success: false, message: 'Bu item başka kayıtlarla ilişkili olduğu için silinemiyor.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Item silinirken bir sunucu hatası oluştu.', error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}