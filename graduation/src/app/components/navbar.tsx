// src/app/components/navbar.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation'; // next/router yerine next/navigation
import React, { useEffect, useState, useCallback } from 'react';

type StoredUser = {
  id: number;
  name: string;
  balance: string | number; // String veya number olabilir, formatBalance halleder
  steamId?: string;
  role?: 'user' | 'admin' | string;
};

export default function Navbar() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [currentBalance, setCurrentBalance] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false); // Client'da olduğumuzu anlamak için
  const router = useRouter();

  const loadUserData = useCallback(() => {
    // console.log("Navbar: loadUserData tetiklendi"); // Debug
    const token = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('user');
    if (token && storedUserString) {
      try {
        const parsedUser: StoredUser = JSON.parse(storedUserString);
        setLoggedInUser(parsedUser);
        // Balance'ı string olarak alıp formatBalance'a gönderelim.
        // `parsedUser.balance` number ise String() ile çevrilir, string ise zaten stringdir.
        setCurrentBalance(String(parsedUser.balance));
      } catch (e) {
        console.error("Navbar: localStorage parse hatası:", e);
        // Hatalı veriyi temizle ve kullanıcıyı logout yap
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLoggedInUser(null);
        setCurrentBalance(null);
      }
    } else {
      setLoggedInUser(null);
      setCurrentBalance(null);
    }
  }, []);

  useEffect(() => {
    setIsClient(true); // Component client'a mount oldu
    loadUserData(); // İlk yüklemede kullanıcı verisini çek
  }, [loadUserData]);

  // localStorage değişikliklerini ve custom event'i dinle
  useEffect(() => {
    if (!isClient) return; // Sadece client tarafında çalışsın

    const handleStorageOrUserUpdate = (event?: StorageEvent | CustomEvent) => {
      // console.log("Navbar: handleStorageOrUserUpdate tetiklendi, event type:", event?.type); // Debug
      // StorageEvent ise key kontrolü yap, CustomEvent ise direkt yükle
      if (event && event instanceof StorageEvent) {
        if (event.key === 'token' || event.key === 'user') {
          loadUserData();
        }
      } else if (!event || event.type === 'localStorageUserUpdated') { 
        // event yoksa (ilk yükleme sonrası) veya custom event ise
        loadUserData();
      }
    };

    window.addEventListener('storage', handleStorageOrUserUpdate as EventListener);
    window.addEventListener('localStorageUserUpdated', handleStorageOrUserUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageOrUserUpdate as EventListener);
      window.removeEventListener('localStorageUserUpdated', handleStorageOrUserUpdate as EventListener);
    };
  }, [isClient, loadUserData]); // loadUserData dependency array'de olmalı

  const handleLogout = (redirect = true) => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');
    setLoggedInUser(null);
    setCurrentBalance(null);
    if (redirect) router.push('/login');
    // İsteğe bağlı: Diğer sekmeleri de haberdar etmek için event dispatch edilebilir
    // window.dispatchEvent(new StorageEvent('storage', { key: 'token', newValue: null }));
  };

  const formatBalance = (balance: string | null): string => {
    if (balance === null || balance === undefined) return 'Yükleniyor...';
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) return 'Hata';
    return `$${numBalance.toFixed(2)}`;
  };

  const handleBalanceClick = () => router.push('/pay');
  const handleProfileClick = () => router.push('/profile');

  if (!isClient) {
    // SSR/SSG sırasında veya client mount olmadan önce basit bir iskelet göster
    return (
      <nav className="navbar navbar-expand-lg navbar-background">
        <div className="container-fluid">
          <Link href="/" className="navbar-brand">
            <img src="https://i.ibb.co/M2gLGLV/image.png" alt="Logo" style={{ width: '60px' }} />
          </Link>
          <button className="navbar-toggler" type="button">
            <span className="navbar-toggler-icon" style={{filter: 'invert(1)'}}></span>
          </button>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-background"> 
      <div className="container-fluid">
        <Link href="/" className="navbar-brand">
          <img src="https://i.ibb.co/M2gLGLV/image.png" alt="Logo" style={{ width: '60px', height: 'auto' }} />
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" 
                aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon" style={{filter: 'invert(1)'}}></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><Link href="/market" className="nav-link">Market</Link></li>
            {loggedInUser && (
              <>
                <li className="nav-item"><Link href="/envanter" className="nav-link">Envanterim</Link></li>
                <li className="nav-item"><Link href="/withdrawal" className="nav-link">Eşya Yönetimi</Link></li>
              </>
            )}
            {loggedInUser && loggedInUser.role === 'admin' && (
              <li className="nav-item"><Link href="/admin" className="nav-link text-warning fw-bold">Admin Paneli</Link></li>
            )}
            <li className="nav-item"><Link href="/sss" className="nav-link">S.S.S.</Link></li>
            <li className="nav-item"><Link href="/blog" className="nav-link">Blog</Link></li>
          </ul>
          {loggedInUser ? (
            <div className="d-flex align-items-center">
              <span className="me-3" style={{color: 'var(--foreground)'}}>Hoş geldin, {loggedInUser.name}</span>
              <div className="balance-container d-flex flex-column justify-content-center align-items-center me-3" onClick={handleBalanceClick} style={{cursor: 'pointer'}}>
                <span className="balance-label small text-muted">Bakiye</span>
                <span className="balance-amount fw-bold">{formatBalance(currentBalance)}</span>
              </div>
              <div className="account-logo me-3" style={{ cursor: 'pointer' }} onClick={handleProfileClick}>
                <img src="https://w7.pngwing.com/pngs/215/58/png-transparent-computer-icons-google-account-scalable-graphics-computer-file-my-account-icon-rim-123rf-symbol-thumbnail.png"
                     alt="Account" style={{ width: '35px', height: '35px', borderRadius: '50%' }} />
              </div>
              <button className="btn btn-danger btn-sm" type="button" onClick={() => handleLogout()}>Çıkış Yap</button>
            </div>
          ) : (
            <div className="d-flex">
              <Link href="/login" className="btn btn-outline-light me-2 btn-sm" role="button">Giriş Yap</Link>
              <Link href="/register" className="btn btn-warning btn-sm" role="button">Kayıt Ol</Link>
            </div>
          )}
        </div>
      </div>
      {/* Navbar için özel stiller (isteğe bağlı, global.css'e de taşınabilir) */}
      <style jsx>{`
        .navbar-background {
          background-color: #1a1d24; /* Senin navbar arka plan rengin */
          border-bottom: 1px solid #2c323a;
        }
        .nav-link {
          color: #c0c0c0; /* Navbar link rengi */
          transition: color 0.2s ease-in-out;
        }
        .nav-link:hover, .nav-link:focus {
          color: #ffffff;
        }
        .navbar-brand img {
          transition: transform 0.3s ease;
        }
        .navbar-brand:hover img {
          transform: scale(1.1);
        }
        .balance-container .balance-label {
            font-size: 0.75rem;
            color: #a0a0a0;
        }
        .balance-container .balance-amount {
            font-size: 0.9rem;
            color: #00ff00; /* Yeşil bakiye rengi */
        }
      `}</style>
    </nav>
  );
}