'use client';

import React, { useState } from 'react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

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
    } else {
      alert(data.message || 'Kayıt sırasında bir hata oluştu.');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Kayıt Ol</h1>
      <form onSubmit={handleRegister}>
        <label>
          Kullanıcı Adı:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          E-posta:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
        <button type="submit">Kayıt Ol</button>
      </form>
    </div>
  );
}