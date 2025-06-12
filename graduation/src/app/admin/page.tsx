// src/app/admin/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Navbar from 'src/app/components/navbar'; // Genel Navbar'ınızı kullanabilirsiniz
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // next/navigation kullanıyoruz

// Opsiyonel: Admin'e özel bir sidebar veya layout component'i de oluşturabilirsiniz.
// import AdminLayout from 'src/app/components/adminLayout'; 

type StoredUser = {
  id: number;
  name: string;
  role?: 'user' | 'admin' | string;
  // Diğer alanlar...
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null: kontrol edilmedi

  // Client-side yetki kontrolü (Middleware zaten bir katman sağlıyor ama ek güvence)
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token'); // Token da kontrol edilebilir

    if (!token || !userString) {
      // Token veya kullanıcı bilgisi yoksa login'e yönlendir
      router.replace('/login?redirect=/admin');
      return;
    }

    try {
      const user: StoredUser = JSON.parse(userString);
      if (user && user.role === 'admin') {
        setIsAdmin(true);
      } else {
        // Admin değilse veya rol bilgisi yoksa ana sayfaya yönlendir
        // console.warn('Admin olmayan kullanıcı /admin sayfasına erişmeye çalıştı (client-side).');
        setError('Bu sayfaya erişim yetkiniz yok.'); // Hata state'i ekleyebilirsiniz
        setMessage({ type: 'error', text: 'Bu sayfaya erişim yetkiniz yok.' }); // Veya message state
        router.replace('/'); // Ana sayfaya yönlendir
      }
    } catch (e) {
      console.error("localStorage 'user' parse hatası (admin page):", e);
      setError('Oturum bilgileri okunamadı.');
      setMessage({ type: 'error', text: 'Oturum bilgileri okunamadı.' });
      router.replace('/login');
    }
  }, [router]);

  // --- Hata ve Mesaj state'lerini ekleyelim (opsiyonel, kullanıcıya geri bildirim için) ---
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  // ---------------------------------------------------------------------------------------


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
    // Bu kısım normalde useEffect içindeki yönlendirme nedeniyle pek görünmez,
    // ama bir fallback olarak veya anlık bir mesaj için tutulabilir.
    // Yönlendirme zaten yapıldığı için null döndürmek daha temiz olabilir.
    return null; 
  }

  // Admin ise sayfa içeriğini göster
  return (
    <div className="custom-admin-background"> {/* Admin paneline özel bir arkaplan class'ı olabilir */}
      <Navbar />
      <div className="container mt-4">
        <header className="py-3 mb-4 border-bottom">
          <h1 className="text-white">Admin Paneli</h1>
        </header>

        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
            {message.text}
          </div>
        )}
        {error && !message && ( // Eğer sadece error varsa göster
            <div className="alert alert-danger" role="alert">{error}</div>
        )}


        <p className="lead text-light">Hoş geldiniz, Admin! Buradan siteyle ilgili çeşitli yönetimsel işlemleri yapabilirsiniz.</p>
        
        <div className="row mt-4 gy-3"> {/* gy-3 ile kartlar arası dikey boşluk */}
          <div className="col-md-4">
            <div className="card text-white bg-dark h-100">
              <div className="card-body">
                <h5 className="card-title">Kullanıcı Yönetimi</h5>
                <p className="card-text">Kullanıcıları görüntüleyin, rollerini ve bakiyelerini düzenleyin.</p>
                <Link href="/admin/users" className="btn btn-primary">
                  Kullanıcılara Git
                </Link>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-white bg-dark h-100">
              <div className="card-body">
                <h5 className="card-title">Item Yönetimi</h5>
                <p className="card-text">Market item'larını ekleyin, düzenleyin veya kaldırın.</p>
                 <Link href="/admin/items" className="btn btn-primary">
                  Item Yönetimine Git
                </Link>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="card text-white bg-dark h-100">
              <div className="card-body">
                <h5 className="card-title">Site Ayarları</h5>
                <p className="card-text">Genel site ayarlarını ve yapılandırmalarını yönetin.</p>
                <button className="btn btn-primary" disabled>Ayarlara Git (Yakında)</button>
              </div>
            </div>
          </div>
          {/* Gelecekte eklenebilecek diğer admin modülleri için kartlar buraya gelebilir */}
        </div>
      </div>
      <style jsx global>{`
        .custom-admin-background {
          background-color: #1e272e; /* Admin paneli için farklı bir koyu tema */
          color: #f5f6fa;
          min-height: 100vh;
        }
        .custom-admin-background .card {
            border-color: #485460;
        }
        .custom-admin-background .card-title {
            color: #ffffff;
        }
        .custom-admin-background .card-text {
            color: #d2dae2;
        }
        .custom-admin-background .btn-primary {
            background-color: #4a69bd; /* Admin paneli için farklı bir ana renk */
            border-color: #4a69bd;
        }
        .custom-admin-background .btn-primary:hover {
            background-color: #303952;
            border-color: #303952;
        }
      `}</style>
    </div>
  );
}