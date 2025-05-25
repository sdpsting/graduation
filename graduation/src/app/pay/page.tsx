'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar';

export default function PayPage() {
  const [balance, setBalance] = useState<number>(0);
  const [user, setUser] = useState<{ id: number; name: string; steamId?: string } | null>(null);
  const [newBalanceInput, setNewBalanceInput] = useState<string>('');
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
              } else {
                throw new Error(data.message || 'Bakiye bilgisi alınamadı.');
              }
              setIsBalanceLoaded(true);
            })
            .catch(error => {
              console.error('API Hatası (Bakiye Çekme):', error);
              setMessage({ type: 'error', text: error.message || 'Bakiye çekilirken bir hata oluştu.' });
              setIsBalanceLoaded(true);
            });
        } else {
          setMessage({ type: 'error', text: 'Geçersiz kullanıcı bilgisi.' });
          setIsBalanceLoaded(true);
        }
      } catch (e) {
        console.error('localStorage parse hatası:', e);
        setMessage({ type: 'error', text: 'Oturum bilgileri okunamadı. Lütfen tekrar giriş yapın.' });
        setIsBalanceLoaded(true);
        localStorage.removeItem('user');
      }
    } else {
      setIsBalanceLoaded(true);
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

    const updatedBalance = balance + amountToAdd;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: updatedBalance }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `${amountToAdd} TL bakiye başarıyla eklendi! Yeni Bakiye: ${updatedBalance.toFixed(2)} TL` });
        setBalance(updatedBalance);
        setNewBalanceInput('');
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
    <div className="custom-background text-white min-vh-100">
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="payment-card p-4 p-md-5 rounded shadow">
              <h2 className="custom-text">Bakiye Yükle</h2>

              {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                  {message.text}
                </div>
              )}

              {!isBalanceLoaded && !user && (
                <div className="text-center">
                  <p className="h5">Lütfen önce giriş yapın.</p>
                  <button className="btn btn-primary mt-2" onClick={() => window.location.href = '/login'}>
                    Giriş Yap
                  </button>
                </div>
              )}

              {isBalanceLoaded && !user && !message?.text.includes('Oturum') && (
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
                    <p className="display-6 text-custom fw-bold">
                      {isBalanceLoaded ? `${balance.toFixed(2)} $` : 'Yükleniyor...'}
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
                      disabled={!isBalanceLoaded}
                    />
                  </div>

                  <div className="d-grid">
                    <button
                      className="sign-in-button w-100 mt-3"
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
