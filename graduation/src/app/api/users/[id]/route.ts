import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const runtime = 'nodejs'; // Node.js runtime kullanılıyor

// GET: Kullanıcı bilgilerini getir
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params; // params'i await ettik

  if (!id) {
    return NextResponse.json({ success: false, message: 'ID parametresi eksik.' }, { status: 400 });
  }

  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'userdb',
    });

    const [users] = await connection.execute<RowDataPacket[]>(
      'SELECT id, user_name, balance FROM users WHERE id = ?',
      [id]
    );

    await connection.end();

    if (users.length > 0) {
      return NextResponse.json({ success: true, user: users[0] });
    } else {
      return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }
  } catch (error) {
    console.error('Hata:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu.' });
  }
}

// PUT: Kullanıcı bakiyesini güncelle
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params; // params'i await ettik

  if (!id) {
    return NextResponse.json({ success: false, message: 'ID parametresi eksik.' }, { status: 400 });
  }

  try {
    const { balance } = await request.json();

    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '1234',
      database: 'userdb',
    });

    const [userCheck] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (userCheck.length === 0) {
      await connection.end();
      return NextResponse.json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE users SET balance = ? WHERE id = ?',
      [balance, id]
    );

    await connection.end();

    if (result.affectedRows > 0) {
      return NextResponse.json({ success: true, message: 'Bakiye başarıyla güncellendi.' });
    } else {
      return NextResponse.json({ success: false, message: 'Bakiye güncelleme başarısız.' });
    }
  } catch (error) {
    console.error('Hata:', error);
    return NextResponse.json({ success: false, message: 'Bir hata oluştu.' });
  }
}
