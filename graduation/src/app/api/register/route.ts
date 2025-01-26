import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

export async function POST(request: Request) {
  const { name, email, password } = await request.json();

  try {
    // MySQL bağlantısı oluştur
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'userdb',
    });

    // E-posta kontrolü
    const [existingEmails] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE user_email = ?',
      [email]
    );

    if (existingEmails.length > 0) {
      await connection.end();
      return NextResponse.json({ success: false, message: 'E-posta zaten kayıtlı.' });
    }

    // Kullanıcı adı kontrolü
    const [existingNames] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE user_name = ?',
      [name]
    );

    if (existingNames.length > 0) {
      await connection.end();
      return NextResponse.json({ success: false, message: 'Kullanıcı adı zaten kayıtlı.' });
    }

    // Yeni kullanıcı ekle
    await connection.execute(
      'INSERT INTO users (user_name, user_email, user_password) VALUES (?, ?, ?)',
      [name, email, password]
    );

    await connection.end();
    return NextResponse.json({ success: true, message: 'Kayıt başarılı!' });
  } catch (error) {
    console.error('Register sırasında hata:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu.' });
  }
}