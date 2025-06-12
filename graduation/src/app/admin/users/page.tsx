// src/app/admin/users/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from 'src/app/components/navbar';

type User = {
  id: number;
  user_name: string;
  user_email: string;
  role: 'user' | 'admin' | string;
  balance: number | string;
  steam_id: string | null;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminVerifiedClientSide, setIsAdminVerifiedClientSide] = useState<boolean | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userString) {
      router.replace('/login?redirect=/admin/users'); return;
    }
    try {
      const currentUser: { role?: string } = JSON.parse(userString);
      if (currentUser && currentUser.role === 'admin') {
        setIsAdminVerifiedClientSide(true);
      } else {
        setError('Bu sayfaya erişim yetkiniz yok.');
        setIsAdminVerifiedClientSide(false);
        router.replace('/');
      }
    } catch (e) {
      setError('Oturum bilgileri okunamadı.');
      setIsAdminVerifiedClientSide(false);
      localStorage.removeItem('user'); localStorage.removeItem('token');
      router.replace('/login');
    }
  }, [router]);

  const fetchUsers = useCallback(async () => {
    if (!isAdminVerifiedClientSide) return;
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    if (!token) {
        setError("Yetkilendirme tokenı bulunamadı."); setLoading(false); return;
    }
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Sunucudan geçersiz yanıt.' }));
        throw new Error(errorData.message || `Kullanıcılar çekilemedi: Sunucu ${response.status} hatası verdi.`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.users)) {
        const typedUsers = data.users.map((user: any) => ({
            ...user,
            balance: typeof user.balance === 'string' ? parseFloat(user.balance) : (typeof user.balance === 'number' ? user.balance : 0),
        }));
        setUsers(typedUsers);
      } else {
        throw new Error(data.message || 'Kullanıcı verileri alınamadı veya API formatı yanlış.');
      }
    } catch (err: any) {
      console.error("Kullanıcıları çekme API hatası:", err);
      setError(err.message || 'Kullanıcı listesi yüklenirken bir sorun oluştu.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isAdminVerifiedClientSide]);

  useEffect(() => {
    if (isAdminVerifiedClientSide === true) {
      fetchUsers();
    }
  }, [isAdminVerifiedClientSide, fetchUsers]);

  const formatBalanceForDisplay = (balance: number | string | null | undefined): string => {
    if (balance === null || balance === undefined) return 'N/A';
    const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
    if (isNaN(numBalance)) return 'Geçersiz';
    return `$${numBalance.toFixed(2)}`;
  };

  // Yükleme veya yetki kontrolü sırasında gösterilecek JSX
  if (isAdminVerifiedClientSide === null || (isAdminVerifiedClientSide && loading)) {
    return (
      // ---- EN DIŞ DIV'E .custom-background CLASS'I ----
      <div className="custom-background vh-100 d-flex flex-column"> 
        <Navbar />
        <div className="container text-center flex-grow-1 d-flex flex-column justify-content-center align-items-center">
            {/* text-white class'ı .custom-background'dan miras kalmalı */}
            <div className="spinner-border text-warning" role="status" style={{width: "3rem", height: "3rem"}}>
                <span className="visually-hidden">Yükleniyor...</span>
            </div>
            <p className="mt-3">{isAdminVerifiedClientSide === null ? "Yetki kontrol ediliyor..." : "Kullanıcılar yükleniyor..."}</p>
        </div>
      </div>
    );
  }

  // Yetkisiz veya Hata Durumu JSX
  if (!isAdminVerifiedClientSide || error) {
    return (
      // ---- EN DIŞ DIV'E .custom-background CLASS'I ----
      <div className="custom-background vh-100 d-flex flex-column">
        <Navbar />
        <div className="container mt-5 flex-grow-1 d-flex flex-column justify-content-center align-items-center">
            <div className="alert alert-danger w-75 text-center" role="alert">
              Hata: {error || "Bu sayfaya erişim yetkiniz yok."}
            </div>
            <Link href={isAdminVerifiedClientSide === false ? "/" : "/login"} className="btn btn-primary mt-3">
                {isAdminVerifiedClientSide === false ? "Ana Sayfaya Dön" : "Giriş Sayfasına Git"}
            </Link>
        </div>
      </div>
    );
  }

  // Başarılı Durum JSX (Kullanıcı Listesi)
  return (
    // ---- EN DIŞ DIV'E .custom-background CLASS'I ----
    <div className="custom-background"> 
      <Navbar /> 
      
      <div className="container-fluid py-4 px-md-5 px-3"> 
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            {/* Link renkleri için text-warning veya CSS'teki a:hover kullanılabilir */}
            <li className="breadcrumb-item"><Link href="/admin" className="text-warning">Admin Paneli</Link></li>
            <li className="breadcrumb-item active" aria-current="page">Kullanıcı Yönetimi</li> {/* Bu zaten açık renk olmalı */}
          </ol>
        </nav>
        {/* Başlık rengi .custom-background'dan miras kalmalı */}
        <h1 className="mb-4">Kullanıcı Listesi</h1> 
        
        {users.length === 0 && !loading ? (
          <p>Gösterilecek kullanıcı bulunamadı.</p> 
        ) : (
          // Tabloyu saran div için arkaplanı senin CSS'inden aldım
          <div className="table-responsive rounded" style={{backgroundColor: "#282828", padding: "1rem"}}> 
            <table className="table table-dark table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Kullanıcı Adı</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Bakiye</th>
                  <th>Steam ID</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.user_name}</td>
                    <td>{user.user_email}</td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{formatBalanceForDisplay(user.balance)}</td>
                    <td>{user.steam_id || 'Yok'}</td>
                    <td>
                      <button className="btn btn-sm btn-info me-2" onClick={() => router.push(`/admin/users/edit/${user.id}`) } title="Düzenle">
                        <i className="bi bi-pencil-square"></i> {/* Bootstrap Icon */}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* style jsx global bloğunu kaldırdım, çünkü .custom-background'ı globals.css'ten alacağız */}
    </div>
  );
}