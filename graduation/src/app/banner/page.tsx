'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

export default function HomePage() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleBalanceClick = () => {
    router.push('/payment');
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
                <button className="btn btn-outline-light" onClick={handleLogout} type="button">
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

      {/* Hero Section */}
      <section className="hero-section text-center text-white py-5">
        <div className="container">
          <h1 className="display-4">CS2 Skin Takas Platformu</h1>
          <p className="lead">En iyi Counter Strike 2 skinlerini keşfedin ve takas yapın!</p>
          <Link href="/login" className="btn-join mt-5">
            Katılın
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <h2 className="about-title">Hakkında</h2>
              <p className="lead about-description">
                Bu platform, Counter Strike 2 oyuncularının skin takas yapabilmesi için güvenli ve hızlı bir ortam sunar.
              </p>
            </div>
            <div className="col-md-6">
              <img
                src="https://cs.trade/images/page/bloodsport.png"
                alt="Placeholder Image"
                className="img-fluid about-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="hero-section text-white py-5">
        <div className="container">
          <h2 className="text-center">Özellikler</h2>
          <div className="row">
            <div className="col-md-4 text-center">
              <h3>Güvenli Takas</h3>
              <p>Skinlerinizi güvenli bir şekilde takas edebilirsiniz.</p>
            </div>
            <div className="col-md-4 text-center">
              <h3>Hızlı İşlem</h3>
              <p>Hızlı ve kolay bir şekilde işlemlerinizi tamamlayın.</p>
            </div>
            <div className="col-md-4 text-center">
              <h3>Geniş Seçenek</h3>
              <p>Çeşitli skin seçenekleri ile istediğiniz gibi takas yapın.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="text-white py-5">
        <div className="container text-center">
          <h2>İletişim</h2>
          <p className="lead">Bize ulaşmak için aşağıdaki bilgileri kullanabilirsiniz:</p>
          <p>Email: support@example.com</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white text-center py-4">
        <p>&copy; 2025 CS2 Skin Takas Platformu. Tüm Hakları Saklıdır.</p>
      </footer>
    </div>
  );
}
