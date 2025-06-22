// src/app/profile/page.tsx
'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar';

type User = {
  id: string | number;
  name: string;
  email: string;
  steamId?: string | null;
  role?: string;
  balance?: number;
};

type FormData = {
  name: string;
  email: string;
  steamId: string;
  password?: string;
};

export default function ProfilePage() {
  const [selectedTab, setSelectedTab] = useState<'profile' | 'payment'>('profile');
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    steamId: '',
    password: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setFormData({
          name: parsedUser.name || '',
          email: parsedUser.email || '',
          steamId: parsedUser.steamId || '',
          password: ''
        });
      } catch (e) {
        console.error("Profil: localStorage user parse hatası:", e);
        setMessage({ type: 'error', text: 'Oturum bilgileri okunamadı. Lütfen tekrar giriş yapın.' });
        localStorage.removeItem('user');
      }
    } else {
      setMessage({ type: 'error', text: 'Profil bilgilerini görmek için lütfen giriş yapmalısınız.' });
    }
  }, []);

  const handleTabChange = (tab: 'profile' | 'payment') => {
    setSelectedTab(tab);
    setMessage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Güncelleme yapmak için kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.' });
      return;
    }
    setIsLoading(true);
    setMessage(null);

    const dataToUpdate: Partial<{ name: string; email: string; steamId: string | null; password: string }> = {};

    if (formData.name.trim() && formData.name !== user.name) dataToUpdate.name = formData.name.trim();
    if (formData.email.trim() && formData.email !== user.email) {
      if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
        setMessage({ type: 'error', text: 'Lütfen geçerli bir e-posta adresi girin.' });
        setIsLoading(false);
        return;
      }
      dataToUpdate.email = formData.email.trim();
    }
    const steamTrim = formData.steamId.trim();
    if (steamTrim !== (user.steamId || '')) {
      dataToUpdate.steamId = steamTrim === '' ? null : steamTrim;
    }
    if (formData.password?.trim()) dataToUpdate.password = formData.password;

    if (!Object.keys(dataToUpdate).length) {
      setMessage({ type: 'info', text: 'Güncellenecek bir değişiklik yapılmadı.' });
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Yetkilendirme tokeni bulunamadı. Lütfen tekrar giriş yapın.' });
        setIsLoading(false);
        return;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToUpdate)
      });
      const json = await res.json();

      if (res.ok && json.success && json.user) {
        setUser(json.user);
        localStorage.setItem('user', JSON.stringify(json.user));
        setFormData({
          name: json.user.name || '',
          email: json.user.email || '',
          steamId: json.user.steamId || '',
          password: ''
        });
        setMessage({ type: 'success', text: json.message || 'Bilgiler başarıyla güncellendi!' });
      } else {
        setMessage({ type: 'error', text: json.message || 'Bilgiler güncellenirken bir hata oluştu.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Bilgiler güncellenirken bir ağ veya sunucu hatası oluştu.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Yönlendirme ve yükleme durumları
  if (!user && message?.text.includes('giriş yap')) {
    return (
      <div className="container-fluid custom-background text-white vh-100 d-flex flex-column">
        <Navbar />
        <div className="flex-grow-1 d-flex justify-content-center align-items-center text-center">
          <div>
            <p className="text-danger h4">{message.text}</p>
            <button className="btn btn-primary mt-2" onClick={() => router.push('/login')}>
              Giriş Yap
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="container-fluid custom-background text-white vh-100 d-flex flex-column">
        <Navbar />
        <div className="flex-grow-1 d-flex justify-content-center align-items-center">
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Yükleniyor...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid custom-background">
      <Navbar />
      <div className="row mt-4 justify-content-center">
        {/* Sol Sekme Kutusu */}
        <div className="col-12 col-md-4 col-lg-3 p-2 d-flex flex-column align-items-center mb-4 mb-md-0 me-md-4">
          <div className="profile-box w-100">
            <img
              src="https://w7.pngwing.com/pngs/215/58/png-transparent-computer-icons-google-account-scalable-graphics-computer-file-my-account-icon-rim-123rf-symbol-thumbnail.png"
              alt="Profile"
              className="profile-image img-fluid"
            />
            <div className="d-flex flex-column align-items-stretch mt-3">
              <button
                className={`tab-button btn btn-outline-light w-100 mb-2 ${selectedTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                Profil Bilgileri
              </button>
            </div>
          </div>
        </div>

        {/* Sağ İçerik Kutusu */}
        <div className="col-12 col-md-7 col-lg-5 p-2 ms-md-4">
          {message && (
            <div className={`alert mb-3 ${
              message.type === 'success'
                ? 'alert-success'
                : message.type === 'info'
                  ? 'alert-info'
                  : 'alert-danger'
            }`} role="alert">
              {message.text}
            </div>
          )}
          <div className="content-box p-4 rounded shadow-sm">
            {selectedTab === 'profile' ? (
              <form onSubmit={e => { e.preventDefault(); handleSubmit(); }} className="text-white">
                <h3>Profil Bilgileri</h3>
                <div className="mb-3">
                  <label htmlFor="nameInput" className="form-label">Kullanıcı Adı</label>
                  <input
                    id="nameInput"
                    name="name"
                    type="text"
                    className="form-control bg-secondary text-white border-secondary"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="emailInput" className="form-label">E-posta</label>
                  <input
                    id="emailInput"
                    name="email"
                    type="email"
                    className="form-control bg-secondary text-white border-secondary"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="steamIdInput" className="form-label">Steam ID</label>
                  <input
                    id="steamIdInput"
                    name="steamId"
                    type="text"
                    placeholder="Steam ID64 (örn: 7656119...)"
                    className="form-control bg-secondary text-white border-secondary"
                    value={formData.steamId}
                    onChange={handleInputChange}
                  />
                  <small className="form-text text-muted-custom">
                    Steam özelliklerini kullanmak için gereklidir.
                  </small>
                </div>
                <div className="mb-3">
                  <label htmlFor="passwordInput" className="form-label">Yeni Şifre (boş bırakın)</label>
                  <input
                    id="passwordInput"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className="form-control bg-secondary text-white border-secondary"
                    value={formData.password || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <button type="submit" className="btn btn-info w-100" disabled={isLoading}>
                  {isLoading
                    ? <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Güncelleniyor...
                      </>
                    : 'Bilgileri Güncelle'}
                </button>
              </form>
            ) : (
              <div className="payment-content text-white">
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
