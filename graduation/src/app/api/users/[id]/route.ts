import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const runtime = 'nodejs';

export async function GET(request: NextRequest, { params: routeParams }: { params: { id: string } }) {
  // 'params' ismini route'tan gelenle karıştırmamak için 'routeParams' olarak değiştirdim.
  // Aslında doğrudan 'params' da kullanabilirsiniz, ama okunabilirlik için.

  // 1. routeParams objesinin kendisini await ile bekle
  const awaitedParams = await routeParams; // VEYA doğrudan `await params;`

  // 2. awaitedParams'ın ve içindeki id'nin varlığını kontrol et
  if (!awaitedParams || typeof awaitedParams.id !== 'string') {
    return NextResponse.json({ success: false, message: 'Geçersiz veya eksik ID parametresi.' }, { status: 400 });
  }

  const id = awaitedParams.id; // Artık id'nin string olduğunu biliyoruz

  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'userdb',
    });

    const [users] = await connection.execute<RowDataPacket[]>(
      'SELECT id, user_name, balance, steam_id FROM users WHERE id = ?',
      [id]
    );

    if (users.length > 0) {
      const user = users[0];
      return NextResponse.json({ success: true, user: user });
    } else {
      return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }
  } catch (error) {
    console.error(`Kullanıcı (${id}) bilgisi çekme hatası:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir sunucu hatası oluştu.';
    return NextResponse.json({ success: false, message: 'Sunucu hatası: Kullanıcı bilgileri alınamadı.', errorDetail: errorMessage }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

export async function PUT(request: NextRequest, { params: routeParams }: { params: { id: string } }) {
  const awaitedParams = await routeParams;

  if (!awaitedParams || typeof awaitedParams.id !== 'string') {
    return NextResponse.json({ success: false, message: 'Geçersiz veya eksik ID parametresi.' }, { status: 400 });
  }
  const id = awaitedParams.id;

  let connection;

  try {
    const { balance } = await request.json();

    if (typeof balance !== 'number') {
        return NextResponse.json({ success: false, message: 'Geçersiz bakiye değeri. Bakiye bir sayı olmalıdır.' }, { status: 400 });
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '1234',
      database: process.env.DB_NAME || 'userdb',
    });

    const [userCheck] = await connection.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (userCheck.length === 0) {
      return NextResponse.json({ success: false, message: 'Güncellenecek kullanıcı bulunamadı.' }, { status: 404 });
    }

    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE users SET balance = ? WHERE id = ?',
      [balance, id]
    );

    if (result.affectedRows > 0) {
      return NextResponse.json({ success: true, message: 'Bakiye başarıyla güncellendi.' });
    } else {
      return NextResponse.json({ success: false, message: 'Bakiye güncellenemedi veya zaten aynıydı.' });
    }
  } catch (error) {
    console.error(`Kullanıcı (${id}) bakiyesi güncelleme hatası:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir sunucu hatası oluştu.';
    return NextResponse.json({ success: false, message: 'Sunucu hatası: Bakiye güncellenemedi.', errorDetail: errorMessage }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}