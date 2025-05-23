'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar';  // Navbar bileşeninizi doğru bir şekilde import edin

export default function PayPage() {
  const [balance, setBalance] = useState<number>(0);  // Kullanıcının mevcut bakiyesi
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);  // Kullanıcı bilgisi
  const [newBalance, setNewBalance] = useState<number>(0);  // Güncellenecek bakiye
  const [loading, setLoading] = useState(false);  // Yükleniyor durumu
  const [isBalanceLoaded, setIsBalanceLoaded] = useState(false);  // Bakiye yüklendi mi?

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Kullanıcıyı dinamik olarak API'den çekiyoruz
      fetch(`/api/users/${parsedUser.id}`)
        .then(res => res.json())
        .then(data => {
            setBalance(data.user.balance);         // ✅ Doğru
            setNewBalance(data.user.balance);      // ✅ Doğru
            setIsBalanceLoaded(true);
        })
        .catch(error => {
            console.error('API Hatası:', error);
            setIsBalanceLoaded(true);
        });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ balance: newBalance }),
      });

      if (response.ok) {
        alert('Bakiye güncellendi!');
        setBalance(newBalance);  // Güncel bakiyeyi UI'ye yansıtıyoruz
      } else {
        alert('Güncelleme başarısız.');
      }
    } catch (error) {
      console.error('Hata:', error);
    }
    setLoading(false);
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-5">
        <h2>Bakiye Güncelle</h2>
        {user ? (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Mevcut Bakiye: {isBalanceLoaded ? `$${balance}` : 'Yükleniyor...'}</label>
              <input
                type="number"
                className="form-control"
                value={newBalance || 0}  // Burada newBalance null/undefined olursa 0 veririz
                onChange={e => setNewBalance(Number(e.target.value))}
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Güncelleniyor...' : 'Güncelle'}
            </button>
          </form>
        ) : (
          <p>Lütfen giriş yapın.</p>
        )}
      </div>
    </div>
  );
}
