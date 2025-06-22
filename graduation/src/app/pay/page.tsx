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

  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCvc, setCardCvc] = useState<string>('');

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
            .then(res => {
              if (res.status === 401 || res.status === 403) {
                localStorage.clear();
                setIsAuthenticated(false);
                throw new Error('Oturum geçersiz veya süresi dolmuş. Lütfen tekrar giriş yapın.');
              }
              if (!res.ok) {
                return res.json().then(err => { throw new Error(err.message || `HTTP ${res.status}`); });
              }
              return res.json();
            })
            .then(data => {
              const apiBalance = parseFloat(String(data.user.balance)) || 0;
              setBalance(apiBalance);
              const updated = { ...parsedUser, balance: apiBalance.toFixed(2) };
              localStorage.setItem('user', JSON.stringify(updated));
              setUser(updated);
              setIsBalanceLoaded(true);
            })
            .catch(err => { setMessage({ type: 'error', text: err.message }); setIsBalanceLoaded(true); })
            .finally(() => setIsLoadingPage(false));
        } else {
          setMessage({ type: 'error', text: 'Geçersiz oturum bilgisi.' });
          setIsAuthenticated(false);
          setIsBalanceLoaded(true);
          setIsLoadingPage(false);
        }
      } catch (e) {
        localStorage.clear();
        setMessage({ type: 'error', text: 'Oturum hatası. Lütfen tekrar giriş yapın.' });
        setIsAuthenticated(false);
        setIsBalanceLoaded(true);
        setIsLoadingPage(false);
      }
    } else {
      setIsAuthenticated(false);
      setIsBalanceLoaded(true);
      setIsLoadingPage(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoadingPage && !isAuthenticated) {
      router.replace(`/login?redirect=${window.location.pathname}`);
    }
  }, [isLoadingPage, isAuthenticated, router]);

  const handleCardNumberChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 16);
    const formatted = digitsOnly.replace(/(.{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (value: string) => {
    let digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      digits = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    setCardExpiry(digits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amountToAdd = parseFloat(newBalanceInput);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      setMessage({ type: 'error', text: 'Pozitif tutar giriniz.' });
      return;
    }
    if (!/^\d{13,19}$/.test(cardNumber.replace(/\s+/g, ''))) {
      setMessage({ type: 'error', text: 'Kart numarası hatalı.' }); return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      setMessage({ type: 'error', text: 'Tarih MM/YY.' }); return;
    }
    if (!/^\d{3,4}$/.test(cardCvc)) {
      setMessage({ type: 'error', text: 'CVC hatalı.' }); return;
    }

    setLoadingForm(true);
    setMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ balance: balance + amountToAdd, card: { number: cardNumber.replace(/\s+/g, ''), expiry: cardExpiry, cvc: cardCvc } })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const newBal = balance + amountToAdd;
        setBalance(newBal);
        setMessage({ type: 'success', text: `${amountToAdd.toFixed(2)}$ yüklendi. Yeni bakiye: ${newBal.toFixed(2)}$` });
        setNewBalanceInput(''); setCardNumber(''); setCardExpiry(''); setCardCvc('');
        const updated = { ...user, balance: newBal.toFixed(2) };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
      } else {
        setMessage({ type: 'error', text: data.message || 'Güncelleme başarısız.' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Ağ hatası.' });
    }
    setLoadingForm(false);
  };

  if (isLoadingPage) return (<><Navbar /><div className="loader">Yükleniyor...</div></>);
  if (!isAuthenticated) return (<><Navbar /><div className="auth-msg">Giriş gerekli. Yönlendiriliyorsunuz...</div></>);

  return (
    <div className="page-bg">
      <Navbar />
      <div className="container py-5">
        <div className="card-wrapper">
          <h2>Bakiye & Ödeme</h2>
          {message && <div className={`alert alert-${message.type}`}>{message.text}</div>}
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="mb-3 input-icon">
              <input
                type="number"
                placeholder="Tutar ($)"
                className="pay-input"
                value={newBalanceInput}
                onChange={e => setNewBalanceInput(e.target.value)}
                min="1"
                step="0.01"
                disabled={!isBalanceLoaded || loadingForm}
                required
              />
            </div>
            <div className="mb-3 input-icon">
              <input
                type="text"
                placeholder="Kart Numarası"
                className="pay-input"
                value={cardNumber}
                onChange={e => handleCardNumberChange(e.target.value)}
                maxLength={19} // 16 rakam + 3 boşluk
                inputMode="numeric"
                required
                disabled={!isBalanceLoaded || loadingForm}
              />
            </div>
            <div className="row">
              <div className="col-6">
                <div className="mb-3 input-icon">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="pay-input"
                    value={cardExpiry}
                    onChange={e => handleExpiryChange(e.target.value)}
                    maxLength={5}
                    disabled={!isBalanceLoaded || loadingForm}
                    required
                  />
                </div>
              </div>
              <div className="col-6">
                <div className="mb-3 input-icon">
                  <input
                    type="text"
                    placeholder="CVC"
                    className="pay-input"
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value)}
                    disabled={!isBalanceLoaded || loadingForm}
                    required
                  />
                </div>
              </div>
            </div>
            <button type="submit" disabled={loadingForm || !isBalanceLoaded}>
              {loadingForm ? 'İşleniyor...' : 'Ödemeyi Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
