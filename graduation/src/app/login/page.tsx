'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from 'src/app/components/navbar'; // Navbar bileşeni eklendi

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    if (data.success) {
      alert('Giriş başarılı! Hoş geldiniz.');
      localStorage.setItem('user', JSON.stringify({ name: data.userName }));
      router.push('/');
    } else {
      alert(data.message || 'Giriş sırasında bir hata oluştu.');
    }
  };

  return (
    <>
      {/* Navbar */}
      <Navbar />

      {/* Login Form */}
      <div className="d-flex justify-content-center align-items-center vh-100 custom-login-background">
        <div className="p-4 shadow custom-login-card" style={{ maxWidth: '400px', width: '100%' }}>
          <h2 className="text-center mb-4 text-white">Giriş Yap</h2>
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
              />
            </div>
            <button type="submit" className="btn-primary login-button">Giriş Yap</button>
            <div className="text-center mt-3">
              <a href="/register" className="register-text">
                Kayıt Ol
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
