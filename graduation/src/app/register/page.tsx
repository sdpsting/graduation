'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';  // Add this to use Link in the navbar
import Navbar from 'src/app/components/navbar'; // Navbar bileşeni eklendi

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<{ name: string } | null>(null); // Define user state
  const router = useRouter();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Kayıt başarılı! Giriş yapabilirsiniz.');
        router.push('/login');
      } else {
        setError(data.message || 'Kayıt sırasında bir hata oluştu.');
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Define handleSearchChange function
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    console.log('Search query:', query);
    // You can implement a search logic here if needed, such as filtering items
  };

  return (
    <div>
      <Navbar />
      {/* Register Page Content */}
      <div className="d-flex flex-column justify-content-center align-items-center custom-login-background">
        <div className="p-4 shadow custom-login-card" style={{ maxWidth: '500px', width: '100%' }}>
          <h2 className="text-center mb-4 text-white">Kayıt Ol</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label text-white">Kullanıcı Adı</label>
              <input
                type="text"
                id="name"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label text-white">E-posta</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password" className="form-label text-white">Şifre</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary login-button" disabled={loading}>
              {loading ? 'Yükleniyor...' : 'Kayıt Ol'}
            </button>
          </form>
          <div className="text-center mt-3">
            <a href="/login" className="register-text">
              Zaten hesabınız var mı? Giriş yapın.
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
