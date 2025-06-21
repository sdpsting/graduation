// src/app/pay/page.tsx
'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar';
import { useRouter } from 'next/navigation';

type User = {
  id: number;
  name: string;
  steamId?: string;
  balance?: string | number;
  role?: string;
};

export default function PayPage() {
  const router = useRouter();
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const [balance, setBalance] = useState<number>(0);
  const [isBalanceLoaded, setIsBalanceLoaded] = useState(false);
  
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
  const [loadingForm, setLoadingForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    setIsLoadingPage(true);
    const token = localStorage.getItem('token');
    const storedUserString = localStorage.getItem('user');

    if (token && storedUserString) {
      try {
        const parsedUser: User = JSON.parse(storedUserString);
        if (parsedUser && parsedUser.id) {
          setUser(parsedUser);
          setIsAuthenticated(true);

          // ---- BAKİYE ÇEKME İSTEĞİNE CACHE-BUSTING EKLENDİ ----
          fetch(`/api/users/${parsedUser.id}?timestamp=${new Date().getTime()}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            }
          })
          // ---- CACHE-BUSTING SONU ----
            .then(res => {
              if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setIsAuthenticated(false);
                throw new Error('Oturum geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.');
              }
              if (!res.ok) {
                return res.json().then(errData => {
                    throw new Error(errData.message || `Kullanıcı bilgileri alınamadı (HTTP ${res.status}).`);
                }).catch(() => {
                    throw new Error(`Kullanıcı bilgileri alınamadı (HTTP ${res.status}).`);
                });
              }
              return res.json();
            })
            .then(data => {
              if (data && data.user && (typeof data.user.balance === 'string' || typeof data.user.balance === 'number')) {
                const apiBalance = parseFloat(String(data.user.balance)) || 0;
                setBalance(apiBalance);
                
                // localStorage'daki kullanıcı bilgisini de API'den gelen güncel bakiye ile senkronize et
                const updatedUserForStorage: User = { ...parsedUser, balance: apiBalance.toFixed(2) };
                localStorage.setItem('user', JSON.stringify(updatedUserForStorage));
                setUser(updatedUserForStorage); // user state'ini de güncelle

              } else {
                console.error("Beklenmeyen bakiye API yanıtı:", data);
                throw new Error(data?.message || 'Bakiye bilgisi formatı yanlış veya eksik.');
              }
              setIsBalanceLoaded(true);
            })
            .catch(error => {
              console.error('API Hatası (Bakiye Çekme):', error);
              setMessage({ type: 'error', text: error.message || 'Bakiye çekilirken bir hata oluştu.' });
              setIsBalanceLoaded(true);
            })
            .finally(() => {
                setIsLoadingPage(false);
            });
        } else {
          const errMsg = 'Geçersiz kullanıcı oturum bilgisi.';
          setMessage({ type: 'error', text: errMsg });
          setIsBalanceLoaded(true);
          setIsAuthenticated(false);
          setIsLoadingPage(false);
        }
      } catch (e) {
        console.error('localStorage parse hatası veya bakiye çekme sırasında hata:', e);
        const errMsg = 'Oturum bilgileri okunamadı veya bakiye alınamadı. Lütfen tekrar giriş yapın.';
        setMessage({ type: 'error', text: errMsg });
        setIsBalanceLoaded(true);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setIsLoadingPage(false);
      }
    } else {
      setIsBalanceLoaded(true);
      setIsAuthenticated(false);
      setIsLoadingPage(false);
    }
  }, []); // Sadece component ilk yüklendiğinde çalışır

  useEffect(() => {
    if (!isLoadingPage && !isAuthenticated) {
      router.replace(`/login?redirect=${window.location.pathname}`);
    }
  }, [isLoadingPage, isAuthenticated, router]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isAuthenticated) {
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
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Yetkilendirme hatası. Lütfen tekrar giriş yapın.' });
        setLoadingForm(false);
        return;
      }
      
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ balance: updatedBalance }), 
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `${amountToAdd.toFixed(2)} $ bakiye başarıyla eklendi! Yeni Bakiye: ${updatedBalance.toFixed(2)} $` });
        setBalance(updatedBalance); // Local state'i güncelle
        setNewBalanceInput('');
        
        const updatedUserForStorage: User = { ...user, balance: updatedBalance.toFixed(2) };
        localStorage.setItem('user', JSON.stringify(updatedUserForStorage)); // localStorage'ı da güncelle
        setUser(updatedUserForStorage); // user state'ini de güncelle (eğer Navbar gibi yerler bunu kullanıyorsa)
      } else {
        setMessage({ type: 'error', text: data.message || 'Bakiye güncelleme başarısız.' });
      }
    } catch (error: any) {
      console.error('Bakiye Güncelleme Hatası:', error);
      setMessage({ type: 'error', text: error.message || 'Bakiye güncellenirken bir ağ hatası oluştu.' });
    }
    setLoadingForm(false);
  };
  
  if (isLoadingPage) {
    return (
      <>
        <Navbar />
        <div className="custom-background text-white min-vh-100 d-flex justify-content-center align-items-center">
          <div>
            <div className="spinner-border text-warning" role="status" style={{width: "3rem", height: "3rem"}}>
                <span className="visually-hidden">Yükleniyor...</span>
            </div>
            <p className="mt-3 h5">Yükleniyor...</p>
          </div>
        </div>
      </>
    );
  }

  if (!isAuthenticated) {
    // Bu kısım genellikle useEffect içindeki router.replace() nedeniyle kısa süreliğine görünür veya hiç görünmez.
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

  return (
    <div className="custom-background text-white min-vh-100">
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6 col-xl-5">
            <div className="payment-card bg-dark p-4 p-md-5 rounded shadow">
              <h2 className="text-custom text-center mb-4 text-warning">Bakiye Yükle</h2>

              {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : (message.type === 'info' ? 'alert-info' : 'alert-danger')} mt-3`} role="alert">
                  {message.text}
                </div>
              )}
              
              {user && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4 text-center">
                    <label className="form-label fs-5 d-block">Mevcut Bakiyeniz</label>
                    <p className="display-5 text-custom fw-bold text-success">
                      {isBalanceLoaded ? `${Number(balance).toFixed(2)} $` : 
                        (<span className="spinner-border spinner-border-sm text-light"></span>)
                      }
                    </p>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="amountToAdd" className="form-label">Yüklenecek Tutar ($)</label>
                    <input
                      type="number"
                      id="amountToAdd"
                      className="form-control amount-input bg-secondary text-white border-secondary"
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
                      className="sign-in-button btn btn-primary w-100 mt-3"
                      type="submit"
                      disabled={loadingForm || !isBalanceLoaded || !user}
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
      <style jsx global>{`
        .custom-background { background-color: #12181b; color: #e0e0e0; }
        .payment-card { /* İstediğiniz ek stiller */ }
        .amount-input::placeholder { color: #a0a0a0; }
        .amount-input:focus { background-color: #495057; color: #ffffff; border-color: #ffc107; box-shadow: 0 0 0 0.2rem rgba(255,193,7,.25); }
      `}</style>
    </div>
  );
}