'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar'; // Yolunu kendi proje yapına göre güncelle

export default function ProfilePage() {
  const [selectedTab, setSelectedTab] = useState<'profile' | 'payment'>('profile');
  const [user, setUser] = useState<{ id: string; name: string; email: string; password: string } | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setFormData({ name: parsedUser.name, email: parsedUser.email, password: '' });
    }
  }, []);

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleBalanceClick = () => {
    router.push('/payment');
  };

  const handleTabChange = (tab: 'profile' | 'payment') => {
    setSelectedTab(tab);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        alert('Bilgiler başarıyla güncellendi!');
      } else {
        alert('Bilgiler güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Güncelleme hatası:', error);
      alert('Bilgiler güncellenirken bir hata oluştu.');
    }
  };

  return (
    <div className="container-fluid custom-background">
      {/* Navbar */}
      <Navbar />

      {/* Ana İçerik */}
      <div className="row mt-4">
        <div className="col-md-4 d-flex flex-column align-items-center">
          <div className="profile-box">
            <img
              src="https://w7.pngwing.com/pngs/215/58/png-transparent-computer-icons-google-account-scalable-graphics-computer-file-my-account-icon-rim-123rf-symbol-thumbnail.png"
              alt="Profile"
              className="profile-image"
            />
            <div className="d-flex flex-column align-items-center mt-3">
              <button
                className={`tab-button ${selectedTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                Profil
              </button>
              <button
                className={`tab-button ${selectedTab === 'payment' ? 'active' : ''}`}
                onClick={() => handleTabChange('payment')}
              >
                Ödeme
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-8">
          <div className={`content-box ${selectedTab === 'profile' ? 'profile-tab' : 'content-tab'}`}>
            {selectedTab === 'profile' ? (
              <div className="profile-content text-white">
                <h3>Profil Bilgileri</h3>
                <div className="form-group">
                  <label>Kullanıcı Adı Değiştirme</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group mt-3">
                  <label>E-posta Değiştirme</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group mt-3">
                  <label>Şifre Değiştirme</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>
                <button className="btn btn-primary mt-4" onClick={handleSubmit}>
                  Güncelle
                </button>
              </div>
            ) : (
              <div className="payment-content text-white">
                <h3>Ödeme Sayfası</h3>
                <p>Burada ödeme işlemleri yapılacak...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}