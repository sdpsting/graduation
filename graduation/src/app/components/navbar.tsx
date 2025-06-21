// src/app/components/navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState, useCallback } from 'react';

type StoredUser = {
  id: number;
  name: string;
  balance: string | number;
  steamId?: string;
  role?: 'user' | 'admin' | string;
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  const [currentBalance, setCurrentBalance] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const loadUserData = useCallback(() => {
    const token = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('user');
    if (token && storedUserString) {
      try {
        const parsedUser: StoredUser = JSON.parse(storedUserString);
        setLoggedInUser(parsedUser);
        setCurrentBalance(String(parsedUser.balance));
      } catch {
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
    setIsClient(true);
    loadUserData();
  }, [loadUserData]);

  useEffect(() => {
    if (!isClient) return;
    const handleUpdate = (e?: StorageEvent | CustomEvent) => {
      if (e instanceof StorageEvent) {
        if (e.key === 'token' || e.key === 'user') loadUserData();
      } else {
        loadUserData();
      }
    };
    window.addEventListener('storage', handleUpdate as EventListener);
    window.addEventListener('localStorageUserUpdated', handleUpdate as EventListener);
    return () => {
      window.removeEventListener('storage', handleUpdate as EventListener);
      window.removeEventListener('localStorageUserUpdated', handleUpdate as EventListener);
    };
  }, [isClient, loadUserData]);

  const handleLogout = (redirect = true) => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setLoggedInUser(null);
    setCurrentBalance(null);
    if (redirect) router.push('/login');
  };

  const formatBalance = (balance: string | null): string => {
    if (balance == null) return 'Yükleniyor...';
    const num = parseFloat(balance);
    if (isNaN(num)) return 'Hata';
    return `$${num.toFixed(2)}`;
  };

  const handleBalanceClick = () => router.push('/pay');
  const handleProfileClick = () => router.push('/profile');

  if (!isClient) {
    return (
      <nav className="navbar navbar-expand-lg navbar-background">
        <div className="container-fluid">
          <Link href="/" className="navbar-brand">
            <img src="/assets/logo.png" alt="Logo" />
          </Link>
          <button className="navbar-toggler" type="button">
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>
      </nav>
    );
  }

  const linkClass = (href: string) =>
    `nav-link${pathname === href ? ' active' : ''}`;

  return (
    <nav className="navbar navbar-expand-lg navbar-background">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand">
          <img src="/assets/logo.png" alt="Logo" />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link href="/market" className={linkClass('/market')}>
                Market
              </Link>
            </li>
            {loggedInUser && (
              <>
                <li className="nav-item">
                  <Link href="/envanter" className={linkClass('/envanter')}>
                    Envanterim
                  </Link>
                </li>
                <li className="nav-item">
                  <Link href="/withdrawal" className={linkClass('/withdrawal')}>
                    Eşya Yönetimi
                  </Link>
                </li>
              </>
            )}
            {loggedInUser?.role === 'admin' && (
              <li className="nav-item">
                <Link
                  href="/admin"
                  className={linkClass('/admin') + ' text-warning fw-bold'}
                >
                  Admin Paneli
                </Link>
              </li>
            )}
            <li className="nav-item">
              <Link href="/sss" className={linkClass('/sss')}>
                S.S.S.
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/blog" className={linkClass('/blog')}>
                Blog
              </Link>
            </li>
          </ul>

          {loggedInUser ? (
            <div className="d-flex align-items-center">
              <span className="me-3" style={{ color: 'var(--foreground)' }}>
                Hoş geldin, {loggedInUser.name}
              </span>
              <div className="balance-container" onClick={handleBalanceClick}>
                <span className="balance-label">Bakiye</span>
                <span className="balance-amount">
                  {formatBalance(currentBalance)}
                </span>
              </div>
              <div className="account-logo" onClick={handleProfileClick}>
                <img
                  src="https://w7.pngwing.com/pngs/215/58/png-transparent-computer-icons-google-account-scalable-graphics-computer-file-my-account-icon-rim-123rf-symbol-thumbnail.png"
                  alt="Account"
                />
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleLogout()}
              >
                Çıkış Yap
              </button>
            </div>
          ) : (
            <div className="d-flex">
              <Link href="/login" className="btn btn-sign-in">
                Giriş Yap
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
