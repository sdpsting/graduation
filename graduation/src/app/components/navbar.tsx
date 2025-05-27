// src/app/components/navbar.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState }
from 'react'; // React'ı import etmeyi unutmayın

// LocalStorage'dan okunacak user objesinin tip tanımı
// Login API'nizin döndürdüğü user objesine göre bu alanları güncelleyin
type StoredUser = {
  id: number;
  name: string;
  balance: string | number; // API'niz string dönüyorsa string, number ise number
  steamId?: string;
  role?: string;
};

export default function Navbar() {
  const [loggedInUser, setLoggedInUser] = useState<StoredUser | null>(null);
  // Bakiye için ayrı bir state tutmak yerine loggedInUser.balance'ı kullanabiliriz.
  // Ancak sizin fetchBalance mantığınızı korumak için ayrı state'i bırakıyorum.
  // Eğer login sonrası user objesinde güncel bakiye varsa, fetchBalance'a gerek kalmayabilir.
  const [currentBalance, setCurrentBalance] = useState<number | string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true); // Component client'da mount oldu
    const token = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('user');

    if (token && storedUserString) {
      try {
        const parsedUser: StoredUser = JSON.parse(storedUserString);
        setLoggedInUser(parsedUser);
        // Eğer user objesinde bakiye varsa ve güncelse, fetchBalance'a gerek kalmaz.
        // setCurrentBalance(parsedUser.balance);
        // Ya da fetchBalance'ı burada çağırın
        if (parsedUser.id) {
          fetchBalance(String(parsedUser.id));
        }
      } catch (e) {
        console.error("localStorage'daki kullanıcı verisi parse edilemedi:", e);
        // Hatalı veri varsa temizleyelim
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLoggedInUser(null);
        setCurrentBalance(null);
      }
    } else {
      // Token veya user bilgisi yoksa, kullanıcı giriş yapmamış demektir.
      setLoggedInUser(null);
      setCurrentBalance(null);
    }
  }, []); // Sadece component mount olduğunda çalışır


  // Login/Logout sonrası Navbar'ı güncellemek için bir dinleyici
  // Bu, farklı sekmeler arası storage değişikliklerini yakalar.
  // Aynı sekme için, login/logout fonksiyonları sonrası state'i manuel güncellemek (aşağıdaki handleLogout'ta olduğu gibi)
  // veya global state (Context API) kullanmak daha etkilidir.
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (event: StorageEvent) => {
      // Sadece 'token' veya 'user' anahtarları değiştiğinde ilgilen
      if (event.key === 'token' || event.key === 'user') {
        console.log("Storage değişti, Navbar güncelleniyor (event listener). Key:", event.key);
        const token = localStorage.getItem('token');
        const storedUserString = localStorage.getItem('user');
        if (token && storedUserString) {
          try {
            const parsedUser: StoredUser = JSON.parse(storedUserString);
            setLoggedInUser(parsedUser);
            if (parsedUser.id) fetchBalance(String(parsedUser.id));
          } catch (e) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            setLoggedInUser(null);
            setCurrentBalance(null);
          }
        } else {
          setLoggedInUser(null);
          setCurrentBalance(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient]);


  const fetchBalance = async (userId: string) => {
    if (!userId) return;
    try {
      // Bu API endpoint'inin token gerektirip gerektirmediğini kontrol edin.
      // Eğer token gerektiriyorsa, Authorization header eklemeniz gerekir.
      // Şimdilik token gerektirmediğini varsayıyorum.
      const response = await fetch(`/api/users/${userId}`); // Kullanıcıya özel bakiye endpoint'i
      const data = await response.json();
      if (data.success && data.user && typeof data.user.balance !== 'undefined') {
        setCurrentBalance(data.user.balance);
      } else {
        console.error('Bakiye verisi alınamadı veya format yanlış:', data.message);
        // setCurrentBalance(null); // veya varsayılan bir değer
      }
    } catch (error) {
      console.error('Bakiye verisi alınırken bir hata oluştu:', error);
      // setCurrentBalance(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); // TOKEN'I SİL
    localStorage.removeItem('user');
    setLoggedInUser(null);
    setCurrentBalance(null);
    router.push('/login'); // Login sayfasına yönlendir
    // window.location.href = '/login'; // Daha keskin bir yönlendirme için
  };

  // Yönlendirme fonksiyonları (bunlar router.push kullandığı için client-side navigasyon yapar)
  const handleBalanceClick = () => router.push('/pay');
  const handleProfileClick = () => router.push('/profile');
  // handleInventoryClick zaten Link component'inde onClick ile tanımlı, Link'e href vermek yeterli.

  if (!isClient) {
    // SSR veya hydration öncesi için basit bir placeholder
    return (
      <nav className="navbar navbar-expand-lg navbar-background">
        <div className="container-fluid">
          <Link href="/" className="navbar-brand">
            <img src="https://i.ibb.co/35QDVPGV/testing.png" alt="Logo" style={{ width: '60px' }} />
          </Link>
          {/* Placeholder içerik veya boş bırakılabilir */}
        </div>
      </nav>
    );
  }

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
            {loggedInUser && ( // Kullanıcı giriş yapmışsa göster
              <>
                <li className="nav-item">
                  <Link href="/envanter" className="nav-link text-white">Envanter</Link>
                </li>
                <li className="nav-item">
                  <Link href="/withdrawal" className="nav-link text-white">Eşya Çek</Link>
                </li>
              </>
            )}
            <li className="nav-item">
              <Link href="/sss" className="nav-link text-white">S.S.S.</Link>
            </li>
            <li className="nav-item">
              <Link href="/blog" className="nav-link text-white">Blog</Link>
            </li>
          </ul>

          {loggedInUser ? (
            <div className="d-flex align-items-center">
              <span className="text-white me-3">Hoş geldin, {loggedInUser.name}</span>

              <div
                className="balance-container d-flex flex-column justify-content-center align-items-center me-3"
                onClick={handleBalanceClick}
                style={{ cursor: 'pointer' }}
              >
                <span className="balance-label">Bakiye</span>
                <span className="balance-amount">
                  {typeof currentBalance === 'number' ? `$${currentBalance.toFixed(2)}` :
                   typeof currentBalance === 'string' ? `$${parseFloat(currentBalance).toFixed(2)}` :
                   'Yükleniyor...'}
                </span>
              </div>

              <div
                className="account-logo me-3"
                style={{ cursor: 'pointer' }}
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
            <Link href="/login" passHref legacyBehavior>
              <a className="btn btn-outline-light" role="button">Giriş Yap</a>
            </Link>
            // Kayıt ol butonu da eklenebilir
            // <Link href="/register" passHref legacyBehavior><a className="btn btn-light ms-2" role="button">Kayıt Ol</a></Link>
          )}
        </div>
      </div>
    </nav>
  );
}