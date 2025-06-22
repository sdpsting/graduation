// FilterComponent.tsx
'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
// Eğer Bootstrap Icons kullanıyorsanız (örneğin satıcı adı yanında ikon için):
// import 'bootstrap-icons/font/bootstrap-icons.css'; 

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from 'src/app/components/navbar';

type Item = {
  id: string;
  name: string;
  image: string;
  wears: string;
  price: number;
  previous_price?: number | null;
  inspect: string;
  ingame: string;
  category_name?: string;
  seller_id?: number | null;
  seller_name?: string | null; // SATICI ADI İÇİN YENİ ALAN
  status?: 'available' | 'sold' | string;
};

type StoredUser = {
  id: number;
  user_name: string; // seller_name ile karşılaştırmak ve "Senin Ürünün" demek için
  balance: string | number;
  steamId?: string;
  role?: 'user' | 'admin' | string;
};

const wearCodes: Record<string, string> = {
  'Factory New': 'FN',
  'Minimal Wear': 'MW',
  'Field-Tested': 'FT',
  'Well-Worn': 'WW',
  'Battle-Scarred': 'BS',
};

const defaultWearFilters: Record<string, boolean> = Object.keys(wearCodes).reduce(
  (acc, key) => ({ ...acc, [key]: true }),
  {} as Record<string, boolean>
);

const weaponTypes = ['Gloves', 'Heavy', 'Knives', 'Pistols', 'Rifles', 'SMGs'];

