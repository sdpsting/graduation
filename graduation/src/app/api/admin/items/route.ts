// src/app/api/admin/items/route.ts
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

// GET - Tüm item'ları listele
export async function GET(request: NextRequest) {
  const tokenUserRole = request.headers.get('x-user-role');
  if (tokenUserRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Yetkisiz işlem.' }, { status: 403 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, name, category_name, price, wears, status FROM items ORDER BY id DESC' // Temel listeleme için daha az sütun
    );
    return NextResponse.json({ success: true, items: rows });
  } catch (error: any) {
    console.error('[API /admin/items] GET hatası:', error.message);
    return NextResponse.json({ success: false, message: 'Item listesi alınırken bir hata oluştu.', error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// POST - Yeni item ekleme
export async function POST(request: NextRequest) {
  const tokenUserRole = request.headers.get('x-user-role');
  if (tokenUserRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Yetkisiz işlem: Sadece adminler item ekleyebilir.' }, { status: 403 });
  }

  let connection;
  try {
    const body = await request.json();
    const { 
        id, name, category_name, price, wears, status, collections, 
        image, inspect, ingame, stattrak, wear_float 
    } = body;

    // Zorunlu alanların kontrolü (Frontend'de de yapılmalı ama backend'de de olmalı)
    if (!id || !name || !category_name || price === undefined || !wears || !status || !collections) {
      return NextResponse.json({ success: false, message: 'Zorunlu alanlar eksik.' }, { status: 400 });
    }
    const numericPrice = parseFloat(String(price));
    if (isNaN(numericPrice) || numericPrice < 0) {
        return NextResponse.json({ success: false, message: 'Geçersiz fiyat.' }, { status: 400 });
    }
    let numericWearFloat: number | null = null;
    if (wear_float !== undefined && wear_float !== null && String(wear_float).trim() !== '') {
        numericWearFloat = parseFloat(String(wear_float));
        if (isNaN(numericWearFloat) || numericWearFloat < 0 || numericWearFloat > 1) {
            return NextResponse.json({ success: false, message: 'Geçersiz wear_float.' }, { status: 400 });
        }
    }
    const isStattrak = stattrak ? 1 : 0;

    connection = await pool.getConnection();
    const query = `
      INSERT INTO items (id, name, category_name, price, wears, status, collections, image, ingame, inspect, stattrak, wear_float) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        id, name, category_name, numericPrice.toFixed(2), wears, status, collections,
        image || null, ingame || null, inspect || null, isStattrak,
        numericWearFloat !== null ? numericWearFloat.toFixed(5) : null
      ];
    
    const [result] = await connection.execute(query, values);

    if ((result as any).affectedRows > 0) {
      // Frontend'den gelen ID'yi kullanarak yeni eklenen item'ı al (auto_increment değilse)
      const [newRows] = await connection.execute('SELECT * FROM items WHERE id = ?', [id]);
      return NextResponse.json({ success: true, message: 'Item başarıyla eklendi.', item: (newRows as any)[0] }, { status: 201 });
    } else {
      throw new Error('Item eklenemedi.');
    }
  } catch (error: any) {
    console.error('[API /admin/items] POST hatası:', error.message, error.sqlMessage);
    if (error.code === 'ER_DUP_ENTRY') {
        return NextResponse.json({ success: false, message: 'Bu ID ile bir item zaten mevcut.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: 'Item eklenirken bir hata oluştu.', error: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}