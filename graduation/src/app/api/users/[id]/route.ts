// src/app/api/users/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createPool } from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234', // .env.local'den alınmalı
  database: process.env.DB_NAME || 'marketdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};
const pool = createPool(dbConfig);

// Belirli bir kullanıcıyı GET etme (Örnek - Middleware korumalı olmalı)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userIdToFetch = params.id;
  const currentUserIdFromToken = request.headers.get('x-user-id');
  const currentUserRole = request.headers.get('x-user-role');

  if (!currentUserIdFromToken) {
    return NextResponse.json({ success: false, message: 'Yetkisiz: Giriş yapılmamış.' }, { status: 401 });
  }
  if (currentUserRole !== 'admin' && currentUserIdFromToken !== userIdToFetch) {
    return NextResponse.json({ success: false, message: 'Bu bilgilere erişim yetkiniz yok.' }, { status: 403 });
  }
  
  let connection;
  try {
    connection = await pool.getConnection();
    // Şifre hash'ini ASLA client'a göndermeyin.
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT id, user_name AS name, user_email AS email, steam_id AS steamId, role, balance FROM users WHERE id = ?',
      [userIdToFetch]
    );
    
    if (rows.length > 0) {
      return NextResponse.json({ success: true, user: rows[0] });
    } else {
      return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`API /users/${userIdToFetch} GET hatası:`, error.message);
    return NextResponse.json({ success: false, message: 'Kullanıcı bilgileri alınırken bir sunucu hatası oluştu.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}


export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const userIdFromParams = params.id;
  const currentUserIdFromToken = request.headers.get('x-user-id');
  const currentUserRole = request.headers.get('x-user-role');

  if (!currentUserIdFromToken) {
      return NextResponse.json({ success: false, message: 'Yetkilendirme tokeni eksik veya geçersiz.' }, { status: 401 });
  }
  if (currentUserRole !== 'admin' && currentUserIdFromToken !== userIdFromParams) {
      return NextResponse.json({ success: false, message: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    // console.log(`[PUT /api/users/${userIdFromParams}] Gelen Güncelleme Body:`, JSON.stringify(body, null, 2));
    const { name, email, password, steamId } = body;

    const fieldsToUpdate: Record<string, any> = {};
    const queryParams: any[] = [];

    if (name !== undefined) {
      // Kullanıcı adının boş olmasına izin vermeyebiliriz, frontend'de kontrol edilebilir.
      // Backend'de de bir kontrol eklenebilir: if (name.trim() === '') return error;
      fieldsToUpdate.user_name = name; // Veritabanındaki sütun adı
    }
    if (email !== undefined) {
      if (email.trim() !== '' && !/^\S+@\S+\.\S+$/.test(email.trim())) {
        return NextResponse.json({ success: false, message: "Geçersiz e-posta formatı." }, { status: 400 });
      }
      fieldsToUpdate.user_email = email.trim(); // Veritabanındaki sütun adı
    }
    if (steamId !== undefined) {
      fieldsToUpdate.steam_id = steamId === null || String(steamId).trim() === '' ? null : String(steamId).trim();
    }
    if (password && String(password).trim() !== '') {
      // Şifre uzunluk kontrolü kaldırıldı. İsterseniz burada başka kontroller (karmaşıklık vb.) ekleyebilirsiniz.
      const hashedPassword = await bcrypt.hash(password, 10);
      fieldsToUpdate.user_password = hashedPassword; // Veritabanındaki sütun adı
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      // Eğer hiçbir şey güncellenmeyecekse, mevcut kullanıcı verisini başarıyla döndür
      const [existingUserRows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, user_name AS name, user_email AS email, steam_id AS steamId, role, balance FROM users WHERE id = ?',
        [userIdFromParams]
      );
      if ((existingUserRows as any[]).length > 0) {
        return NextResponse.json({ success: true, message: 'Güncellenecek bir bilgi gönderilmedi.', user: (existingUserRows as any[])[0] });
      }
      return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı ve güncellenecek bilgi yok." }, { status: 404 });
    }

    const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
    Object.values(fieldsToUpdate).forEach(value => queryParams.push(value));
    queryParams.push(userIdFromParams); // WHERE id = ? için

    const query = `UPDATE users SET ${setClauses} WHERE id = ?`;
    
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute(query, queryParams);
        const updateResult = result as any;

        if (updateResult.affectedRows > 0) {
          const [updatedUserRows] = await connection.execute<RowDataPacket[]>(
            'SELECT id, user_name AS name, user_email AS email, steam_id AS steamId, role, balance FROM users WHERE id = ?',
            [userIdFromParams]
          );
          const userToReturn = (updatedUserRows as any[])[0];
          return NextResponse.json({ success: true, message: 'Profil başarıyla güncellendi.', user: userToReturn });
        } else {
          // Kullanıcı bulunamadı veya hiçbir satır etkilenmedi
          const [existingUserRows] = await connection.execute<RowDataPacket[]>(
            'SELECT id, user_name AS name, user_email AS email, steam_id AS steamId, role, balance FROM users WHERE id = ?',
            [userIdFromParams]
          );
          if ((existingUserRows as any[]).length > 0) {
             return NextResponse.json({ success: true, message: 'Bilgilerde değişiklik yapılmadı veya aynı bilgiler girildi.', user: (existingUserRows as any[])[0] });
          }
          return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' }, { status: 404 });
        }
    } catch (dbError: any) {
        console.error(`API /users/${userIdFromParams} PUT veritabanı hatası:`, dbError.message, dbError.code);
        if (dbError.code === 'ER_DUP_ENTRY') {
            let dupMessage = 'Bu e-posta veya kullanıcı adı zaten kullanılıyor.';
            if (dbError.message.includes('user_email_UNIQUE') || dbError.message.includes('user_email')) dupMessage = 'Bu e-posta adresi zaten kayıtlı.';
            if (dbError.message.includes('user_name_UNIQUE') || dbError.message.includes('user_name')) dupMessage = 'Bu kullanıcı adı zaten alınmış.';
            return NextResponse.json({ success: false, message: dupMessage }, { status: 409 });
        }
        return NextResponse.json({ success: false, message: 'Veritabanı güncelleme hatası.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }

  } catch (error: any) { // Bu genellikle request.json() parse hatası gibi durumlar için
    console.error(`API /users/${userIdFromParams} PUT genel istek hatası:`, error.message);
    return NextResponse.json({ success: false, message: 'Geçersiz istek formatı veya beklenmedik bir sunucu hatası.' }, { status: 400 });
  }
}