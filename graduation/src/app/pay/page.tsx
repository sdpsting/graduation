'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar';

export default function PayPage() {
  const [balance, setBalance] = useState<number>(0);
  const [user, setUser] = useState<{ id: number; name: string; steamId?: string } | null>(null); // steamId'yi de ekleyebiliriz
  const [newBalanceInput, setNewBalanceInput] = useState<string>(''); // Giriş için string, sonra sayıya çevrilecek
  const [loading, setLoading] = useState(false);
  const [isBalanceLoaded, setIsBalanceLoaded] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        if (parsedUser && parsedUser.id) {
          fetch(`/api/users/${parsedUser.id}`)
            .then(res => {
              if (!res.ok) {
                throw new Error('Kullanıcı bilgileri alınamadı.');
              }
              return res.json();
            })
            .then(data => {
              if (data.success && data.user) {
                setBalance(parseFloat(data.user.balance) || 0);
                // setNewBalanceInput(data.user.balance.toString()); // Formu mevcut bakiye ile doldurmak isterseniz
              } else {
                throw new Error(data.message || 'Bakiye bilgisi alınamadı.');
              }
              setIsBalanceLoaded(true);
            })
            .catch(error => {
              console.error('API Hatası (Bakiye Çekme):', error);
              setMessage({ type: 'error', text: error.message || 'Bakiye çekilirken bir hata oluştu.' });
              setIsBalanceLoaded(true); // Hata olsa bile yükleme tamamlandı
            });
        } else {
            setMessage({ type: 'error', text: 'Geçersiz kullanıcı bilgisi.' });
            setIsBalanceLoaded(true);
        }
      } catch (e) {
        console.error("localStorage parse hatası:", e);
        setMessage({ type: 'error', text: 'Oturum bilgileri okunamadı. Lütfen tekrar giriş yapın.' });
        setIsBalanceLoaded(true);
        localStorage.removeItem('user');
      }
    } else {
        setIsBalanceLoaded(true); // Kullanıcı yoksa da yükleme bitti
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setMessage({ type: 'error', text: 'İşlem için giriş yapmalısınız.' });
      return;
    }

    const amountToAdd = parseFloat(newBalanceInput);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir pozitif tutar girin.' });
      return;
    }

    const updatedBalance = balance + amountToAdd; // Eklenecek tutarı mevcut bakiyeye ekle

    setLoading(true);
    setMessage(null); // Önceki mesajları temizle

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ balance: updatedBalance }), // Güncellenmiş toplam bakiyeyi gönder
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `${amountToAdd} TL bakiye başarıyla eklendi! Yeni Bakiye: ${updatedBalance.toFixed(2)} TL` });
        setBalance(updatedBalance);
        setNewBalanceInput(''); // Giriş alanını temizle
      } else {
        setMessage({ type: 'error', text: data.message || 'Bakiye güncelleme başarısız.' });
      }
    } catch (error) {
      console.error('Bakiye Güncelleme Hatası:', error);
      setMessage({ type: 'error', text: 'Bakiye güncellenirken bir ağ hatası oluştu.' });
    }
    setLoading(false);
  };

  return (
    <div className="custom-background text-white min-vh-100"> {/* Envanter sayfası gibi ana arka plan */}
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6"> {/* Kartın genişliği */}
            <div className="bg-dark p-4 p-md-5 rounded shadow"> {/* Envanterdeki sağ panel gibi koyu kart */}
              <h2 className="text-center mb-4 text-warning">Bakiye Yükle</h2> {/* Başlık */}

              {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                  {message.text}
                </div>
              )}

              {!isBalanceLoaded && !user && ( // Henüz hiçbir şey yüklenmediyse ve kullanıcı yoksa
                 <div className="text-center">
                    <p className="h5">Lütfen önce giriş yapın.</p>
                    <button className="btn btn-primary mt-2" onClick={() => window.location.href = '/login'}>
                        Giriş Yap
                    </button>
                 </div>
              )}

              {isBalanceLoaded && !user && !message?.text.includes("Oturum") && ( // Yüklendi ama kullanıcı yoksa (ve oturum hatası değilse)
                 <div className="text-center">
                    <p className="h5">Bakiye yüklemek için lütfen giriş yapın.</p>
                    <button className="btn btn-primary mt-2" onClick={() => window.location.href = '/login'}>
                        Giriş Yap
                    </button>
                 </div>
              )}


              {user && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fs-5">Mevcut Bakiyeniz</label>
                    <p className="display-6 text-success fw-bold">
                      {isBalanceLoaded ? `${balance.toFixed(2)} TL` : 'Yükleniyor...'}
                    </p>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="amountToAdd" className="form-label">Yüklenecek Tutar (TL)</label>
                    <input
                      type="number"
                      id="amountToAdd"
                      className="form-control form-control-lg bg-secondary text-white border-secondary" // Koyu tema için input stili
                      placeholder="Örn: 50"
                      value={newBalanceInput}
                      onChange={e => setNewBalanceInput(e.target.value)}
                      min="1" // Minimum yüklenecek tutar
                      step="0.01" // Kuruşlu girişlere izin ver
                      required
                      disabled={!isBalanceLoaded} // Bakiye yüklenene kadar inputu disable et
                    />
                  </div>

                  <div className="d-grid"> {/* Butonu tam genişlik yapmak için */}
                    <button
                      className="btn btn-lg btn-primary mt-3" // Buton stili (btn-success da olabilirdi)
                      type="submit"
                      disabled={loading || !isBalanceLoaded}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Yükleniyor...
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