// src/app/api/auth/login/route.ts

import { NextResponse, NextRequest } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';

import { JWT_SECRET as ENV_JWT_SECRET, JWT_EXPIRES_IN } from '../../../config/config';

let secretKey: Uint8Array;
try {
    if (!ENV_JWT_SECRET) {
        console.error("Login API UYARI: JWT_SECRET ortam değişkeni tanımlanmamış! Geçici bir anahtar kullanılacak (SADECE GELİŞTİRME İÇİN).");
        secretKey = new TextEncoder().encode('DUZGUN_BIR_SECRET_KEY_TANIMLAYIN_GUVENLIK_RISKI');
    } else {
        secretKey = new TextEncoder().encode(ENV_JWT_SECRET);
    }
} catch (e: any) {
    console.error("Login API KRİTİK HATA: JWT_SECRET yüklenirken hata:", e.message);
    secretKey = new TextEncoder().encode('SECRET_KEY_HATASI_DEV_ONLY');
}

interface UserRecordFromDB extends RowDataPacket { // Adını değiştirdim, daha açıklayıcı
  id: number;
  user_name: string;
  user_password: string | null; // Veritabanından null gelebilir
  balance: number;
  steam_id: string | null;
  role: string;
}

// user_password'ın kesinlikle string olduğu bir tip
interface ValidatedUser extends UserRecordFromDB {
    user_password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı ve şifre gereklidir.' },
        { status: 400 }
      );
    }

    let connection;
    try {
      connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      });

      const [users] = await connection.execute<UserRecordFromDB[]>(
        'SELECT id, user_name, user_password, balance, steam_id, role FROM users WHERE user_name = ?',
        [username]
      );

      if (users.length === 0 || !users[0] || typeof users[0].user_password !== 'string') {
        if (connection) await connection.end();
        return NextResponse.json(
          { success: false, message: 'Kullanıcı adı veya şifre hatalı.' },
          { status: 401 }
        );
      }

      // Bu noktada users[0].user_password'ın string olduğu garanti.
      // TypeScript'e bunu bildirmek için users[0]'ı ValidatedUser'a cast edebiliriz.
      const user = users[0] as ValidatedUser;

      // Şifreleri karşılaştır
      const isPasswordMatch = await bcrypt.compare(password, user.user_password); // Artık hata vermemeli

      if (!isPasswordMatch) {
        return NextResponse.json(
          { success: false, message: 'Kullanıcı adı veya şifre hatalı.' },
          { status: 401 }
        );
      }

      // Şifre doğru, JWT oluştur (jose ile)
      const tokenPayload = {
        userId: user.id,
        username: user.user_name,
        role: user.role
      };

      const token = await new jose.SignJWT(tokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_EXPIRES_IN || '1h')
        .sign(secretKey);

      const userResponseData = {
        id: user.id,
        name: user.user_name,
        balance: user.balance,
        steamId: user.steam_id,
        role: user.role
      };

      return NextResponse.json({
        success: true,
        message: 'Giriş başarılı!',
        token: token,
        user: userResponseData,
      });

    } catch (dbOrJwtError: any) {
      console.error('Login API - Veritabanı veya JWT hatası:', dbOrJwtError.message, dbOrJwtError.code ? `(Code: ${dbOrJwtError.code})` : '');
      let Mymessage = 'Giriş sırasında bir sunucu hatası oluştu.';
      if (dbOrJwtError instanceof jose.errors.JOSEError) {
          Mymessage = 'Oturum tokenı oluşturulurken bir sorun oluştu.';
      }
      return NextResponse.json(
        { success: false, message: Mymessage },
        { status: 500 }
      );
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  } catch (requestError: any) {
    console.error('Login API - Genel istek hatası (örn: JSON parse):', requestError.message);
    return NextResponse.json(
      { success: false, message: 'Geçersiz istek formatı veya beklenmedik bir sunucu hatası.' },
      { status: 400 }
    );
  }
}