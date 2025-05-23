// backend login kodunuz (örn: app/api/login/route.ts)
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  const { username, password } = await request.json();
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'userdb',
    });

    // Kullanıcı kontrolü - steam_id'yi de seçiyoruz
    const [users] = await connection.execute<RowDataPacket[]>(
      'SELECT id, user_name, balance, steam_id FROM users WHERE user_name = ? AND user_password = ?', // steam_id eklendi
      [username, password]
    );

    if (users.length > 0) {
      const user = users[0];
      return NextResponse.json({
        success: true,
        message: 'Giriş başarılı!',
        userId: user.id,
        userName: user.user_name,
        balance: user.balance,
        steamId: user.steam_id, // steam_id'yi de yanıta ekliyoruz
      });
    } else {
      return NextResponse.json({ success: false, message: 'Kullanıcı adı veya şifre hatalı.' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login sırasında hata:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir sunucu hatası oluştu.';
    return NextResponse.json({ success: false, message: 'Login sırasında bir sunucu hatası oluştu.', error: errorMessage }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}