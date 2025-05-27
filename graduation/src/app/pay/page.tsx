// src/app/pay/page.tsx

'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar'; // Navbar import yolunuzu kontrol edin
import { useRouter } from 'next/navigation'; // useRouter'ı import edin

// User tipini tanımlayalım (localStorage ve API'den gelen)
type User = {
  id: number;
  name: string;
  steamId?: string;
  balance?: string | number; // API'den balance gelebilir
};

export default function PayPage() {
  const router = useRouter(); // useRouter hook'unu çağırın
  const [isLoadingPage, setIsLoadingPage] = useState(true); // Sayfa yetki kontrolü için yükleme durumu
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Kullanıcının yetkili olup olmadığı

  const [balance, setBalance] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
  const [loadingForm, setLoadingForm] = useState(false); // Form gönderme için yükleme durumu
  const [isBalanceLoaded, setIsBalanceLoaded] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. ADIM: Sayfa Yüklenirken Yetki Kontrolü
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('user'); // user bilgisini de alalım

    if (token && storedUserString) {
      try {
        const parsedUser: User = JSON.parse(storedUserString);
        setUser(parsedUser); // Kullanıcı state'ini ayarla
        setIsAuthenticated(true); // Kullanıcı yetkili

        // Kullanıcı bilgisiyle bakiye verisini al
        if (parsedUser && parsedUser.id) {
          fetch(`/api/users/${parsedUser.id}`) // Bu API'nin token gerektirip gerektirmediğini kontrol edin
            .then(res => {
              if (!res.ok) {
                throw new Error('Kullanıcı bakiye bilgileri alınamadı.');
              }
              return res.json();
            })
            .then(data => {
              if (data.success && data.user && typeof data.user.balance !== 'undefined') {
                setBalance(parseFloat(data.user.balance) || 0);
              } else {
                throw new Error(data.message || 'Bakiye bilgisi alınamadı.');
              }
              setIsBalanceLoaded(true);
            })
            .catch(error => {
              console.error('API Hatası (Bakiye Çekme):', error);
              setMessage({ type: 'error', text: error.message || 'Bakiye çekilirken bir hata oluştu.' });
              setIsBalanceLoaded(true); // Hata durumunda da yükleme bitti
            });
        } else {
          // Parsed user id yoksa veya geçersizse
          setMessage({ type: 'error', text: 'Geçersiz kullanıcı oturum bilgisi.' });
          setIsBalanceLoaded(true);
          setIsAuthenticated(false); // Yetkiyi kaldır
          router.replace(`/login?redirect=${window.location.pathname}`); // Login'e yönlendir
        }
      } catch (e) {
        console.error('localStorage parse hatası veya bakiye çekme sırasında hata:', e);
        setMessage({ type: 'error', text: 'Oturum bilgileri okunamadı veya bakiye alınamadı. Lütfen tekrar giriş yapın.' });
        setIsBalanceLoaded(true);
        setIsAuthenticated(false); // Yetkiyi kaldır
        localStorage.removeItem('user'); // Hatalı veriyi temizle
        localStorage.removeItem('token');
        router.replace(`/login?redirect=${window.location.pathname}`); // Login'e yönlendir
      }
    } else {
      // Token veya user bilgisi yok, kullanıcı giriş yapmamış. Login sayfasına yönlendir.
      setIsBalanceLoaded(true); // Bu durumda bakiye yüklenemez
      setIsAuthenticated(false);
      router.replace(`/login?redirect=${window.location.pathname}`);
    }
    setIsLoadingPage(false); // Yetki kontrolü ve ilk veri çekme tamamlandı
  }, [router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAuthenticated) { // isAuthenticated kontrolü eklendi
      setMessage({ type: 'error', text: 'İşlem için giriş yapmalısınız.' });
      return;
    }

    const amountToAdd = parseFloat(newBalanceInput);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir pozitif tutar girin.' });
      return;
    }

    const updatedBalance = balance + amountToAdd;

    setLoadingForm(true);
    setMessage(null);

    try {
      // Bakiye güncelleme API'si token gerektiriyorsa Authorization header eklenmeli.
      // Middleware bunu /api/users/:id için henüz kapsamıyor olabilir, kontrol edin.
      const token = localStorage.getItem('token');
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/users/${user.id}`, { // Bu API'nin de token ile korunması gerekebilir
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ balance: updatedBalance }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `${amountToAdd.toFixed(2)} $ bakiye başarıyla eklendi! Yeni Bakiye: ${updatedBalance.toFixed(2)} $` });
        setBalance(updatedBalance);
        setNewBalanceInput('');
        // LocalStorage'daki user objesini de güncelleyebiliriz.
        const updatedUser = { ...user, balance: updatedBalance.toFixed(2) };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser); // State'i de güncelle
      } else {
        setMessage({ type: 'error', text: data.message || 'Bakiye güncelleme başarısız.' });
      }
    } catch (error) {
      console.error('Bakiye Güncelleme Hatası:', error);
      setMessage({ type: 'error', text: 'Bakiye güncellenirken bir ağ hatası oluştu.' });
    }
    setLoadingForm(false);
  };

  // 2. ADIM: Yükleme ve Yetki Durumuna Göre Render Etme
  if (isLoadingPage) {
    return (
      <>
        <Navbar />
        <div className="custom-background text-white min-vh-100 d-flex justify-content-center align-items-center">
          <p>Yetki kontrol ediliyor...</p>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    // Bu kısım, useEffect içindeki router.replace() nedeniyle normalde görünmez.
    // Ancak bir fallback olarak veya yönlendirmenin çok kısa bir anlığına gecikmesi durumunda
    // kullanıcıya bir mesaj göstermek için faydalı olabilir.
    return (
      <>
        <Navbar />
        <div className="custom-background text-white min-vh-100 d-flex flex-column justify-content-center align-items-center">
          <p className="h5">Bu sayfayı görüntülemek için giriş yapmalısınız.</p>
          <p>Giriş sayfasına yönlendiriliyorsunuz...</p>
        </div>
      </>
    );
  }

  // 3. ADIM: Yetkili Kullanıcı İçin Sayfa İçeriği
  return (
    <div className="custom-background text-white min-vh-100">
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5"> {/* Kart genişliği ayarlandı */}
            <div className="payment-card p-4 p-md-5 rounded shadow">
              <h2 className="custom-text text-center mb-4">Bakiye Yükle</h2>

              {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mt-3`} role="alert">
                  {message.text}
                </div>
              )}

              {/* Giriş yapmamış kullanıcılar için olan eski koşullu render blokları kaldırıldı,
                  çünkü !isAuthenticated durumu yukarıda zaten ele alınıyor. */}

              {/* Form sadece user varsa ve bakiye yüklenmişse gösterilir */}
              {user && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4 text-center">
                    <label className="form-label fs-5 d-block">Mevcut Bakiyeniz</label>
                    <p className="display-5 text-custom fw-bold">
                      {isBalanceLoaded ? `${Number(balance).toFixed(2)} $` : 'Yükleniyor...'}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="amountToAdd" className="form-label">Yüklenecek Tutar ($)</label>
                    <input
                      type="number"
                      id="amountToAdd"
                      className="form-control amount-input"
                      placeholder="Örn: 50"
                      value={newBalanceInput}
                      onChange={e => setNewBalanceInput(e.target.value)}
                      min="1"
                      step="0.01"
                      required
                      disabled={!isBalanceLoaded || loadingForm}
                    />
                  </div>

                  <div className="d-grid">
                    <button
                      className="sign-in-button w-100 mt-3" // btn-primary yerine özel sınıfınız
                      type="submit"
                      disabled={loadingForm || !isBalanceLoaded}
                    >
                      {loadingForm ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          İşleniyor...
                        </>
                      ) : (
                        'Bakiyeyi Yükle'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}