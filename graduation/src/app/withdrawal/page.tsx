'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar';

// Basit item tipi
interface Item {
  id: number;
  name: string;
  image: string;
}

export default function WithdrawPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Kullanıcıyı localStorage'dan al
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.id) {
          setUserId(parsed.id);
          // Kullanıcının envanterini getir
          fetch(`/api/users/${parsed.id}/items`)
            .then(res => res.json())
            .then(data => {
              if (Array.isArray(data.items)) {
                setItems(data.items);
              }
            })
            .catch(err => console.error('Envanter çekme hatası:', err));
        }
      } catch {
        console.error('localStorage parse hatası');
      }
    }
  }, []);

  const handleWithdraw = async () => {
    if (!userId || !selectedItemId) {
      setMessage({ type: 'error', text: 'Lütfen bir eşya seçin.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/users/${userId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: selectedItemId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'Eşya çekme isteği başarıyla oluşturuldu.' });
        // Çekilen eşyayı listeden çıkar
        setItems(prev => prev.filter(item => item.id !== selectedItemId));
        setSelectedItemId(null);
      } else {
        setMessage({ type: 'error', text: data.message || 'Çekme işlemi başarısız.' });
      }
    } catch (err) {
      console.error('Çekme hatası:', err);
      setMessage({ type: 'error', text: 'Sunucu ile iletişimde hata oluştu.' });
    }
    setLoading(false);
  };

  return (
    <div className="custom-background text-white min-vh-100">
      <Navbar />
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 col-lg-4">
            <div className="bg-dark p-4 p-md-5 rounded shadow">
              <h2 className="text-center mb-4 text-warning">Eşya Çek</h2>
              {message && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
                  {message.text}
                </div>
              )}

              {items.length === 0 ? (
                <p className="text-center">Çekebileceğiniz eşya bulunamadı.</p>
              ) : (
                <>
                  <div className="mb-3">
                    <label htmlFor="itemSelect" className="form-label">Eşya Seçin</label>
                    <select
                      id="itemSelect"
                      className="form-select"
                      value={selectedItemId ?? ''}
                      onChange={e => setSelectedItemId(Number(e.target.value))}
                    >
                      <option value="">-- Seçiniz --</option>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="d-grid">
                    <button
                      className="sign-in-button w-100 mt-3"
                      onClick={handleWithdraw}
                      disabled={loading}
                    >
                      {loading ? 'Gönderiliyor...' : 'Çekme İsteği Oluştur'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
