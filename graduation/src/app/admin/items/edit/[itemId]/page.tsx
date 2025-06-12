// src/app/admin/items/edit/[itemId]/page.tsx
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from 'src/app/components/navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

// Item tipi (backend'den gelen ve forma yansıtılacak)
type Item = {
  id: string | number;
  name: string;
  category_name: string | null;
  price: number | string;
  wears: string | null;
  status: string | null;
  collections: string | null;
  image: string | null;
  inspect: string | null;
  ingame: string | null;
  stattrak: boolean | number; // DB'den 0/1 gelebilir
  wear_float: number | string | null;
};

// Form state'i için tip
type ItemFormData = {
  name: string;
  category_name: string;
  price: string;
  wears: string;
  status: string;
  collections: string;
  image: string;
  inspect: string;
  ingame: string;
  stattrak: boolean;
  wear_float: string;
};

const weaponCategories = ['', 'Gloves', 'Heavy', 'Knives', 'Pistols', 'Rifles', 'SMGs', 'Agent', 'Sticker', 'Graffiti', 'Case', 'Collectible', 'Music Kit', 'Patch', 'Tool', 'Other'];
const wearOptions = ['', 'Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred', 'Not Painted'];
const itemStatuses = ['available', 'sold', 'pending', 'unlisted'];

