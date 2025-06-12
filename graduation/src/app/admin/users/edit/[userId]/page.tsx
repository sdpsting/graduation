// src/app/admin/users/edit/[userId]/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation'; // useParams'ı next/navigation'dan al
import Link from 'next/link';
import Navbar from 'src/app/components/navbar';

// User tipini admin/users/page.tsx'teki ile aynı veya benzer tutalım
type User = {
  id: number;
  user_name: string;
  user_email: string;
  role: 'user' | 'admin' | string;
  balance: number | string;
  steam_id: string | null;
};

// Form state'i için tip
type UserFormData = {
  user_name: string; // Kullanıcı adı genellikle değiştirilmez ama göstermek için
  user_email: string; // Email genellikle değiştirilmez
  role: 'user' | 'admin' | string;
  balance: string; // Formda string olarak tutmak daha kolay
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams(); // URL'den userId'yi almak için
  const userId = params?.userId as string; // userId string veya string[] olabilir, cast edelim

  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAdminVerifiedClientSide, setIsAdminVerifiedClientSide] = useState<boolean | null>(null);

  // Client-side admin yetki kontrolü
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userString) {
      router.replace(`/login?redirect=/admin/users/edit/${userId}`); return;
    }
    try {
      const currentUser: { role?: string } = JSON.parse(userString);
      if (currentUser && currentUser.role === 'admin') {
        setIsAdminVerifiedClientSide(true);
      } else {
        setError('Bu sayfaya erişim yetkiniz yok.');
        setIsAdminVerifiedClientSide(false);
        router.replace('/admin');
      }
    } catch (e) {
      setError('Oturum bilgileri okunamadı.');
      setIsAdminVerifiedClientSide(false);
      router.replace('/login');
    }
  }, [router, userId]);

  // Kullanıcı verilerini çekme
  const fetchUserData = useCallback(async () => {
    if (!isAdminVerifiedClientSide || !userId) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Kullanıcı bilgileri alınamadı.' }));
        throw new Error(errorData.message || `Sunucu hatası: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        setFormData({
          user_name: data.user.user_name,
          user_email: data.user.user_email,
          role: data.user.role,
          balance: String(data.user.balance), // String'e çevir
        });
      } else {
        throw new Error(data.message || 'Kullanıcı bulunamadı veya veri formatı yanlış.');
      }
    } catch (err: any) {
      setError(err.message);
      setUser(null);
      setFormData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, isAdminVerifiedClientSide]);

  useEffect(() => {
    if (isAdminVerifiedClientSide && userId) {
      fetchUserData();
    }
  }, [isAdminVerifiedClientSide, userId, fetchUserData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!formData) return;
    const { name, value } = e.target;
    setFormData(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !userId) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    const token = localStorage.getItem('token');

    // Sadece rol ve bakiye güncellenecekse:
    const dataToUpdate: { role?: string, balance?: number } = {};
    if (formData.role !== user?.role) {
        dataToUpdate.role = formData.role;
    }
    const formBalanceNum = parseFloat(formData.balance);
    if (!isNaN(formBalanceNum) && formBalanceNum !== parseFloat(String(user?.balance))) {
        dataToUpdate.balance = formBalanceNum;
    }
    
    if (Object.keys(dataToUpdate).length === 0) {
        setSuccessMessage("Değişiklik yapılmadı.");
        setSaving(false);
        return;
    }


    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(dataToUpdate), // Sadece değişen ve izin verilen alanları gönder
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Kullanıcı güncellenirken bir hata oluştu.');
      }
      setSuccessMessage('Kullanıcı başarıyla güncellendi!');
      setUser(result.user); // Güncellenmiş kullanıcı bilgisini state'e ata
      setFormData({ // Formu da güncelle
        user_name: result.user.user_name,
        user_email: result.user.user_email,
        role: result.user.role,
        balance: String(result.user.balance),
      });
      // İsteğe bağlı: router.push('/admin/users') ile listeye geri dön
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };


  if (isAdminVerifiedClientSide === null || loading) {
    return (
        <div className="custom-background vh-100 d-flex flex-column text-white"> 
            <Navbar />
            <div className="container text-center flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                <div className="spinner-border text-warning" role="status" style={{width: "3rem", height: "3rem"}}></div>
                <p className="mt-3">{isAdminVerifiedClientSide === null ? "Yetki kontrol ediliyor..." : "Kullanıcı bilgileri yükleniyor..."}</p>
            </div>
        </div>
    );
  }

  if (!isAdminVerifiedClientSide || error || !user || !formData) {
    return (
        <div className="custom-background vh-100 d-flex flex-column text-white">
            <Navbar />
            <div className="container mt-5 flex-grow-1 d-flex flex-column">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link href="/admin" className="text-warning">Admin Paneli</Link></li>
                        <li className="breadcrumb-item"><Link href="/admin/users" className="text-warning">Kullanıcılar</Link></li>
                        <li className="breadcrumb-item active" aria-current="page">Kullanıcı Düzenle</li>
                    </ol>
                </nav>
                <div className="alert alert-danger text-center" role="alert">
                    Hata: {error || "Kullanıcı verileri yüklenemedi veya bu sayfaya erişim yetkiniz yok."}
                </div>
                 <Link href="/admin/users" className="btn btn-secondary mt-3 align-self-start">Kullanıcı Listesine Dön</Link>
            </div>
        </div>
    );
  }

  return (
    <div className="custom-background text-white">
      <Navbar />
      <div className="container-fluid py-4 px-md-5 px-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/admin" className="text-warning" style={{textDecoration:'none'}}>Admin Paneli</Link></li>
            <li className="breadcrumb-item"><Link href="/admin/users" className="text-warning" style={{textDecoration:'none'}}>Kullanıcı Yönetimi</Link></li>
            <li className="breadcrumb-item active" aria-current="page" style={{color: '#f8f9fa'}}>Kullanıcı Düzenle: {user.user_name}</li>
          </ol>
        </nav>
        <h1 className="mb-4">Kullanıcıyı Düzenle: <span className="text-info">{user.user_name}</span></h1>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {error && !successMessage && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit} className="p-4 rounded" style={{backgroundColor: "#282828"}}>
            <div className="mb-3">
                <label htmlFor="userName" className="form-label">Kullanıcı Adı (Değiştirilemez)</label>
                <input type="text" id="userName" className="form-control" value={formData.user_name} readOnly disabled />
            </div>
            <div className="mb-3">
                <label htmlFor="userEmail" className="form-label">Email (Değiştirilemez)</label>
                <input type="email" id="userEmail" className="form-control" value={formData.user_email} readOnly disabled />
            </div>
            <div className="mb-3">
                <label htmlFor="role" className="form-label">Rol</label>
                <select id="role" name="role" className="form-select" value={formData.role} onChange={handleInputChange} disabled={saving}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div className="mb-3">
                <label htmlFor="balance" className="form-label">Bakiye</label>
                <input 
                    type="number" 
                    id="balance" 
                    name="balance" 
                    className="form-control" 
                    value={formData.balance} 
                    onChange={handleInputChange} 
                    disabled={saving}
                    step="0.01" // Ondalıklı sayılar için
                />
            </div>
            <div className="d-flex justify-content-end">
                <Link href="/admin/users" className="btn btn-secondary me-2" passHref>
                  İptal
                </Link>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}