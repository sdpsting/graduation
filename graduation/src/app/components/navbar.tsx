'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [balance, setBalance] = useState<number | null>(null); // Bakiye durumu eklendi
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));

      const userId = JSON.parse(storedUser).id;
      fetchBalance(userId); // Kullanıcı bilgisiyle bakiye verisini al
    }
  }, []);

  const fetchBalance = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      if (data.success && data.user) {
        setBalance(data.user.balance); // API'den gelen bakiyeyi state'e kaydet
      } else {
        console.error('Bakiye verisi alınamadı');
      }
    } catch (error) {
      console.error('Bakiye verisi alınırken bir hata oluştu:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleBalanceClick = () => {
    router.push('/pay'); // Bakiye kısmına tıklanınca ödeme sayfasına yönlendirme
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleInventoryClick = () => {
    router.push('/envanter');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-background">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand">
          <img
            src="https://i.ibb.co/35QDVPGV/testing.png"
            alt="Logo"
            style={{ width: '60px', height: 'auto' }}
            className="d-inline-block align-text-top"
          />
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
              <Link href="/market" className="nav-link active text-white">Market</Link>
            </li>
            <li className="nav-item">
              <Link href="/envanter" className="nav-link text-white" onClick={handleInventoryClick}>
                Envanter
              </Link>
            </li>
            <li className="nav-item">
              <Link href="/sss" className="nav-link text-white">S.S.S.</Link>
            </li>
            <li className="nav-item">
              <Link href="/blog" className="nav-link text-white">Blog</Link>
            </li>
          </ul>

          {user ? (
            <div className="d-flex align-items-center">
              <span className="text-white me-2">Hoş geldiniz, {user.name}</span>

              <div
                className="balance-container d-flex flex-column justify-content-center align-items-center"
                onClick={handleBalanceClick}
              >
                <span className="balance-label">Bakiye</span>
                <span className="balance-amount">${balance !== null ? balance : 'Yükleniyor...'}</span>
              </div>

              <div
                className="account-logo"
                style={{ cursor: 'pointer', marginRight: '10px' }}
                onClick={handleProfileClick}
              >
                <img
                  src="https://w7.pngwing.com/pngs/215/58/png-transparent-computer-icons-google-account-scalable-graphics-computer-file-my-account-icon-rim-123rf-symbol-thumbnail.png"
                  alt="Account"
                  style={{ width: '40px', height: 'auto', borderRadius: '50%' }}
                />
              </div>
              <button className="btn btn-outline-light" type="button" onClick={handleLogout}>
                Çıkış Yap
              </button>
            </div>
          ) : (
            <Link href="/login" passHref>
              <button className="btn btn-outline-light" type="button">Giriş Yap</button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