export default function EditItemPage() {
  const router = useRouter();
  const params = useParams();
  const itemId = params?.itemId as string; // URL'den gelen itemId

  const [initialItemData, setInitialItemData] = useState<Item | null>(null); // Orijinal veriyi tutmak için
  const [formData, setFormData] = useState<ItemFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState<boolean | null>(null);

  // Admin yetki kontrolü
  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userString) {
      router.replace(`/login?redirect=/admin/items/edit/${itemId}`); return;
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
  }, [router, itemId]);

  // Item verilerini çekme
  const fetchItemData = useCallback(async () => {
    if (!isAdminVerified || !itemId) return;
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/admin/items/${itemId}`, { // GET isteği
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Item bilgileri alınamadı.' }));
        throw new Error(errorData.message || `Sunucu hatası: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && data.item) {
        const item = data.item as Item;
        setInitialItemData(item); // Orijinal veriyi sakla
        setFormData({ // Formu doldur
          name: item.name || '',
          category_name: item.category_name || '',
          price: String(item.price || '0'),
          wears: item.wears || '',
          status: item.status || 'available',
          collections: item.collections || '',
          image: item.image || '',
          inspect: item.inspect || '',
          ingame: item.ingame || '',
          stattrak: Boolean(item.stattrak), // 0/1'i boolean'a çevir
          wear_float: String(item.wear_float !== null && item.wear_float !== undefined ? item.wear_float : ''),
        });
      } else {
        throw new Error(data.message || 'Item bulunamadı veya veri formatı yanlış.');
      }
    } catch (err: any) {
      setError(err.message);
      setFormData(null);
    } finally {
      setLoading(false);
    }
  }, [itemId, isAdminVerified]);

  useEffect(() => {
    if (isAdminVerified && itemId) {
      fetchItemData();
    }
  }, [isAdminVerified, itemId, fetchItemData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!formData) return;
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setFormData(prev => prev ? { ...prev, [name]: (e.target as HTMLInputElement).checked } : null);
    } else {
        setFormData(prev => prev ? { ...prev, [name]: value } : null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData || !itemId || !initialItemData) return;
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    const token = localStorage.getItem('token');

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
        setError('Lütfen geçerli bir fiyat girin.');
        setSaving(false); return;
    }
    let wearFloatNum: number | null = null;
    if (formData.wear_float.trim() !== '') {
        wearFloatNum = parseFloat(formData.wear_float);
        if (isNaN(wearFloatNum) || wearFloatNum < 0 || wearFloatNum > 1) {
            setError('Wear Float 0 ile 1 arasında bir değer olmalıdır veya boş bırakılmalıdır.');
            setSaving(false); return;
        }
    }

    // Sadece değişen alanları gönder (opsiyonel ama iyi bir pratik)
    const dataToUpdate: Partial<ItemFormData & { price: number, wear_float: number | null }> = {};
    // Backend zaten undefined alanları atlayacak ama yine de sadece değişenleri göndermek daha temiz olabilir.
    // Ya da tüm formData'yı gönderip backend'in işlemesini sağlayabiliriz.
    // Şimdilik tüm formu gönderelim, backend zaten sadece tanımlı olanları alacak.
    const payload = {
        name: formData.name.trim(),
        category_name: formData.category_name || null,
        price: priceNum,
        wears: formData.wears || null,
        status: formData.status,
        collections: formData.collections.trim() || null,
        image: formData.image.trim() || null,
        inspect: formData.inspect.trim() || null,
        ingame: formData.ingame.trim() || null,
        stattrak: formData.stattrak,
        wear_float: wearFloatNum,
      };

    try {
      const response = await fetch(`/api/admin/items/${itemId}`, { // PUT isteği
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Item güncellenirken bir hata oluştu.');
      }
      setSuccessMessage('Item başarıyla güncellendi!');
      // Formu ve initialItemData'yı güncellenmiş veriyle yenile
      const updatedItem = result.item as Item;
      setInitialItemData(updatedItem);
      setFormData({
        name: updatedItem.name || '',
        category_name: updatedItem.category_name || '',
        price: String(updatedItem.price || '0'),
        wears: updatedItem.wears || '',
        status: updatedItem.status || 'available',
        collections: updatedItem.collections || '',
        image: updatedItem.image || '',
        inspect: updatedItem.inspect || '',
        ingame: updatedItem.ingame || '',
        stattrak: Boolean(updatedItem.stattrak),
        wear_float: String(updatedItem.wear_float !== null && updatedItem.wear_float !== undefined ? updatedItem.wear_float : ''),
      });
      // setTimeout(() => { router.push('/admin/items'); }, 2000); // İsteğe bağlı yönlendirme
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };


  if (isAdminVerified === null || loading) { /* ... Yükleniyor JSX (öncekiyle aynı)... */ }
  if (!isAdminVerified || error || !formData) { /* ... Hata JSX (öncekiyle aynı, formData kontrolü eklendi) ... */ }
  
  // Not: Yukarıdaki yükleme ve hata JSX'leri AddItemPage'dekine benzer olacak.
  // Sadece mesajlar "Item detayı yükleniyor" vb. şeklinde değişebilir.
  // Örnek:
  if (isAdminVerified === null || (loading && !formData)) { // formData yüklenene kadar loading göster
    return (
        <div className="custom-admin-background vh-100 d-flex flex-column text-white"> 
            <Navbar />
            <div className="container text-center flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                <div className="spinner-border text-warning" role="status" style={{width: "3rem", height: "3rem"}}></div>
                <p className="mt-3">{isAdminVerified === null ? "Yetki kontrol ediliyor..." : "Item bilgileri yükleniyor..."}</p>
            </div>
        </div>
    );
  }

  if (!isAdminVerified || (error && !formData) || !formData ) { // formData hala null ise veya hata varsa
    return (
        <div className="custom-admin-background vh-100 d-flex flex-column text-white">
            <Navbar />
            <div className="container mt-5 flex-grow-1 d-flex flex-column">
                <nav aria-label="breadcrumb">
                    <ol className="breadcrumb">
                        <li className="breadcrumb-item"><Link href="/admin" className="text-warning admin-breadcrumb-link">Admin Paneli</Link></li>
                        <li className="breadcrumb-item"><Link href="/admin/items" className="text-warning admin-breadcrumb-link">Item Yönetimi</Link></li>
                        <li className="breadcrumb-item active admin-breadcrumb-active" aria-current="page">Item Düzenle</li>
                    </ol>
                </nav>
                <div className="alert alert-danger text-center" role="alert">
                    Hata: {error || "Item verileri yüklenemedi veya bu sayfaya erişim yetkiniz yok."}
                </div>
                 <Link href="/admin/items" className="btn btn-secondary mt-3 align-self-start">Item Listesine Dön</Link>
            </div>
        </div>
    );
  }


  return (
    <div className="custom-admin-background text-white min-vh-100">
      <Navbar />
      <div className="container py-4 px-md-5 px-3">
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb">
            <li className="breadcrumb-item"><Link href="/admin" className="text-warning admin-breadcrumb-link">Admin Paneli</Link></li>
            <li className="breadcrumb-item"><Link href="/admin/items" className="text-warning admin-breadcrumb-link">Item Yönetimi</Link></li>
            <li className="breadcrumb-item active admin-breadcrumb-active" aria-current="page">Düzenle: {initialItemData?.name || itemId}</li>
          </ol>
        </nav>
        <h1 className="mb-4">Item Düzenle: <span className="text-info">{initialItemData?.name}</span></h1>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {error && !successMessage && <div className="alert alert-danger">{error}</div>}
        
        <form onSubmit={handleSubmit} className="p-4 rounded admin-form-bg">
          {/* Item ID (Değiştirilemez) */}
          <div className="mb-3">
            <label htmlFor="itemIdDisplay" className="form-label">Item ID</label>
            <input type="text" id="itemIdDisplay" className="form-control admin-input" value={itemId} readOnly disabled />
          </div>

          {/* Diğer form alanları (AddItemPage'deki gibi ama value={formData.alanAdi} ile) */}
          {/* Örnek: Name */}
          <div className="row gx-3">
            <div className="col-md-6 mb-3">
              <label htmlFor="name" className="form-label">Item Adı (*)</label>
              <input type="text" id="name" name="name" className="form-control admin-input" value={formData.name} onChange={handleInputChange} required disabled={saving} />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="category_name" className="form-label">Kategori (*)</label>
              <select id="category_name" name="category_name" className="form-select admin-select" value={formData.category_name} onChange={handleInputChange} required disabled={saving}>
                {weaponCategories.map(cat => <option key={cat} value={cat}>{cat || '-- Kategori Seçin --'}</option>)}
              </select>
            </div>
          </div>
          {/* ... Price, Wears, Status, Collections, Image, Inspect, Ingame, Wear Float, StatTrak inputları buraya ... */}
          {/* (AddItemPage'deki form alanlarını kopyalayıp value'larını formData'dan alacak şekilde düzenleyin) */}
           <div className="row gx-3">
            <div className="col-md-6 mb-3">
              <label htmlFor="price" className="form-label">Fiyat ($) (*)</label>
              <input type="number" id="price" name="price" className="form-control admin-input" value={formData.price} onChange={handleInputChange} required step="0.01" min="0" disabled={saving} />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="wears" className="form-label">Aşınmışlık (*)</label>
              <select id="wears" name="wears" className="form-select admin-select" value={formData.wears} onChange={handleInputChange} required disabled={saving}>
                {wearOptions.map(wear => <option key={wear} value={wear}>{wear || '-- Aşınmışlık Seçin --'}</option>)}
              </select>
            </div>
          </div>
          <div className="row gx-3">
            <div className="col-md-6 mb-3">
              <label htmlFor="status" className="form-label">Durum (*)</label>
              <select id="status" name="status" className="form-select admin-select" value={formData.status} onChange={handleInputChange} required disabled={saving}>
                {itemStatuses.map(stat => <option key={stat} value={stat}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="collections" className="form-label">Koleksiyon (*)</label>
              <input type="text" id="collections" name="collections" className="form-control admin-input" value={formData.collections} onChange={handleInputChange} required disabled={saving} />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="image" className="form-label">Resim URL</label>
            <input type="url" id="image" name="image" className="form-control admin-input" value={formData.image} onChange={handleInputChange} placeholder="https://..." disabled={saving} />
          </div>
          <div className="mb-3">
            <label htmlFor="inspect" className="form-label">Inspect Link</label>
            <input type="url" id="inspect" name="inspect" className="form-control admin-input" value={formData.inspect} onChange={handleInputChange} placeholder="steam://..." disabled={saving} />
          </div>
          <div className="mb-3">
            <label htmlFor="ingame" className="form-label">In-Game Link</label>
            <input type="url" id="ingame" name="ingame" className="form-control admin-input" value={formData.ingame} onChange={handleInputChange} placeholder="steam://..." disabled={saving} />
          </div>
          <div className="row gx-3 align-items-center">
            <div className="col-md-6 mb-3">
                <label htmlFor="wear_float" className="form-label">Wear Float (Örn: 0.07)</label>
                <input type="number" id="wear_float" name="wear_float" className="form-control admin-input" value={formData.wear_float} onChange={handleInputChange} step="0.000000000000001" min="0" max="1" disabled={saving} placeholder="0.0000 - 1.0000"/>
            </div>
            <div className="col-md-6 mb-3 mt-md-4 pt-md-2">
                <div className="form-check">
                    <input className="form-check-input admin-checkbox" type="checkbox" id="stattrak" name="stattrak" checked={formData.stattrak} onChange={handleInputChange} disabled={saving} />
                    <label className="form-check-label" htmlFor="stattrak">
                        StatTrak™
                    </label>
                </div>
            </div>
          </div>


          <div className="d-flex justify-content-end mt-4">
            <Link href="/admin/items" className="btn btn-secondary me-2">
              İptal
            </Link>
            <button type="submit" className="btn btn-primary admin-btn-primary" disabled={saving}>
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
      <style jsx global>{` /* ... (Admin stilleri aynı) ... */ `}</style>
    </div>
  );
}