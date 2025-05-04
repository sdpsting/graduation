import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

// Tüm kullanıcıları listele (GET /api/users)
export async function GET() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'userdb',
    });

    const [users] = await connection.execute<RowDataPacket[]>(
      'SELECT id, user_name, balance FROM users'
    );

    await connection.end();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Hata:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu.' });
  }
}
