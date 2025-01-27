import { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';

// MySQL veritabanına bağlanmak için bir fonksiyon
async function connectToDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
  return connection;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  const { id } = req.query; // URL'den gelen id parametresi

  if (method === 'PUT') {
    try {
      const connection = await connectToDatabase();
      const { name, email, password } = req.body;

      // Kullanıcı bilgilerini güncellemek için SQL sorgusu
      const [result] = await connection.execute(
        'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?',
        [name, email, password, id]
      );

      // result değişkeni, sorgu sonucunun meta verilerini içerir
      const { affectedRows } = result as any; // affectedRows'u almak için any türüne dönüştürme

      if (affectedRows === 0) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı veya güncellenemedi.' });
      }

      res.status(200).json({ message: 'Kullanıcı başarıyla güncellendi.' });
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      res.status(500).json({ message: 'Sunucu hatası.' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}