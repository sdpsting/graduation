// src/app/login/page.tsx (veya .jsx)

'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from 'src/app/components/navbar'; // Navbar'ınızın doğru yolda olduğundan emin olun

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Sayfa yüklendiğinde kullanıcı zaten giriş yapmış mı diye kontrol et
  useEffect(() => {
    const token = localStorage.getItem('token');
    // console.log('LoginPage useEffect - Token kontrol ediliyor:', token); // Hata ayıklama için log
    if (token) {
      // console.log('LoginPage useEffect - Token bulundu, /market sayfasına yönlendiriliyor.'); // Hata ayıklama için log
      // Kullanıcı zaten giriş yapmış, market sayfasına (veya ana sayfaya) yönlendir.
      // router.replace() kullanılırsa geri tuşuyla login sayfasına dönülemez.
      router.replace('/market');
    } else {
      // console.log('LoginPage useEffect - Token bulunamadı, login sayfasında kalınıyor.'); // Hata ayıklama için log
    }
  }, [router]); // router objesi değişmeyeceği için bu genellikle sadece mount'ta çalışır,
                // ancak dependency array'de olması iyi bir pratiktir.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/login', { // Backend login endpoint'iniz
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || `Sunucu hatası: ${response.status}`);
        setLoading(false);
        return;
      }

      if (data.success && data.token && data.user) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Yönlendirme: Başarılı giriş sonrası kullanıcıyı istediğiniz sayfaya yönlendirin
        // Örnek: Market sayfasına yönlendirme
        // Navbar gibi bileşenlerin anında güncellenmesi için en iyi yol global state (Context API)
        // veya bazı durumlarda window.location.href ile tam sayfa yenileme düşünülebilir.
        // Şimdilik router.push() ile client-side navigasyon yapıyoruz.
        // Navbar'ın güncellenmesi için, Navbar'daki useEffect'in LocalStorage'ı okumasına güveniyoruz.
        router.push('/market');

      } else {
        setError(data.message || 'Giriş sırasında bilinmeyen bir hata oluştu.');
      }
    } catch (err) {
      console.error("Login frontend hatası:", err);
      setError("Giriş işlemi sırasında bir ağ hatası veya beklenmedik bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="d-flex justify-content-center align-items-center custom-login-background">
        <div className="p-4 shadow custom-login-card" style={{ maxWidth: '500px', width: '110%' }}>
          <h2 className="text-center mb-4 text-white">Giriş Yap</h2>
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label text-white">
                Kullanıcı Adı
              </label>
              <input
                type="text"
                id="username"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label text-white">
                Şifre
              </label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn-primary login-button w-100" disabled={loading}>
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
            </button>
            <div className="text-center mt-3">
              <a href="/register" className="register-text">
                Hesabın yok mu? Kayıt Ol
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}