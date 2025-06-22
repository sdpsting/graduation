// src/app/api/blog/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises'; // Node.js file system module (promise-based)
import path from 'path';     // Node.js path module

// JSON dosyasının tam yolu
// process.cwd() projenin kök dizinini verir.
// Eğer data klasörünüz src içinde değilse, 'src' kısmını yoldan kaldırın.
const blogFilePath = path.join(process.cwd(), 'src', 'data', 'blog-posts.json');

// Tip tanımı (isteğe bağlı ama iyi bir pratik)
type BlogPost = {
  id: string;
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD formatında olmalı sıralama için
  content_html: string;
  is_published: boolean;
};

export async function GET() {
  try {
    // JSON dosyasını oku
    const jsonData = await fs.readFile(blogFilePath, 'utf-8');
    // JSON string'ini JavaScript objesine/dizisine çevir
    const allBlogPosts: BlogPost[] = JSON.parse(jsonData);

    // Sadece yayınlanmış olanları filtrele
    const publishedPosts = allBlogPosts.filter(post => post.is_published === true);

    // Tarihe göre en yeniden eskiye doğru sırala
    const sortedPosts = publishedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(sortedPosts);

  } catch (error: any) {
    console.error("Blog verileri okunurken hata oluştu:", error.message);
    // Hata durumunda istemciye anlamlı bir mesaj gönder
    return NextResponse.json(
      { message: "Blog yazılarına erişilirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin." },
      { status: 500 } // Sunucu hatası
    );
  }
}