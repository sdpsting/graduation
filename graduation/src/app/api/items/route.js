import { NextResponse } from 'next/server';
import { createConnection } from 'mysql2/promise';

export async function GET() {
  const connection = await createConnection({
    host: 'localhost', // Veritabanı sunucunuzun adresi
    user: 'root', // Veritabanı kullanıcı adı
    password: '1234', // Veritabanı şifresi
    database: 'itemdb', // Veritabanı ismi
  });

  try {
    const [rows] = await connection.execute('SELECT name, image, wears , price FROM items');
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: 'Veritabanı hatası' }, { status: 500 });
  } finally {
    await connection.end();
  }
}