// src/app/api/admin/blog/route.ts
import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// BlogPost tipini burada veya ayrı bir types.ts dosyasında tanımlayabilirsiniz
type BlogPost = {
  id: string;
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  content_html: string;
  is_published: boolean;
};

const blogFilePath = path.join(process.cwd(), 'src', 'data', 'blog-posts.json');

// ---- YARDIMCI FONKSİYONLAR BU DOSYAYA ÖZEL ----
async function readBlogPostsFromFile(): Promise<BlogPost[]> {
  try {
    const jsonData = await fs.readFile(blogFilePath, 'utf-8');
    return JSON.parse(jsonData) as BlogPost[];
  } catch (error: any) {
    if (error.code === 'ENOENT') { // Dosya bulunamadıysa boş dizi dön
      await fs.writeFile(blogFilePath, JSON.stringify([], null, 2), 'utf-8'); // Dosyayı oluştur
      return [];
    }
    console.error("Blog verileri okunamadı (admin):", error);
    throw new Error("Blog verileri okunamadı.");
  }
}

async function writeBlogPostsToFile(posts: BlogPost[]): Promise<void> {
  try {
    const jsonData = JSON.stringify(posts, null, 2);
    await fs.writeFile(blogFilePath, jsonData, 'utf-8');
  } catch (error) {
    console.error("Blog verileri yazılamadı (admin):", error);
    throw new Error("Blog verileri kaydedilemedi.");
  }
}

function generateNewIdForPost(): string {
  return `post-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
// ---- YARDIMCI FONKSİYONLAR SONU ----

// Tüm blog yazılarını getir (admin için yayınlanmamışlar dahil)
export async function GET(request: NextRequest) {
  // Middleware bu endpoint'i admin rolü için korumalı
  try {
    const posts = await readBlogPostsFromFile();
    return NextResponse.json(posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Blog yazıları getirilirken sorun oluştu." }, { status: 500 });
  }
}

// Yeni blog yazısı ekle
export async function POST(request: NextRequest) {
  // Middleware bu endpoint'i admin rolü için korumalı
  try {
    const newPostData = await request.json();
    
    if (!newPostData.title || !newPostData.content_html || !newPostData.date) {
      return NextResponse.json({ message: "Başlık, içerik ve tarih alanları zorunludur." }, { status: 400 });
    }

    const posts = await readBlogPostsFromFile();
    
    const newPost: BlogPost = {
      id: generateNewIdForPost(),
      slug: (newPostData.slug || newPostData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')).substring(0, 100),
      title: newPostData.title,
      date: newPostData.date,
      content_html: newPostData.content_html,
      is_published: newPostData.is_published === true, // Default false olabilir
    };

    posts.unshift(newPost);
    await writeBlogPostsToFile(posts);

    return NextResponse.json({ message: "Blog yazısı başarıyla eklendi.", post: newPost }, { status: 201 });

  } catch (error: any) {
    console.error("[API ADMIN BLOG POST] Hata:", error);
    return NextResponse.json({ message: error.message || "Blog yazısı eklenirken bir sorun oluştu." }, { status: 500 });
  }
}