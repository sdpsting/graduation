'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from 'src/app/components/navbar';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try { // Hata yakalamak için try-catch bloğu ekleyelim
      const response = await fetch('/api/login', { // Backend login endpoint'iniz
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Yanıtın başarılı olup olmadığını kontrol edelim (örn: 200 OK)
      if (!response.ok) {
        // Başarısız bir HTTP yanıtı durumunda (4xx, 5xx)
        const errorData = await response.json().catch(() => ({ message: "Sunucudan geçersiz yanıt." })); // JSON parse hatası olursa
        alert(errorData.message || `Giriş sırasında bir sunucu hatası oluştu: ${response.status}`);
        return; // İşlemi burada sonlandır
      }

      const data = await response.json();

      // Backend'den dönen yanıtı kontrol edelim
      console.log("Backend'den gelen veri:", data);

      if (data.success) {
        alert('Giriş başarılı! Hoş geldiniz.');

        // Kullanıcı bilgilerini localStorage'a kaydedelim
        // Mevcut user objesine steamId'yi de ekliyoruz
        localStorage.setItem('user', JSON.stringify({
          id: data.userId,
          name: data.userName,
          balance: data.balance,
          steamId: data.steamId, // <<< YENİ EKLENEN SATIR: steamId'yi buraya ekliyoruz
        }));

        // İsteğe bağlı: localStorage'a ayrı ayrı da kaydedebilirsiniz,
        // bu InventoryPage'deki okuma mantığını biraz değiştirebilir.
        // Ama tek bir 'user' objesi daha düzenli.
        // localStorage.setItem('loggedInUserId', data.userId.toString());
        // localStorage.setItem('loggedInUserName', data.userName);
        // localStorage.setItem('loggedInUserBalance', data.balance.toString());
        // localStorage.setItem('loggedInUserSteamId', data.steamId);


        router.push('/'); // Anasayfaya veya inventory sayfasına yönlendir
        // router.push('/inventory'); // Eğer doğrudan envantere gitmesini istiyorsanız

      } else {
        alert(data.message || 'Giriş sırasında bir hata oluştu (API success:false).');
      }
    } catch (error) {
      console.error("Login frontend hatası:", error);
      alert("Giriş işlemi sırasında bir ağ hatası veya beklenmedik bir sorun oluştu.");
    }
  };

  return (
    <>
      <Navbar />
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