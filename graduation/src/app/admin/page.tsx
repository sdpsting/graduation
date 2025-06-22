// src/app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Navbar from 'src/app/components/navbar';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type StoredUser = {
  id: number;
  name: string; // user_name olmalı login API'nizdeki gibi
  role?: 'user' | 'admin' | string;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userString) {
      router.replace('/login?redirect=/admin');
      return;
    }

    try {
      const user: StoredUser = JSON.parse(userString);
      if (user && user.role === 'admin') {
        setIsAdmin(true);
      } else {
        const errMsg = 'Bu sayfaya erişim yetkiniz yok.';
        setError(errMsg);
        setMessage({ type: 'error', text: errMsg });
        router.replace('/');
      }
    } catch (e) {
      console.error("localStorage 'user' parse hatası (admin page):", e);
      const errMsg = 'Oturum bilgileri okunamadı.';
      setError(errMsg);
      setMessage({ type: 'error', text: errMsg });
      router.replace('/login');
    }
  }, [router]);

  if (isAdmin === null) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Yetki kontrol ediliyor...</span>
          </div>
          <p className="mt-2">Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    // Bu normalde useEffect yönlendirmesi nedeniyle görünmez.
    // Hata mesajı zaten error/message state'inde var ve Navbar altı bir yerde gösterilebilir.
    return null; 
  }

  return (
    <div className="custom-admin-background">
      <Navbar />
      <div className="container mt-4">
        <header className="py-3 mb-4 border-bottom">
          <h1 className="text-white">Admin Paneli</h1>
        </header>

        {/* Mesaj ve Hata Gösterimi */}
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : (message.type === 'info' ? 'alert-info' : 'alert-danger')}`} role="alert">
            {message.text}
          </div>
        )}
        {error && !message && (
            <div className="alert alert-danger" role="alert">{error}</div>
        )}

        <p className="lead text-light mb-4">Hoş geldiniz, Admin! Buradan siteyle ilgili çeşitli yönetimsel işlemleri yapabilirsiniz.</p>
        
        <div className="row mt-4 gy-4"> {/* gy-4 ile dikey boşluk artırıldı */}
          <div className="col-md-6 col-lg-4"> {/* Boyutlar ayarlandı */}
            <div className="card text-white bg-dark h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title"><i className="bi bi-people-fill me-2"></i>Kullanıcı Yönetimi</h5>
                <p className="card-text flex-grow-1">Kullanıcıları görüntüleyin, rollerini ve bakiyelerini düzenleyin.</p>
                <Link href="/admin/users" className="btn btn-primary mt-auto">
                  Kullanıcılara Git
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-6 col-lg-4">
            <div className="card text-white bg-dark h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title"><i className="bi bi-box-seam-fill me-2"></i>Item Yönetimi (Market)</h5>
                <p className="card-text flex-grow-1">Sizin marketinize eklenecek/çıkarılacak item'ları yönetin.</p>
                 <Link href="/admin/items" className="btn btn-primary mt-auto">
                  Market Item Yönetimi
                </Link>
              </div>
            </div>
          </div>
          
          {/* ---- SITE AYARLARI KARTI GÜNCELLENDİ ---- */}
          <div className="col-md-6 col-lg-4">
            <div className="card text-white bg-dark h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title"><i className="bi bi-gear-fill me-2"></i>Site İçerik Yönetimi</h5>
                <p className="card-text flex-grow-1">Blog yazılarını ve S.S.S. (Sıkça Sorulan Sorular) bölümünü yönetin.</p>
                <div className="mt-auto">
                    <Link href="/admin/site-settings/blog" className="btn btn-info d-block mb-2">
                        <i className="bi bi-file-post me-2"></i>Blog Yönetimi
                    </Link>
                    <Link href="/admin/site-settings/faq" className="btn btn-info d-block">
                        <i className="bi bi-patch-question-fill me-2"></i>S.S.S. Yönetimi
                    </Link>
                </div>
              </div>
            </div>
          </div>
          {/* ---- SITE AYARLARI KARTI SONU ---- */}

           <div className="col-md-6 col-lg-4">
            <div className="card text-white bg-dark h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <h5 className="card-title"><i className="bi bi-steam me-2"></i>Steam Envanter Yönetimi</h5>
                <p className="card-text flex-grow-1">Kullanıcıların Steam envanterlerinden siteye satmak istedikleri item'ları yönetin (onay, fiyat belirleme vb.).</p>
                 <Link href="/admin/steam-inventory" className="btn btn-primary mt-auto" aria-disabled="true" style={{pointerEvents: "none", opacity: 0.65}}>
                    Steam Envanteri (Yakında)
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
      <style jsx global>{`
        .custom-admin-background {
          background-color: #1e272e; /* Koyu Mavi-Gri */
          color: #f5f6fa;
          min-height: 100vh;
        }
        .custom-admin-background .card {
            border: 1px solid #4a5568; /* Biraz daha belirgin border */
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
        }
        .custom-admin-background .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.25)!important;
        }
        .custom-admin-background .card-title {
            color: #ffffff;
            display: flex;
            align-items: center; /* İkon ve başlığı hizala */
        }
        .custom-admin-background .card-title .bi { /* Bootstrap Icons için */
            font-size: 1.1em; /* İkonu biraz büyüt */
        }
        .custom-admin-background .card-text {
            color: #a0aec0; /* Daha soluk bir gri */
            font-size: 0.9rem;
        }
        .custom-admin-background .btn-primary {
            background-color: #3c50e0; /* Admin paneli için farklı bir ana renk */
            border-color: #3c50e0;
        }
        .custom-admin-background .btn-primary:hover {
            background-color: #2a3db3;
            border-color: #2a3db3;
        }
        .custom-admin-background .btn-info { /* Site Ayarları için farklı renk */
            background-color: #0ca678; /* Yeşilimsi bir renk */
            border-color: #0ca678;
        }
        .custom-admin-background .btn-info:hover {
            background-color: #098b63;
            border-color: #098b63;
        }
      `}</style>
    </div>
  );
}