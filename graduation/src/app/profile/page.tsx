// src/app/profile/page.tsx
'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar'; // Navbar import yolunuzu kontrol edin

type User = {
  id: string | number;
  name: string;
  email: string;
  steamId?: string | null;
  role?: string;
  balance?: number;
};

type FormData = {
  name: string;
  email: string;
  steamId: string;
  password?: string;
};

export default function ProfilePage() {
  const [selectedTab, setSelectedTab] = useState<'profile' | 'payment'>('profile');
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>({ 
    name: '', 
    email: '',
    steamId: '',
    password: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Buton için yükleme durumu

  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setFormData({ 
          name: parsedUser.name || '', 
          email: parsedUser.email || '',
          steamId: parsedUser.steamId || '',
          password: '' // Şifre alanı her zaman boş başlar
        });
      } catch (e) {
        console.error("Profil: localStorage user parse hatası:", e);
        setMessage({type: 'error', text: 'Oturum bilgileri okunamadı. Lütfen tekrar giriş yapın.'});
        localStorage.removeItem('user'); // Bozuk veriyi temizle
      }
    } else {
        setMessage({type: 'error', text: 'Profil bilgilerini görmek için lütfen giriş yapmalısınız.'});
        // Opsiyonel: Eğer kullanıcı yoksa ve bu sayfa kesinlikle login gerektiriyorsa,
        // useEffect bitmeden veya burada router.push('/login') yapılabilir.
        // Ancak, router.push useEffect dışında (örneğin bir butonda) veya
        // useEffect'in return fonksiyonunda (unmount için) kullanılırsa daha stabil olur.
        // Şimdilik sadece mesaj gösteriyoruz.
    }
  }, []);

  const handleTabChange = (tab: 'profile' | 'payment') => {
    setSelectedTab(tab);
    setMessage(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!user || !user.id) {
        setMessage({type: 'error', text: 'Güncelleme yapmak için kullanıcı bilgileri bulunamadı. Lütfen tekrar giriş yapın.'});
        return;
    }
    setIsLoading(true);
    setMessage(null);

    const dataToUpdate: { name?: string; email?: string; password?: string; steamId?: string | null } = {};

    // Sadece kullanıcıdan gelen form verileri ile mevcut user state'i farklıysa güncellemeye ekle
    if (formData.name.trim() !== '' && formData.name !== user.name) {
        dataToUpdate.name = formData.name.trim();
    }
    if (formData.email.trim() !== '' && formData.email !== user.email) {
        if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
            setMessage({type: 'error', text: 'Lütfen geçerli bir e-posta adresi girin.'});
            setIsLoading(false);
            return;
        }
        dataToUpdate.email = formData.email.trim();
    }

    const currentSteamIdInState = user.steamId || '';
    const formSteamIdTrimmed = formData.steamId.trim();
    if (formSteamIdTrimmed !== currentSteamIdInState) {
        dataToUpdate.steamId = formSteamIdTrimmed === '' ? null : formSteamIdTrimmed;
    }
    
    if (formData.password && formData.password.trim() !== '') {
        // Şifre uzunluk kontrolü kaldırıldı
        dataToUpdate.password = formData.password;
    }

    if (Object.keys(dataToUpdate).length === 0) {
        setMessage({type: 'info', text: 'Güncellenecek bir değişiklik yapılmadı.'});
        setIsLoading(false);
        return;
    }

    // console.log('Profil Güncelleme API\'sine GÖNDERİLEN VERİ:', JSON.stringify(dataToUpdate, null, 2));

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({type: 'error', text: 'Yetkilendirme tokeni bulunamadı. Lütfen tekrar giriş yapın.'});
        setIsLoading(false);
        return;
      }
      const headers: HeadersInit = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(dataToUpdate),
      });

      const responseData = await response.json();

      if (response.ok && responseData.success && responseData.user) {
        const updatedUserFromApi: User = responseData.user; 
        setUser(updatedUserFromApi); 
        localStorage.setItem('user', JSON.stringify(updatedUserFromApi));
        
        setFormData({
            name: updatedUserFromApi.name || '',
            email: updatedUserFromApi.email || '',
            steamId: updatedUserFromApi.steamId || '',
            password: '' // Şifre alanını her zaman temizle
        });
        setMessage({type: 'success', text: responseData.message || 'Bilgiler başarıyla güncellendi!'});
      } else {
        setMessage({type: 'error', text: responseData.message || 'Bilgiler güncellenirken bir hata oluştu.'});
      }
    } catch (error) {
      console.error('Profil Güncelleme İsteği Hatası:', error);
      setMessage({type: 'error', text: 'Bilgiler güncellenirken bir ağ veya sunucu hatası oluştu.'});
    } finally {
      setIsLoading(false);
    }
  };

  if (!user && typeof window !== 'undefined' && !localStorage.getItem('user')) { 
    // useEffect çalıştıktan sonra hala user yoksa ve localStorage'da da yoksa (ve bir hata mesajı zaten set edilmemişse)
    // bu, kullanıcının hiç giriş yapmadığı anlamına gelir.
    if (!message) { // Eğer useEffect zaten bir hata mesajı ayarlamadıysa
        // Bu durumda doğrudan login'e yönlendirmek daha iyi olabilir.
        // Şimdilik bir yükleme ekranı veya mesaj gösterelim.
        // router.push('/login'); // veya
        return (
            <div className="container-fluid custom-background text-white vh-100 d-flex flex-column">
                <Navbar />
                <div className="flex-grow-1 d-flex justify-content-center align-items-center">
                    <p>Lütfen giriş yapın.</p>
                </div>
            </div>
        );
    }
  }
  
  // Eğer user state'i hala null ise (useEffect'in ilk çalışmasından sonra bile) ama bir hata mesajı varsa, o mesaj gösterilir.
  if (message && message.type === 'error' && (!user || message.text.toLowerCase().includes('giriş yap'))) {
    return (
        <div className="container-fluid custom-background text-white vh-100 d-flex flex-column">
            <Navbar />
            <div className="flex-grow-1 d-flex justify-content-center align-items-center text-center">
                 <div>
                    <p className="text-danger h4">{message.text}</p>
                    <button className="btn btn-primary mt-2" onClick={() => router.push('/login')}>
                        Giriş Yap Sayfasına Git
                    </button>
                 </div>
            </div>
        </div>
    );
  }

  // User state'i henüz dolmamışsa (useEffect çalışıyor olabilir) veya ilk yükleme
  if (!user) {
      return (
        <div className="container-fluid custom-background text-white vh-100 d-flex flex-column">
            <Navbar />
            <div className="flex-grow-1 d-flex justify-content-center align-items-center">
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                </div>
            </div>
        </div>
      );
  }


  return (
    <div className="container-fluid custom-background">
      <Navbar />
      <div className="row mt-4 justify-content-center">
        <div className="col-md-3 col-lg-2 d-flex flex-column align-items-center mb-4 mb-md-0">
          <div className="profile-box w-100">
            <img
              src="https://w7.pngwing.com/pngs/215/58/png-transparent-computer-icons-google-account-scalable-graphics-computer-file-my-account-icon-rim-123rf-symbol-thumbnail.png" // Profil resmi URL'si
              alt="Profile"
              className="profile-image img-fluid"
            />
            <div className="d-flex flex-column align-items-stretch mt-3">
              <button
                className={`tab-button btn btn-outline-light w-100 mb-2 ${selectedTab === 'profile' ? 'active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                Profil Bilgileri
              </button>
              <button
                className={`tab-button btn btn-outline-light w-100 ${selectedTab === 'payment' ? 'active' : ''}`}
                onClick={() => handleTabChange('payment')}
              >
                Ödeme
              </button>
            </div>
          </div>
        </div>

        <div className="col-md-7 col-lg-6">
          {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : message.type === 'info' ? 'alert-info' : 'alert-danger'} mb-3`} role="alert">
              {message.text}
            </div>
          )}
          <div className={`content-box p-4 rounded shadow-sm ${selectedTab === 'profile' ? 'profile-tab' : 'content-tab'}`} style={{backgroundColor: '#2a2a3e'}}>
            {selectedTab === 'profile' && user && ( // user null değilse formu göster
              <div className="profile-content text-white">
                <h3>Profil Bilgileri</h3>
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div className="form-group mb-3">
                    <label htmlFor="nameInput" className="form-label">Kullanıcı Adı</label>
                    <input
                        type="text"
                        id="nameInput"
                        className="form-control bg-secondary text-white border-secondary"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                    />
                    </div>
                    <div className="form-group mb-3">
                    <label htmlFor="emailInput" className="form-label">E-posta</label>
                    <input
                        type="email"
                        id="emailInput"
                        className="form-control bg-secondary text-white border-secondary"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                    </div>
                    <div className="form-group mb-3">
                    <label htmlFor="steamIdInput" className="form-label">Steam ID</label>
                    <input
                        type="text"
                        id="steamIdInput"
                        className="form-control bg-secondary text-white border-secondary"
                        name="steamId"
                        placeholder="Steam ID64 (örn: 7656119...)"
                        value={formData.steamId}
                        onChange={handleInputChange}
                    />
                    <small className="form-text text-muted-custom">Steam özelliklerini kullanmak için gereklidir.</small>
                    </div>
                    <div className="form-group mb-3">
                    <label htmlFor="passwordInput" className="form-label">Yeni Şifre (Değiştirmek istemiyorsanız boş bırakın)</label>
                    <input
                        type="password"
                        id="passwordInput"
                        className="form-control bg-secondary text-white border-secondary"
                        name="password"
                        placeholder="••••••••"
                        value={formData.password || ''} // Kontrollü component için || ''
                        onChange={handleInputChange}
                    />
                    </div>
                    <button type="submit" className="btn btn-primary mt-4 w-100" disabled={isLoading}>
                    {isLoading ? (<><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Güncelleniyor...</>) : 'Bilgileri Güncelle'}
                    </button>
                </form>
              </div>
            )}
            {selectedTab === 'payment' && (
              <div className="payment-content text-white">
                <h3>Ödeme Sayfası</h3>
                <p>Ödeme yöntemleri ve bakiye işlemleri burada yer alacak.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-background { background-color: #12181b; min-height: 100vh; padding-bottom: 2rem; color: #e0e0e0;}
        .custom-background h1, .custom-background h2, .custom-background h3, .custom-background h4, .custom-background h5, .custom-background h6 { color: #ffffff; }
        .profile-box { background-color: #1f2933; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .profile-image { width: 120px; height: 120px; border-radius: 50%; border: 3px solid #ffc107; object-fit: cover; display: block; margin-left: auto; margin-right: auto; }
        .tab-button.btn { color: #e0e0e0; border-color: #323f4b; }
        .tab-button.btn.active { background-color: #ffc107 !important; color: #12181b !important; border-color: #ffc107 !important; font-weight: bold; }
        .tab-button.btn:hover:not(.active) { background-color: #323f4b; border-color: #4b5a68; }
        .content-box { background-color: #1f2933; }
        .form-control.bg-secondary::placeholder { color: #a0a0a0; }
        .form-control.bg-secondary { background-color: #323f4b !important; color: #e0e0e0 !important; border-color: #4b5a68 !important; }
        .form-control.bg-secondary:focus { background-color: #323f4b !important; color: #e0e0e0 !important; border-color: #ffc107 !important; box-shadow: 0 0 0 0.2rem rgba(255,193,7,.25) !important; }
        .text-muted-custom { color: #868e96 !important; }
      `}</style>
    </div>
  );
}