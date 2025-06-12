// src/app/components/navbar.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const loadUserData = useCallback(async () => {
    const token = localStorage.getItem('token'); // Token anahtarının 'token' olduğundan emin ol
    const storedUserString = localStorage.getItem('user');
    if (token && storedUserString) {
      try {
        const parsedUser: StoredUser = JSON.parse(storedUserString);
        setLoggedInUser(parsedUser);
        setCurrentBalance(String(parsedUser.balance)); // String olarak alalım
      } catch (e) {
        console.error("Navbar: localStorage parse hatası:", e);
        localStorage.removeItem('user'); localStorage.removeItem('token');
        setLoggedInUser(null); setCurrentBalance(null);
      }
    } else {
      setLoggedInUser(null); setCurrentBalance(null);
    }
  }, []);

  useEffect(() => {
    setIsClient(true); // Bu, component'in client'da olduğundan emin olmak için
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    if (!isClient) return; // Sadece client'da çalışsın
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'token' || event.key === 'user') {
        loadUserData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isClient, loadUserData]);

  const handleLogout = (redirect = true) => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');
    setLoggedInUser(null);
    setCurrentBalance(null);
    if (redirect) router.push('/login');
  };

  const handleBalanceClick = () => router.push('/pay');
  const handleProfileClick = () => router.push('/profile');

  // Client-side render öncesi için basit bir iskelet.
  // Bu, hydration hatalarını önlemeye yardımcı olur ve sayfa ilk yüklenirken kaymaları azaltır.
  if (!isClient) {
    return (
      <nav className="navbar navbar-expand-lg navbar-background"> {/* Senin CSS class'ın */}
        <div className="container-fluid">
          <Link href="/" className="navbar-brand">
            <img src="https://i.ibb.co/35QDVPGV/testing.png" alt="Logo" style={{ width: '60px' }} />
          </Link>
          {/* Menü toggle butonu (placeholder) */}
          <button className="navbar-toggler" type="button">
            <span className="navbar-toggler-icon"></span>
          </button>
          {/* Diğer placeholder içerikler eklenebilir, ama genellikle boş bırakılır. */}
        </div>
      </nav>
    );
  }

  const formatBalance = (balance: string | null): string => {
    if (balance === null || balance === undefined) return 'Yükleniyor...'; // Veya '-'
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) return 'N/A'; // Hatalı bakiye durumu
    return `$${numBalance.toFixed(2)}`; // Para birimi sembolünü isteğe göre değiştir
  }

  return (
    // ---- NAVBAR'IN ANA SATIRI ----
    // `bg-dark` gibi Bootstrap arka plan class'larını kaldırdım, senin `navbar-background` class'ın kullanılacak.
    <nav className="navbar navbar-expand-lg navbar-background"> 
    {/* ----------------------------- */}
      <div className="container-fluid"> {/* Tam genişlik için container-fluid */}
        <Link href="/" className="navbar-brand">
          <img
            src="https://i.ibb.co/M2gLGLV/image.png" // Logo URL'niz
            alt="Logo"
            style={{ width: '60px', height: 'auto' }}
            className="d-inline-block align-text-top"
          />
        </Link>
        <button
          className="navbar-toggler" type="button" data-bs-toggle="collapse"
          data-bs-target="#navbarContent" aria-controls="navbarContent"
          aria-expanded="false" aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" style={{filter: 'invert(1)'}}></span> {/* Mobil toggle icon rengi için */}
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              {/* text-white gibi Bootstrap renk class'ları yerine CSS'indeki .nav-link stilini kullan */}
              <Link href="/market" className="nav-link">Market</Link>
            </li>
            {loggedInUser && (
              <>
                <li className="nav-item">
                  <Link href="/envanter" className="nav-link">Envanterim</Link>
                </li>
                <li className="nav-item">
                  <Link href="/withdrawal" className="nav-link">Eşya Yönetimi</Link>
                </li>
              </>
            )}
            {loggedInUser && loggedInUser.role === 'admin' && (
              <li className="nav-item">
                <Link href="/admin" className="nav-link text-warning fw-bold">Admin Paneli</Link> {/* Bu özel kalabilir */}
              </li>
            )}
            <li className="nav-item">
              <Link href="/sss" className="nav-link">S.S.S.</Link>
            </li>
            <li className="nav-item">
              <Link href="/blog" className="nav-link">Blog</Link>
            </li>
          </ul>

          {loggedInUser ? (
            <div className="d-flex align-items-center">
              {/* text-white gibi Bootstrap renk class'ları yerine CSS'indeki genel metin rengini kullan */}
              <span className="me-3" style={{color: 'var(--foreground)'}}>Hoş geldin, {loggedInUser.name}</span>
              
              <div
                className="balance-container d-flex flex-column justify-content-center align-items-center me-3" // CSS'indeki .balance-container kullanılacak
                onClick={handleBalanceClick}
              >
                <span className="balance-label">Bakiye</span> {/* CSS'indeki .balance-label */}
                <span className="balance-amount">{formatBalance(currentBalance)}</span> {/* CSS'indeki .balance-amount */}
              </div>

              <div
                className="account-logo me-3" // CSS'te bu class'a stil verebilirsin
                style={{ cursor: 'pointer' }}
                onClick={handleProfileClick}
              >
                <img
                  src="https://w7.pngwing.com/pngs/215/58/png-transparent-computer-icons-google-account-scalable-graphics-computer-file-my-account-icon-rim-123rf-symbol-thumbnail.png"
                  alt="Account"
                  style={{ width: '35px', height: '35px', borderRadius: '50%' }}
                />
              </div>
              <button className="btn btn-danger" type="button" onClick={() => handleLogout()}> {/* Bootstrap danger butonu */}
                Çıkış Yap
              </button>
            </div>
          ) : (
            <div className="d-flex">
              <Link href="/login" className="btn btn-outline-light me-2" role="button">
                Giriş Yap
              </Link>
              <Link href="/register" className="btn btn-warning" role="button"> {/* text-dark eklenebilir */}
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}