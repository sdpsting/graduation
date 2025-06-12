// src/app/admin/items/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from 'src/app/components/navbar';

type Item = {
  id: string | number;
  name: string;
  category_name?: string | null;
  price: number | string;
  wears?: string | null;
  status?: string | null;
};

export default function AdminItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState<boolean | null>(null);
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Admin yetki kontrolü
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userString) {
      router.replace('/login?redirect=/admin/items'); return;
    }
    try {
      const currentUser: { role?: string } = JSON.parse(userString);
      if (currentUser && currentUser.role === 'admin') {
        setIsAdminVerified(true);
      } else {
        setError('Bu sayfaya erişim yetkiniz yok.');
        setIsAdminVerified(false);
        router.replace('/admin');
      }
    } catch (e) {
      setError('Oturum bilgileri okunamadı.');
      setIsAdminVerified(false);
      router.replace('/login');
    }
  }, [router]);

  const fetchItems = useCallback(async () => {
    if (!isAdminVerified) return;
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/admin/items', { // GET isteği
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Item listesi alınamadı.' }));
        throw new Error(errorData.message || `Sunucu hatası: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        throw new Error(data.message || 'Item verileri alınamadı veya format yanlış.');
      }
    } catch (err: any) {
      setError(err.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAdminVerified]);

  useEffect(() => {
    if (isAdminVerified === true) fetchItems();
  }, [isAdminVerified, fetchItems]);

  const handleDeleteItem = async (itemId: string | number, itemName: string) => {
    setActionMessage(null);
    if (!confirm(`"${itemName}" ID'li item'ı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
        setActionMessage({type: 'error', text: 'İşlem için yetkiniz yok veya oturumunuz sonlanmış.'});
        return;
    }
    try {
      // Silme API'sine istek (Bu API'yi birazdan oluşturacağız)
      const response = await fetch(`/api/admin/items/${itemId}`, { // Dinamik [itemId] yolu
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Item silinirken bir hata oluştu.');
      }
      setActionMessage({type: 'success', text: result.message || 'Item başarıyla silindi.'});
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    } catch (err: any) {
      setActionMessage({type: 'error', text: `Hata: ${err.message}`});
    }
  };

  if (isAdminVerified === null || (isAdminVerified && loading && !items.length)) {
    return (
        <div className="custom-admin-background vh-100 d-flex flex-column text-white">
            <Navbar />
            <div className="container text-center flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                <div className="spinner-border text-warning" role="status" style={{width: "3rem", height: "3rem"}}>
                     <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <p className="mt-3">{isAdminVerified === null ? "Yetki kontrol ediliyor..." : "Item listesi yükleniyor..."}</p>
            </div>
        </div>
    );
  }
  if (!isAdminVerified || (error && !items.length)) {
    return (
        <div className="custom-admin-background vh-100 d-flex flex-column text-white">
            <Navbar />
            <div className="container mt-5 flex-grow-1 d-flex flex-column">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link href="/admin" className="text-warning admin-breadcrumb-link">Admin Paneli</Link></li>
                        <li className="breadcrumb-item active admin-breadcrumb-active" aria-current="page">Item Yönetimi</li>
                    </ol>
                </nav>
                <div className="alert alert-danger text-center" role="alert">
                    Hata: {error || "Bu sayfaya erişim yetkiniz yok veya item listesi yüklenemedi."}
                </div>
                 <Link href="/admin" className="btn btn-secondary mt-3 align-self-start">Admin Paneline Dön</Link>
            </div>
        </div>
    );
  }

  return (
    <div className="custom-admin-background text-white min-vh-100">
      <Navbar />
      <div className="container-fluid py-4 px-md-5 px-3">
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/admin" className="text-warning admin-breadcrumb-link">Admin Paneli</Link></li>
            <li className="breadcrumb-item active admin-breadcrumb-active" aria-current="page">Item Yönetimi</li>
          </ol>
        </nav>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Item Yönetimi</h1>
          <Link href="/admin/items/new" className="btn btn-success">
            <i className="bi bi-plus-circle me-2"></i>
            Yeni Item Ekle
          </Link>
        </div>
        {actionMessage && (
          <div className={`alert ${actionMessage.type === 'success' ? 'alert-success' : 'alert-danger'}`} role="alert">
            {actionMessage.text}
          </div>
        )}
        {error && !actionMessage && items.length === 0 && (
            <div className="alert alert-danger">{error}</div>
        )}
        {!loading && items.length === 0 && !error && (
          <p className="text-light">Gösterilecek item bulunmuyor. <Link href="/admin/items/new" className="text-warning">Yeni bir tane ekleyebilirsiniz.</Link></p>
        )}
        {!loading && items.length > 0 && (
          <div className="table-responsive rounded admin-table-bg">
            <table className="table table-dark table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th><th>İsim</th><th>Kategori</th><th>Fiyat</th><th>Aşınmışlık</th><th>Durum</th><th className="text-end">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td><td>{item.name}</td><td>{item.category_name || '-'}</td>
                    <td>${typeof item.price === 'number' ? item.price.toFixed(2) : (parseFloat(String(item.price)) || 0).toFixed(2)}</td>
                    <td>{item.wears || '-'}</td>
                    <td>
                      <span className={`badge ${item.status === 'available' ? 'bg-success' : (item.status === 'sold' ? 'bg-danger' : 'bg-secondary')}`}>
                        {item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : 'Bilinmiyor'}
                      </span>
                    </td>
                    <td className="text-end">
                      <Link href={`/admin/items/edit/${item.id}`} className="btn btn-sm btn-outline-warning me-2" title="Düzenle">
                        <i className="bi bi-pencil-square"></i>
                      </Link>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteItem(item.id, item.name)} title="Sil">
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style jsx global>{`
        .custom-admin-background { background-color: #1e272e; color: #f5f6fa; min-height: 100vh; }
        .admin-table-bg { background-color: #282c34; border: 1px solid #444c56; }
        .admin-breadcrumb-link { color: #c2a061 !important; text-decoration: none !important; }
        .admin-breadcrumb-link:hover { text-decoration: underline !important; }
        .admin-breadcrumb-active { color: #bdc3c7 !important; }
        .btn i { vertical-align: middle; margin-right: 0.25rem; }
      `}</style>
    </div>
  );
}