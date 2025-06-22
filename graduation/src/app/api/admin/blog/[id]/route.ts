// src/app/api/admin/blog/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type BlogPost = {
  id: string; slug: string; title: string; date: string; content_html: string; is_published: boolean;
};
const blogFilePath = path.join(process.cwd(), 'src', 'data', 'blog-posts.json');

// ---- YARDIMCI FONKSİYONLAR BU DOSYAYA ÖZEL ----
async function readBlogPostsFromFile(): Promise<BlogPost[]> {
  try {
    const jsonData = await fs.readFile(blogFilePath, 'utf-8');
    return JSON.parse(jsonData) as BlogPost[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(blogFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    console.error("Blog verileri okunamadı (admin/[id]):", error);
    throw new Error("Blog verileri okunamadı.");
  }
}

async function writeBlogPostsToFile(posts: BlogPost[]): Promise<void> {
  try {
    const jsonData = JSON.stringify(posts, null, 2);
    await fs.writeFile(blogFilePath, jsonData, 'utf-8');
  } catch (error) {
    console.error("Blog verileri yazılamadı (admin/[id]):", error);
    throw new Error("Blog verileri kaydedilemedi.");
  }
}
// ---- YARDIMCI FONKSİYONLAR SONU ----

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const posts = await readBlogPostsFromFile();
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return NextResponse.json({ message: "Blog yazısı bulunamadı." }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error: any) { /* ... */ }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const updatedData = await request.json();
    let posts = await readBlogPostsFromFile();
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
      return NextResponse.json({ message: "Güncellenecek yazı bulunamadı." }, { status: 404 });
    }
    const currentPost = posts[postIndex];
    posts[postIndex] = { // Sadece gelen alanları güncelle, ID ve slug'ı koru (slug formdan geliyorsa o da güncellenebilir)
        ...currentPost,
        title: updatedData.title !== undefined ? updatedData.title : currentPost.title,
        slug: updatedData.slug !== undefined ? updatedData.slug : currentPost.slug,
        date: updatedData.date !== undefined ? updatedData.date : currentPost.date,
        content_html: updatedData.content_html !== undefined ? updatedData.content_html : currentPost.content_html,
        is_published: updatedData.is_published !== undefined ? updatedData.is_published : currentPost.is_published,
    };
    await writeBlogPostsToFile(posts);
    return NextResponse.json({ message: "Blog yazısı güncellendi.", post: posts[postIndex] });
  } catch (error: any) { /* ... */ }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    let posts = await readBlogPostsFromFile();
    const initialLength = posts.length;
    posts = posts.filter(p => p.id !== postId);
    if (posts.length === initialLength) {
      return NextResponse.json({ message: "Silinecek yazı bulunamadı." }, { status: 404 });
    }
    await writeBlogPostsToFile(posts);
    return NextResponse.json({ message: "Blog yazısı silindi." });
  } catch (error: any) { /* ... */ }
}