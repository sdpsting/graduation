// src/app/api/users/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { createPool, OkPacket, RowDataPacket } from 'mysql2/promise'; // Gerekli tipleri import et
import bcrypt from 'bcryptjs';

// Veritabanı konfigürasyonu (güvenli bir yerden alınmalı, örn: .env.local)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234', // GERÇEK ŞİFRENİZİ KULLANIN VE .env.local'e TAŞIYIN!
  database: process.env.DB_NAME || 'marketdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // decimalNumbers: true, // Eğer DECIMAL'leri string yerine number olarak almak isterseniz
};

const pool = createPool(dbConfig);

// Helper interface'ler (isteğe bağlı ama daha iyi tip güvenliği için)
interface UserDataFromDB extends RowDataPacket {
    id: number;
    user_name: string;
    user_email: string;
    steam_id: string | null;
    role: 'user' | 'admin'; // Enum tiplerini burada da yansıtabilirsiniz
    balance: string; // Veritabanından DECIMAL genellikle string olarak gelir
    user_password?: string; // Sadece belirli durumlarda seçilir
}

interface UserResponse {
    id: number;
    name: string;
    email: string;
    steamId: string | null;
    role: 'user' | 'admin';
    balance: string; // Frontend'e string olarak göndermek tutarlı olabilir, veya number
}


