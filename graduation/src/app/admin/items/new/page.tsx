// src/app/admin/items/new/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from 'src/app/components/navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';

type NewItemFormData = {
  id: string; 
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

export default function AddItemPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<NewItemFormData>({
    id: '', name: '', category_name: '', price: '', wears: '', 
    status: 'available', collections: '', image: '', inspect: '', ingame: '',
    stattrak: false, wear_float: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAdminVerified, setIsAdminVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userString) {
      router.replace(`/login?redirect=/admin/items/new`);
      return;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!formData.id.trim() || !formData.name.trim() || !formData.category_name.trim() || 
        !formData.price.trim() || !formData.wears.trim() || !formData.status.trim() || !formData.collections.trim()) {
      setError('ID, İsim, Kategori, Fiyat, Aşınmışlık, Durum ve Koleksiyon alanları zorunludur.');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
        setError('Lütfen geçerli bir fiyat girin (0 veya daha büyük).');
        return;
    }
    let wearFloatNum: number | null = null;
    if (formData.wear_float.trim() !== '') {
        wearFloatNum = parseFloat(formData.wear_float);
        if (isNaN(wearFloatNum) || wearFloatNum < 0 || wearFloatNum > 1) {
            setError('Wear Float (Aşınma Değeri) 0 ile 1 arasında bir değer olmalıdır veya boş bırakılmalıdır.');
            return;
        }
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    if (!token) {
        setError("Oturumunuz sonlanmış veya token bulunamadı. Lütfen tekrar giriş yapın.");
        setSubmitting(false);
        router.push('/login');
        return;
    }

    try {
      const payload = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        category_name: formData.category_name,
        price: priceNum,
        wears: formData.wears,
        status: formData.status,
        collections: formData.collections.trim(),
        image: formData.image.trim() || null,
        inspect: formData.inspect.trim() || null,
        ingame: formData.ingame.trim() || null,
        stattrak: formData.stattrak,
        wear_float: wearFloatNum,
      };

      const response = await fetch('/api/admin/items', { // POST isteği /api/admin/items'a
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Item eklenirken bir sunucu hatası oluştu.');
      }
      setSuccessMessage('Item başarıyla eklendi! Listeye yönlendiriliyorsunuz...');
      setFormData({ 
        id: '', name: '', category_name: '', price: '', wears: '', 
        status: 'available', collections: '', image: '', inspect: '', ingame: '',
        stattrak: false, wear_float: ''
      });
      setTimeout(() => {
        router.push('/admin/items');
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Bilinmeyen bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isAdminVerified === null) {
    return (
        <div className="custom-admin-background vh-100 d-flex flex-column text-white"> 
            <Navbar />
            <div className="container text-center flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                <div className="spinner-border text-warning" role="status" style={{width: "3rem", height: "3rem"}}>
                     <span className="visually-hidden">Yetki kontrol ediliyor...</span>
                </div>
                <p className="mt-3">Yetki kontrol ediliyor...</p>
            </div>
        </div>
    );
  }
  if (!isAdminVerified) {
    return (
        <div className="custom-admin-background vh-100 d-flex flex-column text-white">
            <Navbar />
            <div className="container mt-5">
                 <div className="alert alert-danger">{error || "Bu sayfaya erişim yetkiniz yok."}</div>
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
            <li className="breadcrumb-item active admin-breadcrumb-active" aria-current="page">Yeni Item Ekle</li>
          </ol>
        </nav>
        <h1 className="mb-4">Yeni Item Ekle</h1>

        {successMessage && <div className="alert alert-success animate__animated animate__fadeIn">{successMessage}</div>}
        {error && !successMessage && <div className="alert alert-danger animate__animated animate__shakeX">{error}</div>}
        
        <form onSubmit={handleSubmit} className="p-4 rounded admin-form-bg">
          {/* ID Input */}
          <div className="mb-3">
            <label htmlFor="id" className="form-label">Item ID (*)</label>
            <input type="text" id="id" name="id" className="form-control admin-input" value={formData.id} onChange={handleInputChange} required disabled={submitting} placeholder="Benzersiz ID (örn: ak47-redline-ft)" />
          </div>
          {/* Diğer form alanları (name, category, price, wears, status, collections, image, inspect, ingame, stattrak, wear_float) */}
          {/* Önceki mesajdaki gibi aynı kalacaklar */}
          <div className="row gx-3">
            <div className="col-md-6 mb-3">
              <label htmlFor="name" className="form-label">Item Adı (*)</label>
              <input type="text" id="name" name="name" className="form-control admin-input" value={formData.name} onChange={handleInputChange} required disabled={submitting} />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="category_name" className="form-label">Kategori (*)</label>
              <select id="category_name" name="category_name" className="form-select admin-select" value={formData.category_name} onChange={handleInputChange} required disabled={submitting}>
                {weaponCategories.map(cat => <option key={cat} value={cat}>{cat || '-- Kategori Seçin --'}</option>)}
              </select>
            </div>
          </div>
          <div className="row gx-3">
            <div className="col-md-6 mb-3">
              <label htmlFor="price" className="form-label">Fiyat ($) (*)</label>
              <input type="number" id="price" name="price" className="form-control admin-input" value={formData.price} onChange={handleInputChange} required step="0.01" min="0" disabled={submitting} />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="wears" className="form-label">Aşınmışlık (*)</label>
              <select id="wears" name="wears" className="form-select admin-select" value={formData.wears} onChange={handleInputChange} required disabled={submitting}>
                {wearOptions.map(wear => <option key={wear} value={wear}>{wear || '-- Aşınmışlık Seçin --'}</option>)}
              </select>
            </div>
          </div>
          <div className="row gx-3">
            <div className="col-md-6 mb-3">
              <label htmlFor="status" className="form-label">Durum (*)</label>
              <select id="status" name="status" className="form-select admin-select" value={formData.status} onChange={handleInputChange} required disabled={submitting}>
                {itemStatuses.map(stat => <option key={stat} value={stat}>{stat.charAt(0).toUpperCase() + stat.slice(1)}</option>)}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="collections" className="form-label">Koleksiyon (*)</label>
              <input type="text" id="collections" name="collections" className="form-control admin-input" value={formData.collections} onChange={handleInputChange} required disabled={submitting} />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="image" className="form-label">Resim URL</label>
            <input type="url" id="image" name="image" className="form-control admin-input" value={formData.image} onChange={handleInputChange} placeholder="https://..." disabled={submitting} />
          </div>
          <div className="mb-3">
            <label htmlFor="inspect" className="form-label">Inspect Link</label>
            <input type="url" id="inspect" name="inspect" className="form-control admin-input" value={formData.inspect} onChange={handleInputChange} placeholder="steam://..." disabled={submitting} />
          </div>
          <div className="mb-3">
            <label htmlFor="ingame" className="form-label">In-Game Link</label>
            <input type="url" id="ingame" name="ingame" className="form-control admin-input" value={formData.ingame} onChange={handleInputChange} placeholder="steam://..." disabled={submitting} />
          </div>
          <div className="row gx-3 align-items-center">
            <div className="col-md-6 mb-3">
                <label htmlFor="wear_float" className="form-label">Wear Float (Örn: 0.07)</label>
                <input type="number" id="wear_float" name="wear_float" className="form-control admin-input" value={formData.wear_float} onChange={handleInputChange} step="0.000000000000001" min="0" max="1" disabled={submitting} placeholder="0.0000 - 1.0000"/>
            </div>
            <div className="col-md-6 mb-3 mt-md-4 pt-md-2">
                <div className="form-check">
                    <input className="form-check-input admin-checkbox" type="checkbox" id="stattrak" name="stattrak" checked={formData.stattrak} onChange={handleInputChange} disabled={submitting} />
                    <label className="form-check-label" htmlFor="stattrak">
                        StatTrak™
                    </label>
                </div>
            </div>
          </div>

          <div className="d-flex justify-content-end mt-4">
            <Link href="/admin/items" className="btn btn-secondary me-2"> {/* passHref gereksiz */}
              İptal
            </Link>
            <button type="submit" className="btn btn-primary admin-btn-primary" disabled={submitting}>
              {submitting ? (
                <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Ekleniyor...</>
              ) : (
                'Item Ekle'
              )}
            </button>
          </div>
        </form>
      </div>
      <style jsx global>{`
        .custom-admin-background { background-color: #1e272e; color: #f5f6fa; /* min-height: 100vh; */ }
        .admin-form-bg { background-color: #282c34; border: 1px solid #444c56; }
        .admin-input, .admin-select { background-color: #3c424a !important; color: #f0f0f0 !important; border-color: #555c64 !important; }
        .admin-input::placeholder { color: #a0a0a0; }
        .admin-input:focus, .admin-select:focus { background-color: #454c54 !important; color: #ffffff !important; border-color: #c2a061 !important; box-shadow: 0 0 0 0.2rem rgba(194, 160, 97, 0.25) !important; }
        .admin-checkbox:checked { background-color: #c2a061 !important; border-color: #c2a061 !important; }
        .admin-breadcrumb-link, .admin-breadcrumb-link:hover { color: #c2a061 !important; text-decoration: none; }
        .admin-breadcrumb-active { color: #bdc3c7 !important; }
        .btn.admin-btn-primary { background-color: #c2a061; border-color: #c2a061; color: #ffffff; }
        .btn.admin-btn-primary:hover { background-color: #ad8d50; border-color: #ad8d50; }
      `}</style>
    </div>
  );
}