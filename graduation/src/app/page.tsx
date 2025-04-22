'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar'; // Navbar component'i burada kullanılıyor

export default function HomePage() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="container-fluid custom-background">
      {/* Navbar */}
      <Navbar />

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
