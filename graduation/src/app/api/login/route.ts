import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  try {
    // MySQL bağlantısı oluştur
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'userdb',
    });

    // Kullanıcı kontrolü
    const [users] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE user_name = ? AND user_password = ?',
      [username, password]
    );

    await connection.end();

    if (users.length > 0) {
      const user = users[0];
      // Kullanıcıyı döndürürken id ve userName de dahil ediyoruz
      return NextResponse.json({
        success: true,
        message: 'Giriş başarılı!',
        userId: user.id, // ID'yi döndürüyoruz
        userName: user.user_name, // Kullanıcı adı
        balance: user.balance, // Kullanıcının mevcut bakiyesi
      });
    } else {
      return NextResponse.json({ success: false, message: 'Kullanıcı adı veya şifre hatalı.' });
    }
  } catch (error) {
    console.error('Login sırasında hata:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu.' });
  }
}
