// src/app/api/admin/users/[userId]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createPool } from 'mysql2/promise';

const dbConfig = { 
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'marketdb',
 };
const pool = createPool(dbConfig);

// Belirli bir kullanıcının detaylarını getirme
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const tokenUserRole = request.headers.get('x-user-role');
  if (tokenUserRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const userId = params.userId;
  if (!userId || isNaN(parseInt(userId))) {
    return NextResponse.json({ success: false, message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const query = `
      SELECT id, user_name, user_email, role, balance, steam_id 
      FROM users 
      WHERE id = ?;
    `;
    const [rows] = await connection.execute(query, [userId]);

    if (Array.isArray(rows) && rows.length > 0) {
      return NextResponse.json({ success: true, user: rows[0] });
    } else {
      return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`[API /admin/users/${userId}] Kullanıcı detayı çekerken hata:`, error.message);
    return NextResponse.json(
      { success: false, message: 'Kullanıcı bilgileri alınırken bir sunucu hatası oluştu.', error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// Kullanıcı bilgilerini güncelleme (şimdilik sadece rol ve bakiye)
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const tokenUserRole = request.headers.get('x-user-role');
  if (tokenUserRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Yetkisiz erişim.' }, { status: 403 });
  }

  const userIdToUpdate = params.userId;
  if (!userIdToUpdate || isNaN(parseInt(userIdToUpdate))) {
    return NextResponse.json({ success: false, message: 'Geçersiz kullanıcı ID.' }, { status: 400 });
  }

  let connection;
  try {
    const body = await request.json();
    const { role, balance } = body; // Güncellenecek alanlar

    // Gelen veriyi doğrula (çok temel bir doğrulama)
    if (role && !['user', 'admin'].includes(role)) {
        return NextResponse.json({ success: false, message: 'Geçersiz rol değeri.' }, { status: 400 });
    }
    if (balance !== undefined && (typeof balance !== 'number' || isNaN(balance))) {
        // Frontend'den string gelirse parseFloat ile çevrilmeli veya burada kontrol edilmeli
        // Şimdilik number beklediğimizi varsayalım veya parseFloat(balance) yapalım.
        const parsedBalance = parseFloat(String(balance));
        if (isNaN(parsedBalance)) {
            return NextResponse.json({ success: false, message: 'Geçersiz bakiye değeri. Sayı olmalı.' }, { status: 400 });
        }
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Hangi alanların güncelleneceğini dinamik olarak oluşturmak daha iyi olabilir,
    // ama şimdilik rol ve bakiye için ayrı kontrollerle yapalım.
    
    let updateQuery = 'UPDATE users SET ';
    const queryParams = [];
    const setClauses = [];

    if (role !== undefined) {
        setClauses.push('role = ?');
        queryParams.push(role);
    }
    if (balance !== undefined) {
        const numBalance = parseFloat(String(balance)); // String ise sayıya çevir
        if (!isNaN(numBalance)) {
            setClauses.push('balance = ?');
            queryParams.push(numBalance.toFixed(2)); // Veritabanına DECIMAL(10,2) uygun formatta
        } else {
            // Bu durum yukarıda yakalanmalıydı ama ek kontrol
            await connection.rollback();
            return NextResponse.json({ success: false, message: 'Bakiye sayısal bir değere çevrilemedi.'}, { status: 400 });
        }
    }

    if (setClauses.length === 0) {
        await connection.rollback();
        return NextResponse.json({ success: false, message: 'Güncellenecek alan bulunamadı.' }, { status: 400 });
    }

    updateQuery += setClauses.join(', ') + ' WHERE id = ?';
    queryParams.push(userIdToUpdate);

    const [result] = await connection.execute(updateQuery, queryParams);
    
    // (result as any).affectedRows Next.js için RowDataPacket vs. ile tip uyuşmazlığı verebilir,
    // bu yüzden daha genel bir kontrol yapalım veya spesifik tipleri import edelim.
    // const affectedRows = (result as any)?.affectedRows;
    // console.log("Update Result:", result);

    // affectedRows kontrolü, gerçekten bir güncelleme olup olmadığını anlamak için önemlidir.
    // Ancak execute sonucu,affectedRows'u doğrudan bu şekilde vermeyebilir.
    // Genellikle, eğer sorgu hata vermezse başarılı kabul edilir.
    // Daha iyisi, güncellenen kullanıcıyı tekrar çekip döndürmektir.

    await connection.commit();

    // Güncellenmiş kullanıcıyı çekip döndür
    const [updatedUserRows] = await connection.execute('SELECT id, user_name, user_email, role, balance, steam_id FROM users WHERE id = ?', [userIdToUpdate]);

    if (Array.isArray(updatedUserRows) && updatedUserRows.length > 0) {
        return NextResponse.json({ success: true, message: 'Kullanıcı başarıyla güncellendi.', user: updatedUserRows[0] });
    } else {
        // Bu durum normalde olmamalı eğer güncelleme başarılıysa
        return NextResponse.json({ success: false, message: 'Kullanıcı güncellendi ama bilgileri çekilemedi.' });
    }

  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error(`[API /admin/users/${userIdToUpdate}] Kullanıcı güncellerken hata:`, error.message);
    return NextResponse.json(
      { success: false, message: 'Kullanıcı güncellenirken bir sunucu hatası oluştu.', error: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}