export default function FilterComponent() {
  const [originalItems, setOriginalItems] = useState<Item[]>([]);
  const [filters, setFilters] = useState({
    searchQuery: '',
    priceRange: { min: 0, max: 10000 },
    wearFilters: defaultWearFilters,
  });
  const [selectedWeaponType, setSelectedWeaponType] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'default' | 'priceAsc' | 'priceDesc' | 'wearAsc' | 'wearDesc'>('default');
  const [errors, setErrors] = useState<{ fetch: string | null; validation: string | null }>({
    fetch: null,
    validation: null,
  });
  const [modalContent, setModalContent] = useState<Item | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const parsedUser: StoredUser = JSON.parse(userString);
        setCurrentUser(parsedUser);
      } catch (e) { console.error("localStorage 'user' parse hatası:", e); localStorage.removeItem('user'); }
    }
    fetchItems();
    const handleStorageChange = () => {
        const updatedUserString = localStorage.getItem('user');
        if (updatedUserString) {
            try { setCurrentUser(JSON.parse(updatedUserString)); }
            catch (e) { console.error("localStorage 'user' güncelleme parse hatası:", e); }
        } else { setCurrentUser(null); }
    };
    window.addEventListener('localStorageUserUpdated', handleStorageChange);
    return () => window.removeEventListener('localStorageUserUpdated', handleStorageChange);
  }, []); // fetchItems'ı bağımlılıktan çıkardım, sadece mount'ta çalışsın diye. Eğer filtreler değiştikçe API'den çekmiyorsak bu OK.

  const fetchItems = useCallback(() => {
    setErrors(prev => ({ ...prev, fetch: null }));
    fetch('/api/items')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP hatası! Durum: ${response.status}`);
        return response.json();
      })
      .then((data: Item[]) => { // Gelen data Item dizisi olmalı
        if (Array.isArray(data)) {
          const processed = data.map((item) => ({
            ...item,
            price: Number(item.price) || 0,
            previous_price: item.previous_price ? Number(item.previous_price) : null,
            // seller_name zaten backend'den string | null olarak gelecek
            wears: (typeof item.wears === 'string' && item.wears.includes(',')) 
                   ? item.wears.split(',').map((w: string) => w.trim())[Math.floor(Math.random() * item.wears.split(',').length)] 
                   : (item.wears || 'N/A'),
          }));
          setOriginalItems(processed);
        } else {
          throw new Error('Beklenmeyen veri formatı');
        }
      })
      .catch((err: any) => {
        console.error('Veri çekme hatası:', err);
        setErrors(prev => ({ ...prev, fetch: `Veri çekme hatası: ${err.message}` }));
        setOriginalItems([]);
      });
  }, []);


  const filteredItems = useMemo(() => {
    let tempItems = originalItems.filter((item) => {
      const { min, max } = filters.priceRange;
      const priceOk = item.price >= min && item.price <= max;
      const searchOk = item.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const wearKey = item.wears && wearCodes[item.wears] ? item.wears : 'N/A_PLACEHOLDER';
      const wearOk = filters.wearFilters[wearKey] ?? (wearKey === 'N/A_PLACEHOLDER' ? true : filters.wearFilters[item.wears] ?? true);
      const typeOk = selectedWeaponType ? item.category_name === selectedWeaponType : true;
      return priceOk && searchOk && wearOk && typeOk;
    });
    const wearOrder = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred', 'N/A'];
    switch (sortOption) {
      case 'priceAsc': tempItems.sort((a, b) => a.price - b.price); break;
      case 'priceDesc': tempItems.sort((a, b) => b.price - a.price); break;
      case 'wearAsc': tempItems.sort((a, b) => wearOrder.indexOf(a.wears) - wearOrder.indexOf(b.wears)); break;
      case 'wearDesc': tempItems.sort((a, b) => wearOrder.indexOf(b.wears) - wearOrder.indexOf(a.wears)); break;
      default: break;
    }
    return tempItems;
  }, [originalItems, filters, selectedWeaponType, sortOption]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const value = Number(e.target.value);
    setFilters(prev => {
      const newRange = { ...prev.priceRange, [type]: value };
      if (newRange.min > newRange.max && newRange.max !== 0) {
        setErrors(err => ({ ...err, validation: 'Minimum fiyat, maksimum fiyattan büyük olamaz.' }));
      } else {
        setErrors(err => ({ ...err, validation: null }));
      }
      return { ...prev, priceRange: newRange };
    });
  };
  const handleWearChange = (wear: string) => setFilters(prev => ({ ...prev, wearFilters: { ...prev.wearFilters, [wear]: !prev.wearFilters[wear] } }));
  const handleWeaponTypeChange = (type: string) => setSelectedWeaponType(prev => (prev === type ? null : type));
  const resetFilters = () => {
    setFilters({ searchQuery: '', priceRange: { min: 0, max: 10000 }, wearFilters: defaultWearFilters });
    setSelectedWeaponType(null);
    setSortOption('default');
    setErrors(prev => ({ ...prev, validation: null }));
  };
  const handleCardClick = (item: Item) => setModalContent(item);
  const closeModal = () => setModalContent(null);

  const handlePurchase = async (itemToPurchase: Item) => {
    if (isPurchasing) return;
    if (currentUser && currentUser.id === itemToPurchase.seller_id) {
        alert("Kendi listelediğiniz ürünü satın alamazsınız.");
        return;
    }
    setIsPurchasing(itemToPurchase.id);
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Satın alma yapmak için lütfen giriş yapın.');
      setIsPurchasing(null);
      return;
    }
    try {
      const response = await fetch(`/api/market/purchase/${itemToPurchase.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Satın alma sırasında bir hata oluştu.');
      alert(data.message || 'Ürün başarıyla satın alındı!');
      fetchItems();
      if (currentUser && data.newBalance !== undefined) {
        const updatedUser = { ...currentUser, balance: Number(data.newBalance) };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        window.dispatchEvent(new CustomEvent('localStorageUserUpdated'));
      }
      closeModal();
    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setIsPurchasing(null);
    }
  };

  const getWearColorClass = (wear: string): string => {
    switch (wear) {
      case 'Factory New': return 'factory-new'; // Bu class'lar CSS'inizde tanımlı olmalı
      case 'Minimal Wear': return 'minimal-wear';
      case 'Field-Tested': return 'field-tested';
      case 'Well-Worn': return 'well-worn';
      case 'Battle-Scarred': return 'battle-scarred';
      default: return 'text-light'; // Veya wear-default gibi bir class
    }
  };

  return (
    <div className="container-fluid p-0 custom-background">
      <Navbar />
      {/* <ToastContainer /> */}

      <div className="weapon-type-container py-3">
        <div className="container-custom d-flex justify-content-center flex-wrap">
          {weaponTypes.map((type) => (
            <div
              key={type}
              role="button"
              tabIndex={0}
              className={`small-box p-2 ms-1 ${selectedWeaponType === type ? 'active-box' : ''}`}
              onClick={() => handleWeaponTypeChange(type)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleWeaponTypeChange(type)}
              style={{ cursor: 'pointer', minWidth: '80px', textAlign: 'center' }}
            >
              {type}
            </div>
          ))}
        </div>
      </div>

      <div className="row m-0 g-0" style={{ marginTop: '1rem' }}>
        <aside className="col-12 col-md-3 col-lg-2 p-3">
          <div className="filter-container p-3 rounded"> {/* bg-dark-filter kaldırıldı, custom-background'dan alsın */}
            <h5 className="mb-3">Filtrele</h5> {/* text-white kaldırıldı */}
            <div className="mb-3">
              <label htmlFor="searchInput" className="form-label small">İsim ile Ara</label> {/* text-light kaldırıldı */}
              <div className="input-group input-group-sm">
                <span className="input-group-text search-icon"> {/* Arkaplan ve border CSS'ten gelecek */}
                  <i className="bi bi-search"></i> {/* text-white CSS'ten gelecek */}
                </span>
                <input
                  type="text" id="searchInput" className="form-control search-bar"
                  placeholder="Eşya arayın..." value={filters.searchQuery} onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small">Fiyat Aralığı</label> {/* text-light kaldırıldı */}
              <div className="d-flex justify-content-between">
                <input type="number" className="form-control form-control-sm price-range"
                  min="0" max={filters.priceRange.max} value={filters.priceRange.min}
                  onChange={(e) => handlePriceRangeChange(e, 'min')} style={{ width: '48%' }} />
                <input type="number" className="form-control form-control-sm price-range"
                  min={filters.priceRange.min} max="100000" value={filters.priceRange.max}
                  onChange={(e) => handlePriceRangeChange(e, 'max')} style={{ width: '48%' }} />
              </div>
              {errors.validation && <p className="text-danger small mt-2">{errors.validation}</p>}
            </div>

            <div className="mb-3">
              <label className="form-label small">Aşınmışlık</label> {/* text-light kaldırıldı */}
              <div className="d-flex flex-wrap">
                {Object.entries(wearCodes).map(([wear, code]) => (
                  <label key={wear} className="custom-wear-checkbox mb-1 me-2">
                    <input type="checkbox" checked={filters.wearFilters[wear] ?? true} onChange={() => handleWearChange(wear)} />
                    <span>{code}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="sort-select" className="form-label small">Sırala</label> {/* text-white kaldırıldı */}
              <select id="sort-select" className="form-select form-select-sm order" // order-select-custom yerine order
                value={sortOption} onChange={e => setSortOption(e.target.value as any)}>
                <option value="default">Varsayılan</option>
                <option value="priceAsc">Fiyata Göre (Artan)</option>
                <option value="priceDesc">Fiyata Göre (Azalan)</option>
                <option value="wearAsc">Aşınmışlığa Göre (Artan)</option>
                <option value="wearDesc">Aşınmışlığa Göre (Azalan)</option>
              </select>
            </div>
            
            <button className="reset-button w-100" onClick={resetFilters}> {/* reset-button-custom yerine reset-button */}
              Filtreyi Sıfırla
            </button>
          </div>
        </aside>

        <main className="col-12 col-md-9 col-lg-10 p-3">
          {errors.fetch && <div className="alert alert-danger text-center">{errors.fetch}</div>}
          <div className="row g-2" style={{ marginLeft: 34, marginRight: 8 }}> {/* Stillerinizde g-2 olabilir, g-3 yapmıştım */}
            {filteredItems.length === 0 && !errors.fetch && (
              <div className="col-12"><p className="text-center w-100 mt-5 h5">Aramanıza uygun ürün bulunamadı.</p></div>
            )}
            {filteredItems.map((item) => {
              const discountPercent = item.previous_price && item.price < item.previous_price
                  ? Math.round(((item.previous_price - item.price) / item.previous_price) * 100) : 0;
              return (
                <div className="col-6 col-sm-4 col-md-3 col-lg-3 col-xl-2" key={item.id}>
                  <div className="card-items h-100 d-flex flex-column position-relative">
                    {discountPercent > 0 && (
                      <span className="badge bg-success position-absolute top-0 end-0 m-1 shadow-sm"
                        style={{ zIndex: 1, fontSize: '0.65rem', padding: '0.3em 0.5em' }}
                        title={`Önceki Fiyat: $${item.previous_price?.toFixed(2)}`}>
                        %{discountPercent} İNDİRİM
                      </span>
                    )}
                    <div onClick={() => handleCardClick(item)} style={{ cursor: 'pointer' }} className="flex-grow-1 d-flex flex-column text-decoration-none">
                      <div className={`px-2 py-1 mb-1 d-inline-block align-self-start rounded-top small ${getWearColorClass(item.wears)}`}>
                        {item.wears}
                      </div>
                      <div className="text-center px-1">
                        <img src={item.image} className="card-img-top" alt={item.name} />
                      </div>
                      <div className="card-body p-2 d-flex flex-column flex-grow-1">
                          <h5 className="card-title custom-item-title" title={item.name}>{item.name}</h5>
                          
                          {/* ---- SATICI ADI GÖSTERİMİ ---- */}
                          <p className="seller-info small mb-1">
                            {/* Eğer Bootstrap Icons kullanıyorsanız: */}
                            {/* <i className={`bi ${item.seller_name ? 'bi-person-fill' : 'bi-hdd-stack-fill'} me-1`}></i> */}
                            {item.seller_name || "Sistem Satıcısı"}
                          </p>
                          {/* ---- SATICI ADI SONU ---- */}

                          <div className="mt-auto">
                            <p className="card-text custom-price-tag">${item.price.toFixed(2)}</p>
                            {discountPercent > 0 && item.previous_price && (
                                <p className="card-text custom-old-price">${item.previous_price.toFixed(2)}</p>
                            )}
                          </div>
                      </div>
                    </div>
                    <div className="card-footer p-2 bg-transparent border-top-0">
                      <button
                        className="btn-purchase w-100" // btn-purchase-custom yerine btn-purchase (CSS'inizdekiyle eşleşmeli)
                        onClick={(e) => { e.stopPropagation(); handlePurchase(item); }}
                        disabled={isPurchasing === item.id || item.status === 'sold' || currentUser?.id === item.seller_id}
                      >
                        {isPurchasing === item.id ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                         : item.status === 'sold' ? 'Satıldı' 
                         : currentUser?.id === item.seller_id ? 'Senin Ürünün' 
                         : 'Satın Al'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
      
      {modalContent && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" onClick={closeModal} style={{ background: 'rgba(0,0,0,0.8)' }}>
            <div className="modal-dialog modal-dialog-centered" role="document" onClick={e => e.stopPropagation()}>
              <div className="modal-content custom-modal-content">
                <div className="modal-header position-relative">
                <h5 className="modal-title">
                  {modalContent.name}{' '}
                  <span className={`rounded small ${getWearColorClass(modalContent.wears)}`}> 
                    ({modalContent.wears}) {/* wear-banner-modal class'ı kaldırıldı, getWearColorClass'tan gelen renk yeterli */}
                  </span>
                </h5>
                  <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" style={{filter: 'invert(1) grayscale(100%) brightness(200%)'}}/> {/* btn-close-white yerine inline stil */}
                </div>
                <div className="modal-body text-center">
                  <img src={modalContent.image} alt={modalContent.name} className="img-fluid mb-3 custom-modal-img"/>
                  {/* MODAL İÇİNDE SATICI ADI */}
                  <p className="seller-info-modal small mb-2"> {/* seller-info-modal class'ı CSS'inizde tanımlı olmalı */}
                    Satıcı: <span className="fw-bold">{modalContent.seller_name || "Sistem Satıcısı"}</span>
                  </p>
                  <p className="fw-bold mb-1"> Fiyat: <span className="text-white">${modalContent.price.toFixed(2)}</span> </p>
                  {modalContent.previous_price && modalContent.price < modalContent.previous_price && (
  // Koşul doğruysa buradaki JSX'i göster
  <p className="small text-danger mb-3">
    Önceki: <span className="text-decoration-line-through">
      ${modalContent.previous_price.toFixed(2)}
    </span>{' '}
    <span className="badge bg-success">
      %{Math.round(((modalContent.previous_price - modalContent.price) / modalContent.previous_price) * 100)} İNDİRİM
    </span>
  </p>
)}
                  <div className="d-flex justify-content-around mb-3 button-group"> {/* button-group class'ı eklendi */}
                    <a href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(`${modalContent.name} (${modalContent.wears})`)}`}
                       target="_blank" rel="noopener noreferrer" className="open-steam">Steam Pazarı</a>
                    {modalContent.inspect && (
                      <button onClick={() => window.open(modalContent.inspect, '_blank')} className="modal-inspect-btn">
                        İncele <i className="fas fa-search ms-1"></i> {/* FontAwesome ikonu, projenize ekli olmalı */}
                      </button>
                    )}
                  </div>
                  <button className="modal-buy-btn w-100" // modal-buy-btn-custom yerine modal-buy-btn (CSS'inizdekiyle eşleşmeli)
                    onClick={() => handlePurchase(modalContent)}
                    disabled={isPurchasing === modalContent.id || modalContent.status === 'sold' || currentUser?.id === modalContent.seller_id}
                  >
                    {isPurchasing === modalContent.id ? (<><span className="spinner-border spinner-border-sm me-2"></span>İşleniyor...</>)
                     : modalContent.status === 'sold' ? 'Bu Ürün Satılmış'
                     : currentUser?.id === modalContent.seller_id ? 'Senin Ürünün'
                     : `Satın Al ($${modalContent.price.toFixed(2)})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      {/* <ToastContainer /> Eğer kullanacaksanız */}
    </div>
  );
}