'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

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
      <nav className="navbar navbar-expand-lg navbar-background">
        <div className="container-fluid">
          <Link href="/" className="navbar-brand">
            <img
              src="https://ih1.redbubble.net/image.542370055.6839/st,small,507x507-pad,600x600,f8f8f8.jpg"
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
                <Link href="/" className="nav-link active text-white">
                  Market
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#" className="nav-link text-white">
                  Envanter
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/sell" className="nav-link text-white">
                  Eşya Sat
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#" className="nav-link text-white">
                  Eşya Al
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/sss" className="nav-link text-white">
                  S.S.S.
                </Link>
              </li>
            </ul>

            <form className="d-flex me-2">
              <div className="input-group">
                <span className="input-group-text search-icon">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  className="form-control search-bar"
                  type="search"
                  placeholder="Arama yap"
                  aria-label="Search"
                />
              </div>
            </form>

            {user ? (
              <div className="d-flex align-items-center">
                <span className="text-white me-2">Hoş geldiniz, {user.name}</span>
                <div
                  className="balance-container d-flex flex-column justify-content-center align-items-center"
                  onClick={handleBalanceClick}
                >
                  <span className="balance-label">Bakiye</span>
                  <span className="balance-amount">$1000</span>
                </div>

                <div
                  className="account-logo"
                  style={{ cursor: 'pointer', marginRight: '10px' }}
                  onClick={handleProfileClick}
                >
                  <img
                    src="https://w7.pngwing.com/pngs/215/58/png-transparent-computer-icons-google-account-scalable-graphics-computer-file-my-account-icon-rim-123rf-symbol-thumbnail.png"
                    alt="Account Logo"
                    style={{ width: '40px', height: 'auto', borderRadius: '50%' }}
                  />
                </div>
                <button className="btn btn-outline-light" type="button">
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <Link href="/login" passHref>
                <button className="btn btn-outline-light" type="button">
                  Giriş Yap
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

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