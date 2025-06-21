
'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from 'src/app/components/navbar';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

// Types remain the same
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
  status?: 'available' | 'sold' | string;
};

type StoredUser = {
  id: number;
  name: string;
  balance: string | number;
  steamId?: string;
  role?: 'user' | 'admin' | string;
};

// Constants remain the same
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
  // State variables
  const [originalItems, setOriginalItems] = useState<Item[]>([]);
  const [filters, setFilters] = useState({
    searchQuery: '',
    priceRange: { min: 0, max: 10000 },
    wearFilters: defaultWearFilters,
  });
  const [selectedWeaponType, setSelectedWeaponType] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<'default' | 'priceAsc' | 'priceDesc' | 'wearAsc' | 'wearDesc'>('default');

  // IMPROVEMENT: More structured error state to differentiate between fetch and validation errors.
  const [errors, setErrors] = useState<{ fetch: string | null; validation: string | null }>({
    fetch: null,
    validation: null,
  });

  const [modalContent, setModalContent] = useState<Item | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const fetchItems = useCallback(() => {
    setErrors({ fetch: null, validation: errors.validation }); // Clear only the fetch error
    fetch('/api/items')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data: Item[]) => {
        if (Array.isArray(data)) {
          // IMPROVEMENT: Simplified data processing.
          // This assumes the API provides a valid, single 'wears' string per item.
          // The previous random selection logic could lead to an inconsistent UI on each fetch.
          const processed = data.map((item) => ({
            ...item,
            price: Number(item.price) || 0,
            previous_price: item.previous_price ? Number(item.previous_price) : null,
          }));
          setOriginalItems(processed);
        } else {
          throw new Error('Beklenmeyen veri formatı');
        }
      })
      .catch((err: any) => {
        console.error('Veri çekme hatası:', err);
        setErrors((prev) => ({ ...prev, fetch: `Veri çekme hatası: ${err.message}` }));
        setOriginalItems([]);
      });
  }, [errors.validation]); // Keep validation error on refetch

  useEffect(() => {
    fetchItems();
  }, []); // Run only once on mount

  // IMPROVEMENT: Replaced the `useEffect(applyFilters)` chain with `useMemo`.
  // This is more performant and declarative. It recalculates `filteredItems` only when its dependencies change.
  // It avoids unnecessary re-renders and complex effect chains.
  const filteredItems = useMemo(() => {
    let items = originalItems.filter((item) => {
      const { min, max } = filters.priceRange;
      const priceOk = item.price >= min && item.price <= max;
      const searchOk = item.name.toLowerCase().includes(filters.searchQuery.toLowerCase());
      const wearOk = filters.wearFilters[item.wears] ?? true;
      const typeOk = selectedWeaponType ? item.category_name === selectedWeaponType : true;
      return priceOk && searchOk && wearOk && typeOk;
    });

    // Sorting logic is now part of the memoized calculation.
    const wearOrder = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];
    switch (sortOption) {
      case 'priceAsc':
        items.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        items.sort((a, b) => b.price - a.price);
        break;
      case 'wearAsc':
        items.sort((a, b) => wearOrder.indexOf(a.wears) - wearOrder.indexOf(b.wears));
        break;
      case 'wearDesc':
        items.sort((a, b) => wearOrder.indexOf(b.wears) - wearOrder.indexOf(a.wears));
        break;
      default:
        break;
    }

    return items;
  }, [originalItems, filters, selectedWeaponType, sortOption]); // BUG FIX: `sortOption` is now a dependency.

  // Event Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const value = Number(e.target.value);
    setFilters((prev) => {
      const newRange = { ...prev.priceRange, [type]: value };
      // IMPROVEMENT: Validation logic is moved directly into the handler that causes the potential error.
      if (newRange.min > newRange.max) {
        setErrors((err) => ({ ...err, validation: 'Minimum fiyat, maksimumdan büyük olamaz.' }));
      } else {
        setErrors((err) => ({ ...err, validation: null })); // Clear the error if valid
      }
      return { ...prev, priceRange: newRange };
    });
  };

  const handleWearChange = (wear: string) => {
    setFilters((prev) => ({
      ...prev,
      wearFilters: { ...prev.wearFilters, [wear]: !prev.wearFilters[wear] },
    }));
  };

  const handleWeaponTypeChange = (type: string) => {
    setSelectedWeaponType((prevType) => (prevType === type ? null : type));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      priceRange: { min: 0, max: 10000 },
      wearFilters: defaultWearFilters,
    });
    setSelectedWeaponType(null);
    setSortOption('default');
    setErrors((prev) => ({ ...prev, validation: null })); // Clear only validation errors on reset
  };

  const handleCardClick = (item: Item) => setModalContent(item);
  const closeModal = () => setModalContent(null);

  const handlePurchase = async (itemToPurchase: Item) => {
    if (isPurchasing) return;
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

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Satın alma sırasında bir hata oluştu.');
      }

      alert(data.message || 'Ürün başarıyla satın alındı!');

      // IMPROVEMENT: Optimistic UI update for a smoother experience.
      // Remove the item immediately from the list without waiting for a full refetch.
      setOriginalItems((prevItems) => prevItems.filter((item) => item.id !== itemToPurchase.id));

      // Update user balance in localStorage
      const storedUserString = localStorage.getItem('user');
      if (storedUserString) {
        const userObject: StoredUser = JSON.parse(storedUserString);
        userObject.balance = Number(data.newBalance);
        localStorage.setItem('user', JSON.stringify(userObject));
        window.dispatchEvent(new CustomEvent('localStorageUserUpdated'));
      }
      
      closeModal(); // Close modal on successful purchase

    } catch (err: any) {
      alert(`Hata: ${err.message}`);
    } finally {
      setIsPurchasing(null);
    }
  };

  const getWearColorClass = (wear: string): string => {
    switch (wear) {
      case 'Factory New': return 'factory-new';
      case 'Minimal Wear': return 'minimal-wear';
      case 'Field-Tested': return 'field-tested';
      case 'Well-Worn': return 'well-worn';
      case 'Battle-Scarred': return 'battle-scarred';
      default: return 'text-light';
    }
  };

  // The JSX structure remains largely the same, but logic for displaying errors and items is simplified.
  return (
    <div className="container-fluid p-0 custom-background">
      <Navbar />
      {/* <ToastContainer /> */}

      <div className="weapon-type-container py-3">
        <div className="container-custom d-flex justify-content-center flex-wrap">
          {weaponTypes.map((type) => (
            <div
              key={type}
              role="button" // IMPROVEMENT: Accessibility for clickable divs
              tabIndex={0}  // IMPROVEMENT: Accessibility
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
          <div className="filter-container p-3 rounded bg-dark-filter">
            <h5 className="text-white mb-3">Filtrele</h5>
            <div className="mb-3">
              <label htmlFor="searchInput" className="form-label text-light small">İsim ile Ara</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text search-icon bg-secondary border-secondary">
                  <i className="bi bi-search text-white"></i>
                </span>
                <input
                  type="text"
                  id="searchInput"
                  className="form-control search-bar bg-secondary text-white border-secondary"
                  placeholder="Eşya arayın..."
                  value={filters.searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-light small">Fiyat Aralığı</label>
              <div className="d-flex justify-content-between">
                <input
                  type="number" className="form-control form-control-sm price-range bg-secondary text-white border-secondary"
                  min="0" max="10000" value={filters.priceRange.min}
                  onChange={(e) => handlePriceRangeChange(e, 'min')} style={{ width: '48%' }}
                />
                <input
                  type="number" className="form-control form-control-sm price-range bg-secondary text-white border-secondary"
                  min="0" max="10000" value={filters.priceRange.max}
                  onChange={(e) => handlePriceRangeChange(e, 'max')} style={{ width: '48%' }}
                />
              </div>
              {/* IMPROVEMENT: Display validation error right below the relevant input */}
              {errors.validation && <p className="text-danger small mt-2">{errors.validation}</p>}
            </div>

            <div className="mb-3">
              <label className="form-label text-light small">Aşınmışlık</label>
              <div className="d-flex flex-wrap">
                {Object.entries(wearCodes).map(([wear, code]) => (
                  <label key={wear} className="custom-wear-checkbox mb-1">
                    <input
                      type="checkbox"
                      checked={filters.wearFilters[wear] ?? true}
                      onChange={() => handleWearChange(wear)}
                    />
                    <span>{code}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="sort-select" className="form-label text-white small">Sırala</label>
              <select
                id="sort-select" // IMPROVEMENT: Add id for label association
                className="form-select form-select-sm order"
                value={sortOption}
                onChange={e => setSortOption(e.target.value as any)}
              >
                <option value="default">Varsayılan</option>
                <option value="priceAsc">Fiyata Göre (Artan)</option>
                <option value="priceDesc">Fiyata Göre (Azalan)</option>
                <option value="wearAsc">Aşınmışlığa Göre (Artan)</option>
                <option value="wearDesc">Aşınmışlığa Göre (Azalan)</option>
              </select>
            </div>
            
            <button className="reset-button" onClick={resetFilters}>
              Filtreyi Sıfırla
            </button>
          </div>
        </aside>

        <main className="col-12 col-md-9 col-lg-10 p-3">
          {/* IMPROVEMENT: Clear and centralized error display */}
          {errors.fetch && (
            <div className="alert alert-danger text-center">{errors.fetch}</div>
          )}

          <div className="row g-2" style={{ marginLeft: 34, marginRight: 8 }}>
            {filteredItems.length === 0 && !errors.fetch && (
              <div className="col-12">
                <p className="text-white text-center w-100 mt-5 h5">
                  Aramanıza uygun ürün bulunamadı.
                </p>
              </div>
            )}
            {filteredItems.map((item) => {
              const discountPercent =
                item.previous_price && item.price < item.previous_price
                  ? Math.round(((item.previous_price - item.price) / item.previous_price) * 100)
                  : 0;

              return (
                <div className="col-6 col-sm-4 col-md-3 col-lg-3 col-xl-2" key={item.id}>
                  <div className="card-items h-100 d-flex flex-column position-relative">
                    {discountPercent > 0 && (
                      <span
                        className="badge bg-success position-absolute top-0 end-0 m-1 shadow-sm"
                        style={{ zIndex: 1, fontSize: '0.65rem', padding: '0.3em 0.5em' }}
                        title={`Önceki Fiyat: $${item.previous_price?.toFixed(2)}`}
                      >
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
                          <h5 className="card-title custom-item-title">{item.name}</h5>
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
                        className="btn-purchase"
                        onClick={(e) => { e.stopPropagation(); handlePurchase(item); }}
                        disabled={isPurchasing === item.id || item.status === 'sold'}
                      >
                        {isPurchasing === item.id ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                         : item.status === 'sold' ? 'Satıldı' : 'Satın Al'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
      
      
      {/* Modal ve Backdrop */}
      {modalContent && (
        <>
          {/* 1️⃣ Backdrop */}
          <div className="modal-backdrop fade show"></div>

          {/* 2️⃣ Asıl Modal */}
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            role="dialog"
            onClick={closeModal}              // Overlay’a tıklayınca kapanır
            style={{ background: 'transparent' }} // Bootstrap default griyi kaldırır
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              onClick={e => e.stopPropagation()} // İçeriğe tıklayınca kapanmayı engeller
            >
              <div className="modal-content custom-modal-content">
                
                {/* Modal Başlık */}
                <div className="modal-header position-relative">
                <h5 className="modal-title">
                  {modalContent.name}{' '}
                  <span className={`rounded small ${getWearColorClass(modalContent.wears)}`}>
                    ({modalContent.wears})
                  </span>
                </h5>
                  <button
                    type="button"
                    className="btn-close position-absolute top-0 end-0 m-3"
                    onClick={closeModal}
                    aria-label="Close"
                  />
                </div>

                {/* Modal İçerik */}
                <div className="modal-body text-center">
                  <img
                    src={modalContent.image}
                    alt={modalContent.name}
                    className="img-fluid mb-3 custom-modal-img"
                  />

                  <p className="fw-bold mb-1">
                    Fiyat: <span className="text-white">${modalContent.price.toFixed(2)}</span>
                  </p>

                  {modalContent.previous_price && modalContent.price < modalContent.previous_price && (
                    <p className="small text-danger mb-3">
                      Önceki: <span className="text-decoration-line-through">
                        ${modalContent.previous_price.toFixed(2)}
                      </span>{' '}
                      <span className="badge bg-success">
                        %{Math.round(((modalContent.previous_price - modalContent.price) / modalContent.previous_price) * 100)} İNDİRİM
                      </span>
                    </p>
                  )}

                  <div className="d-flex justify-content-around mb-3">
                    <a
                      href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(
                        `${modalContent.name} (${modalContent.wears})`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="open-steam"
                    >
                      Steam Pazarı
                    </a>
                    {modalContent.inspect && (
                      <button
                        onClick={() => window.open(modalContent.inspect, '_blank')}
                        className="modal-inspect-btn"
                      >
                        İncele <i className="fas fa-search ms-1"></i>
                      </button>
                    )}
                  </div>

                  <button
                    className="modal-buy-btn"
                    onClick={() => handlePurchase(modalContent)}
                    disabled={isPurchasing === modalContent.id || modalContent.status === 'sold'}
                  >
                    {isPurchasing === modalContent.id
                      ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          İşleniyor...
                        </>
                      )
                      : (
                        modalContent.status === 'sold'
                          ? 'Bu Ürün Satılmış'
                          : `Satın Al ($${modalContent.price.toFixed(2)})`
                      )
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
