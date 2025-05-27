// src/app/api/auth/register/route.ts

import { NextResponse, NextRequest } from 'next/server'; // NextRequest'i ekledik
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcryptjs'; // bcryptjs'i import edin

export async function POST(request: NextRequest) { // Request tipini NextRequest olarak güncelledik
  try {
    const body = await request.json();
    // steam_id isteğe bağlı olabilir, bu yüzden onu da alalım
    const { name, email, password, steam_id } = body;

    // Temel girdi doğrulaması
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Kullanıcı adı, e-posta ve şifre gereklidir.' },
        { status: 400 }
      );
    }

    // MySQL bağlantısı oluştur
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234', // GÜVENLİK UYARISI: Bu şifreyi ortam değişkenine taşıyın!
      database: 'userdb',
    });

    // E-posta kontrolü
    const [existingEmails] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE user_email = ?', // Sadece ID çekmek yeterli
      [email]
    );

    if (existingEmails.length > 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, message: 'Bu e-posta adresi zaten kayıtlı.' },
        { status: 409 } // 409 Conflict
      );
    }

    // Kullanıcı adı kontrolü
    const [existingNames] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE user_name = ?', // Sadece ID çekmek yeterli
      [name]
    );

    if (existingNames.length > 0) {
      await connection.end();
      return NextResponse.json(
        { success: false, message: 'Bu kullanıcı adı zaten kayıtlı.' },
        { status: 409 } // 409 Conflict
      );
    }

    // Şifreyi hash'le
    const saltRounds = 10; // Genellikle 10-12 arası bir değer kullanılır
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Yeni kullanıcı ekle (varsayılan balance ve role ile)
    // users tablonuzda balance ve role sütunları olduğundan emin olun.
    // Eğer yoksa, bunları eklemeniz veya INSERT sorgusundan çıkarmanız gerekir.
    // Örnek varsayımlar: balance DECIMAL(10,2) DEFAULT 0.00, role VARCHAR(50) DEFAULT 'user'
    await connection.execute(
      'INSERT INTO users (user_name, user_email, user_password, steam_id, balance, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, steam_id || null, 0.00, 'user'] // steam_id yoksa NULL, balance 0, role 'user'
    );

    await connection.end();
    return NextResponse.json(
      { success: true, message: 'Kayıt başarılı! Şimdi giriş yapabilirsiniz.' },
      { status: 201 } // 201 Created
    );

  } catch (error) {
    console.error('Register sırasında hata:', error);
    // Hata detayını loglayın ama kullanıcıya genel bir mesaj verin
    return NextResponse.json(
        { success: false, message: 'Sunucu tarafında bir hata oluştu. Lütfen daha sonra tekrar deneyin.' },
        { status: 500 }
    );
  }
}