// src/app/blog/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Navbar from 'src/app/components/navbar'; // Yolunu kendi proje yapına göre güncelle
import 'bootstrap/dist/css/bootstrap.min.css';
// CSS dosyanızı import edin (eğer admin için ayrıysa veya globals.css ise)
// import 'src/app/admin/admin-styles.css'; // Örnek

type BlogPost = {
  id: string;
  slug: string;
  title: string;
  date: string; // Format: "YYYY-MM-DD"
  content_html: string;
  is_published: boolean; // Bu alanı API'den alıyoruz ama şu anki gösterimde kullanmıyoruz
};

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null); // Önceki hataları temizle
    fetch('/api/blog') // API endpoint'imiz
      .then(res => {
        if (!res.ok) {
          // res.json() ile hata mesajını almaya çalışalım
          return res.json().then(errData => {
            throw new Error(errData.message || 'Blog yazıları yüklenemedi.');
          }).catch(() => { // Eğer res.json() da hata verirse
            throw new Error(`Blog yazıları yüklenemedi. Sunucu hatası: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data: BlogPost[]) => {
        // API zaten yayınlanmış ve sıralanmışları dönüyor
        setPosts(data);
      })
      .catch(err => {
        console.error("Blog fetch error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container-fluid custom-background"> {/* CSS'inizdeki class */}
        <Navbar />
        <div className="container mt-5 text-white text-center">
            <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
            </div>
            <p className="mt-2">Blog yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid custom-background"> {/* CSS'inizdeki class */}
        <Navbar />
        <div className="container mt-5">
            <div className="alert alert-danger text-center">Hata: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid custom-background"> {/* CSS'inizdeki class */}
      <Navbar />
      <div className="container mt-5 text-white"> {/* text-white'ı container'a taşıdım */}
        <h1 className="mb-5 text-center blog-header">Counter Strike 2 Güncellemeler</h1> {/* CSS'inizdeki class */}

        {posts.length === 0 && !loading && (
          <p className="text-center alert alert-info">Henüz blog yazısı bulunmuyor.</p>
        )}

        {posts.map(post => (
          <div className="update-box mb-5 p-4" key={post.id}> {/* CSS'inizdeki class, padding ekledim */}
            <h3 className="text-center mb-3">{post.title}</h3> {/* mb-3 eklendi */}
            <p className="text-center text-muted small mb-3">
                Yayınlanma Tarihi: {new Date(post.date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div 
              className="update-content" /* CSS'inizdeki class */
              dangerouslySetInnerHTML={{ __html: post.content_html }} 
            />
          </div>
        ))}
      </div>
    </div>
  );
}