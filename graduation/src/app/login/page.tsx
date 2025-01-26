'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      // Kullanıcı bilgilerini yerel depolamaya kaydet
      localStorage.setItem('user', JSON.stringify({ name: data.userName }));
      router.push('/'); // Ana sayfaya yönlendir
    } else {
      alert(data.message || 'Giriş sırasında bir hata oluştu.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Giriş Yap</h1>
      <form onSubmit={handleLogin}>
        <label>
          Kullanıcı Adı:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Şifre:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <br />
        <button type="submit">Giriş Yap</button>
      </form>
    </div>
  );
}