// Belirli bir kullanıcıyı GET etme
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userIdToFetch = params.id;
  const currentUserIdFromToken = request.headers.get('x-user-id');
  const currentUserRole = request.headers.get('x-user-role');

  // console.log(`[GET /api/users/${userIdToFetch}] İstek alındı. Token UserID: ${currentUserIdFromToken}, Role: ${currentUserRole}`);

  if (!currentUserIdFromToken) {
    return NextResponse.json({ success: false, message: 'Yetkisiz: Giriş yapılmamış.' }, { status: 401 });
  }
  // Admin değilse ve kendi profilini talep etmiyorsa yetkisiz işlem
  if (currentUserRole !== 'admin' && currentUserIdFromToken !== userIdToFetch) {
    console.warn(`[GET /api/users/${userIdToFetch}] Yetkisiz erişim denemesi. Token UserID: ${currentUserIdFromToken}`);
    return NextResponse.json({ success: false, message: 'Bu bilgilere erişim yetkiniz yok.' }, { status: 403 });
  }
  
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute<UserDataFromDB[]>( // Tip kullanımı
      'SELECT id, user_name, user_email, steam_id, role, balance FROM users WHERE id = ?',
      [userIdToFetch]
    );
    
    if (rows.length > 0) {
      const userFromDb = rows[0];
      const userResponse: UserResponse = {
        id: userFromDb.id,
        name: userFromDb.user_name,
        email: userFromDb.user_email,
        steamId: userFromDb.steam_id,
        role: userFromDb.role,
        balance: userFromDb.balance, // String olarak kalabilir veya number'a çevrilebilir
      };
      return NextResponse.json({ success: true, user: userResponse });
    } else {
      return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }
  } catch (error: any) {
    console.error(`[GET /api/users/${userIdToFetch}] Veritabanı veya işlem hatası:`, error.message, error.stack);
    return NextResponse.json({ success: false, message: 'Kullanıcı bilgileri alınırken bir sunucu hatası oluştu.' }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}


// Kullanıcı bilgilerini (bakiye dahil) güncelleme
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const userIdFromParams = params.id;
  const currentUserIdFromToken = request.headers.get('x-user-id');
  const currentUserRole = request.headers.get('x-user-role');

  // console.log(`[PUT /api/users/${userIdFromParams}] İstek alındı. Token UserID: ${currentUserIdFromToken}, Role: ${currentUserRole}`);

  if (!currentUserIdFromToken) {
      return NextResponse.json({ success: false, message: 'Yetkilendirme tokeni eksik veya geçersiz.' }, { status: 401 });
  }
  // Admin değilse ve kendi profilini güncellemiyorsa yetkisiz işlem
  if (currentUserRole !== 'admin' && currentUserIdFromToken !== userIdFromParams) {
      console.warn(`[PUT /api/users/${userIdFromParams}] Yetkisiz güncelleme denemesi. Token UserID: ${currentUserIdFromToken}`);
      return NextResponse.json({ success: false, message: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    // console.log(`[PUT /api/users/${userIdFromParams}] Gelen Güncelleme Body:`, body);
    
    const { name, email, password, steamId, balance } = body;

    const fieldsToUpdate: Record<string, any> = {};
    const queryParams: any[] = [];

    if (name !== undefined) {
      if (String(name).trim() === '') return NextResponse.json({ success: false, message: "Kullanıcı adı boş olamaz." }, { status: 400 });
      fieldsToUpdate.user_name = String(name).trim();
    }
    if (email !== undefined) {
      const trimmedEmail = String(email).trim();
      if (trimmedEmail !== '' && !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
        return NextResponse.json({ success: false, message: "Geçersiz e-posta formatı." }, { status: 400 });
      }
      fieldsToUpdate.user_email = trimmedEmail;
    }
    if (steamId !== undefined) {
      fieldsToUpdate.steam_id = steamId === null || String(steamId).trim() === '' ? null : String(steamId).trim();
    }
    if (password && String(password).trim() !== '') {
      // Şifre için minimum uzunluk gibi ek kontroller eklenebilir
      // if (String(password).trim().length < 6) return NextResponse.json({ success: false, message: "Şifre en az 6 karakter olmalıdır." }, { status: 400 });
      const hashedPassword = await bcrypt.hash(String(password).trim(), 10);
      fieldsToUpdate.user_password = hashedPassword;
    }
    if (balance !== undefined) {
      const numericBalance = parseFloat(String(balance));
      if (isNaN(numericBalance)) {
        return NextResponse.json({ success: false, message: 'Geçersiz bakiye formatı. Sayı olmalı.' }, { status: 400 });
      }
      if (numericBalance < 0) { // Negatif bakiye kontrolü
           return NextResponse.json({ success: false, message: 'Bakiye negatif olamaz.' }, { status: 400 });
      }
      fieldsToUpdate.balance = numericBalance.toFixed(2); // Veritabanına DECIMAL(10,2) için uygun format
    }

    if (Object.keys(fieldsToUpdate).length === 0) {
      // Güncellenecek bir şey yoksa, mevcut kullanıcı verisini döndür (GET ile aynı mantık)
      let conn;
      try {
        conn = await pool.getConnection();
        const [existingUserRows] = await conn.execute<UserDataFromDB[]>(
          'SELECT id, user_name, user_email, steam_id, role, balance FROM users WHERE id = ?',
          [userIdFromParams]
        );
        if (existingUserRows.length > 0) {
          const userFromDb = existingUserRows[0];
          const userResponse: UserResponse = {
            id: userFromDb.id, name: userFromDb.user_name, email: userFromDb.user_email,
            steamId: userFromDb.steam_id, role: userFromDb.role, balance: userFromDb.balance,
          };
          return NextResponse.json({ success: true, message: 'Güncellenecek bir bilgi gönderilmedi.', user: userResponse });
        } else {
            return NextResponse.json({ success: false, message: "Kullanıcı bulunamadı." }, { status: 404 });
        }
      } finally {
          if (conn) conn.release();
      }
    }

    const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
    Object.values(fieldsToUpdate).forEach(value => queryParams.push(value));
    queryParams.push(userIdFromParams); // WHERE id = ? için

    const query = `UPDATE users SET ${setClauses} WHERE id = ?`;
    // console.log(`[PUT /api/users/${userIdFromParams}] Executing query: ${query} with params:`, queryParams);
    
    let connection;
    try {
        connection = await pool.getConnection();
        const [result] = await connection.execute<OkPacket>(query, queryParams); // OkPacket tipi

        if (result.affectedRows > 0) {
          // console.log(`[PUT /api/users/${userIdFromParams}] Veritabanı güncellendi. Etkilenen satır: ${result.affectedRows}`);
          // Başarılı güncelleme sonrası güncel kullanıcı verisini çekip döndür
          const [updatedUserRows] = await connection.execute<UserDataFromDB[]>(
            'SELECT id, user_name, user_email, steam_id, role, balance FROM users WHERE id = ?',
            [userIdFromParams]
          );
          const userFromDb = updatedUserRows[0];
          const userToReturn: UserResponse = {
            id: userFromDb.id, name: userFromDb.user_name, email: userFromDb.user_email,
            steamId: userFromDb.steam_id, role: userFromDb.role, balance: userFromDb.balance,
          };
          return NextResponse.json({ success: true, message: 'Profil başarıyla güncellendi.', user: userToReturn });
        } else {
          // Kullanıcı bulunamadı veya hiçbir satır etkilenmedi (örn: aynı değerler girildi)
          const [existingUserRows] = await connection.execute<UserDataFromDB[]>(
            'SELECT id, user_name, user_email, steam_id, role, balance FROM users WHERE id = ?',
            [userIdFromParams]
          );
          if (existingUserRows.length > 0) {
             const userFromDb = existingUserRows[0];
             const userResponse: UserResponse = {
                id: userFromDb.id, name: userFromDb.user_name, email: userFromDb.user_email,
                steamId: userFromDb.steam_id, role: userFromDb.role, balance: userFromDb.balance,
             };
             return NextResponse.json({ success: true, message: 'Bilgilerde değişiklik yapılmadı (girilen değerler mevcut değerlerle aynı olabilir).', user: userResponse });
          }
          return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı, güncelleme yapılamadı.' }, { status: 404 });
        }
    } catch (dbError: any) {
        console.error(`[PUT /api/users/${userIdFromParams}] Veritabanı hatası:`, dbError.message, dbError.code ? `(Code: ${dbError.code})` : '');
        if (dbError.code === 'ER_DUP_ENTRY') {
            let dupMessage = 'Bu e-posta veya kullanıcı adı zaten kullanılıyor.';
            if (dbError.message.includes('user_email_UNIQUE') || dbError.message.includes('user_email')) dupMessage = 'Bu e-posta adresi zaten kayıtlı.';
            if (dbError.message.includes('user_name_UNIQUE') || dbError.message.includes('user_name')) dupMessage = 'Bu kullanıcı adı zaten alınmış.';
            return NextResponse.json({ success: false, message: dupMessage }, { status: 409 }); // 409 Conflict
        }
        return NextResponse.json({ success: false, message: 'Veritabanı güncelleme sırasında bir hata oluştu.' }, { status: 500 });
    } finally {
        if (connection) connection.release();
    }

  } catch (error: any) {
    console.error(`[PUT /api/users/${userIdFromParams}] Genel istek hatası (örn: JSON parse):`, error.message);
    return NextResponse.json({ success: false, message: 'Geçersiz istek formatı veya beklenmedik bir sunucu hatası.' }, { status: 400 });
  }
}