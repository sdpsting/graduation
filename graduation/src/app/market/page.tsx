'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from 'src/app/components/navbar';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';

type Item = {
  id: string;
  name: string;
  image: string;
  wears: string;
  price: number;
  inspect: string;
  ingame: string;
  category_name?: string;
  status?: 'available' | 'sold' | string;
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
  const [selectedFilters, setSelectedFilters] = useState({
    searchQuery: '',
    priceRange: { min: 0, max: 10000 },
    wearFilters: defaultWearFilters,
  });
  const [selectedWeaponType, setSelectedWeaponType] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [originalItems, setOriginalItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<Item | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const fetchItems = useCallback(() => {
    fetch('/api/items')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: Item[]) => {
        if (Array.isArray(data)) {
          const processed = data.map((item: Item) => {
            const wearsString = typeof item.wears === 'string' ? item.wears : '';
            const wearsArr = wearsString
              .split(',')
              .map((w: string) => w.trim())
              .filter((w: string) => w.length > 0);
            let finalWear = 'N/A';
            if (wearsArr.length > 0) {
              finalWear = wearsArr[Math.floor(Math.random() * wearsArr.length)];
            }
            return { ...item, wears: finalWear };
          });
          setItems(processed); // Bu satır aslında gereksiz olabilir eğer originalItems'ı direkt kullanıyorsak
          setOriginalItems(processed);
          setFilteredItems(processed); // Başlangıçta hepsi görünsün
          setError(null);
        } else {
          console.error('Beklenmeyen veri formatı:', data);
          setError('Beklenmeyen veri formatı');
          setItems([]); setOriginalItems([]); setFilteredItems([]);
        }
      })
      .catch((err) => {
        console.error('Veri çekme hatası:', err);
        setError(`Veri çekme hatası: ${err.message}`);
        setItems([]); setOriginalItems([]); setFilteredItems([]);
      });
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filtreleri uygulama fonksiyonu (useCallback ile sarmalandı)
  const applyFilters = useCallback(() => {
    if (originalItems.length === 0) {
      setFilteredItems([]);
      return;
    }
    const { min, max } = selectedFilters.priceRange;
    if (min > max) {
      setError('Minimum fiyat maksimumdan büyük olamaz.');
      // Hata durumunda filtreli listeyi değiştirmeyebiliriz veya boşaltabiliriz
      // Şimdilik mevcut listeyi koruyalım veya originalItems'a döndürebiliriz
      // setFilteredItems(originalItems); 
      return;
    }
    setError(null);

    // console.log("Applying filters with state:", selectedFilters, "and weapon type:", selectedWeaponType);

    let tempFilteredItems = originalItems.filter((item) => {
      const priceOk = item.price >= min && item.price <= max;
      const searchOk = item.name
        .toLowerCase()
        .includes(selectedFilters.searchQuery.toLowerCase());
      const wearOk = selectedFilters.wearFilters[item.wears] !== undefined ? selectedFilters.wearFilters[item.wears] : true;
      const typeOk = selectedWeaponType ? item.category_name === selectedWeaponType : true;
      return priceOk && searchOk && wearOk && typeOk;
    });
    setFilteredItems(tempFilteredItems);
  }, [originalItems, selectedFilters, selectedWeaponType]); // Bağımlılıklar eklendi

  // Filtre state'leri değiştiğinde filtreleri otomatik uygula
  useEffect(() => {
    applyFilters();
  }, [applyFilters]); // applyFilters useCallback ile sarmalandığı için bu güvenli


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
    // Otomatik filtreleme useEffect tarafından yapılacak
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter ile anında filtreleme isteniyorsa applyFilters() çağrılabilir,
    // ama debounce daha iyi bir kullanıcı deneyimi sunar.
    // Şimdilik, useEffect zaten arama metni değiştikçe filtreleyecektir.
    // if (e.key === 'Enter') {
    //   applyFilters();
    // }
  };

  const handlePriceRangeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'min' | 'max'
  ) => {
    const value = Number(e.target.value);
    setSelectedFilters((prev) => ({
      ...prev,
      priceRange: { ...prev.priceRange, [type]: value },
    }));
    // Otomatik filtreleme useEffect tarafından yapılacak
  };

  const handleWearChange = (wear: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      wearFilters: {
        ...prev.wearFilters,
        [wear]: !prev.wearFilters[wear],
      },
    }));
    // Otomatik filtreleme useEffect tarafından yapılacak
  };

  const handleWeaponTypeChange = (type: string) => {
    setSelectedWeaponType((prevType) => (prevType === type ? null : type));
    // Otomatik filtreleme useEffect tarafından yapılacak
  };

  const resetFilters = () => {
    setSelectedFilters({
      searchQuery: '',
      priceRange: { min: 0, max: 10000 },
      wearFilters: defaultWearFilters,
    });
    setSelectedWeaponType(null);
    // setFilteredItems(originalItems); // Bu satır gereksiz, useEffect tetiklenecek
    setError(null);
  };

  const handleCardClick = (item: Item) => setModalContent(item);
  const closeModal = () => setModalContent(null);

  const handlePurchase = async (itemToPurchase: Item) => {
    if (isPurchasing) return;
    setIsPurchasing(itemToPurchase.id);
    setError(null);
    const token = localStorage.getItem('token'); // ANAHTARIN DOĞRU OLDUĞUNDAN EMİN OLUN
    // console.log('Token from localStorage for purchase:', token);

    if (!token) {
      setError('Satın alma yapmak için lütfen giriş yapın.');
      alert('Satın alma yapmak için lütfen giriş yapın.');
      setIsPurchasing(null);
      return;
    }
    try {
      const response = await fetch(`/api/market/purchase/${itemToPurchase.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // console.log('Satın alma başarılı:', data);
        alert(data.message || 'Ürün başarıyla satın alındı!');
        fetchItems();
        if (modalContent && modalContent.id === itemToPurchase.id) {
            closeModal();
        }
      } else {
        // console.error('Satın alma başarısız:', data.message);
        setError(data.message || 'Satın alma sırasında bir hata oluştu.');
        alert(data.message || 'Satın alma sırasında bir hata oluştu.');
      }
    } catch (err: any) {
      // console.error('Satın alma API isteği hatası:', err);
      setError(`Ağ hatası: ${err.message || 'Sunucuya ulaşılamıyor.'}`);
      alert(`Ağ hatası: ${err.message || 'Sunucuya ulaşılamıyor.'}`);
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
      default: return 'text-white';
    }
  };

  return (
    <div className="container-fluid p-0 custom-background">
      <Navbar />
      {/* <ToastContainer position="top-right" autoClose={3000} /> */}

      <div className="weapon-type-container">
        {weaponTypes.map((type) => (
          <div
            key={type}
            className={`small-box ${selectedWeaponType === type ? 'active-box' : ''}`}
            onClick={() => handleWeaponTypeChange(type)}>
            {type}
          </div>
        ))}
      </div>

      <div className="row m-0 g-0" style={{ marginTop: '60px' }}>
        <aside className="col-12 col-md-2 p-4">
          <div className="filter-container text-white">
            <h5>Filtrele</h5>
            <div className="mt-3">
              <label htmlFor="searchInput" className="custom-label">İsim ile Ara</label>
              <div className="input-group">
                <span className="input-group-text search-icon">
                  <i className="bi bi-search"></i> {/* Bootstrap icon, projenize ekli olmalı */}
                </span>
                <input
                  type="text"
                  id="searchInput"
                  className="form-control search-bar"
                  placeholder="Eşya arayın..."
                  value={selectedFilters.searchQuery}
                  onChange={handleSearchChange}
                  // onKeyDown={handleSearchKeyDown} // Arama için anında filtreleme yapıyoruz
                />
              </div>
            </div>

            <div className="custom-label mt-3">
              <label>Fiyat Aralığı</label>
              <div className="d-flex justify-content-between">
                <input
                  type="number"
                  className="price-range mt-1"
                  min="0"
                  max="10000"
                  value={selectedFilters.priceRange.min}
                  onChange={(e) => handlePriceRangeChange(e, 'min')}
                  style={{ width: '48%' }}
                />
                <input
                  type="number"
                  className="price-range mt-1"
                  min="0"
                  max="10000"
                  value={selectedFilters.priceRange.max}
                  onChange={(e) => handlePriceRangeChange(e, 'max')}
                  style={{ width: '48%' }}
                />
              </div>
            </div>

            <div className="custom-label mt-3">
              <label>Aşınmışlık</label>
              <div className="d-flex flex-wrap">
                {Object.entries(wearCodes).map(([wear, code]) => (
                  <div key={wear} className="wear-checkbox me-2">
                    <input
                      type="checkbox"
                      id={wear}
                      checked={selectedFilters.wearFilters[wear] === undefined ? true : selectedFilters.wearFilters[wear]}
                      onChange={() => handleWearChange(wear)}
                    />
                    <label htmlFor={wear} className="">{code}</label>
                  </div>
                ))}
              </div>
            </div>

            {/* "Uygula" butonu kaldırıldı, otomatik filtreleme var */}
            {/* <button className="btn-primary apply-button mt-3" onClick={applyFilters}>
              Uygula
            </button> */}
            <button className="btn-primary reset-button mt-2" onClick={resetFilters}>
              Filtreyi Sıfırla
            </button>
            {error && <p className="text-danger mt-2">{error}</p>}
          </div>
        </aside>

        <main className="col-12 col-md-10 ps-5 pe-3">
          <div className="row g-3 m-0">
            {filteredItems.length === 0 && !error && (
              <p className="text-white text-center w-100 mt-4">
                Aramanıza uygun ürün bulunamadı.
              </p>
            )}
            {filteredItems.map((item) => (
              <div className="col-6 col-md-4 col-lg-2" key={item.id}>
                <div className="card-items h-100 d-flex flex-column">
                  <div onClick={() => handleCardClick(item)} style={{ cursor: 'pointer' }}>
                    <div className={`${getWearColorClass(item.wears)} px-2 py-1 mb-2 d-inline-block`}>
                      {item.wears}
                    </div>
                    <img src={item.image} className="card-img-top" alt={item.name} />
                    <div className="card-body pb-0">
                        <h5 className="card-title">{item.name}</h5>
                        <p className="card-text fw-bold text-white">Fiyat: ${item.price}</p>
                    </div>
                  </div>
                  <div className="card-footer p-2 mt-auto">
                    <button 
                      className="btn btn-success w-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePurchase(item);
                      }}
                      disabled={isPurchasing === item.id || item.status === 'sold'}
                    >
                      {isPurchasing === item.id ? 'İşleniyor...' : (item.status === 'sold' ? 'Satıldı' : 'Satın Al')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {modalContent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalContent.name}{' '}
                  <span style={{ fontWeight: 'bold', color: '#adb5bd' }}>
                    ({modalContent.wears})
                  </span>
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close"/>
              </div>
              <div className="modal-body">
                <img src={modalContent.image} alt={modalContent.name} style={{ maxWidth: '100%', marginBottom: '1rem', borderRadius: '4px' }}/>
                <p style={{ fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
                  Fiyat: ${modalContent.price}
                </p>
                <div className="button-group">
                  <a href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(`${modalContent.name} (${modalContent.wears})`)}`}
                     target="_blank" rel="noopener noreferrer" className="open-steam">
                    Steam Market'te Aç
                  </a>
                  <button onClick={() => window.open(modalContent.inspect, '_blank')} className="custom-btn">
                    <i className="fas fa-camera"></i> {/* FontAwesome ikonu, projenize ekli olmalı */}
                  </button>
                  <button onClick={() => window.open(modalContent.ingame, '_blank')} className="custom-btn">
                    <i className="fas fa-search"></i> {/* FontAwesome ikonu, projenize ekli olmalı */}
                  </button>
                </div>
                <button 
                  className="btn btn-primary w-100 mt-3"
                  onClick={() => handlePurchase(modalContent)}
                  disabled={isPurchasing === modalContent.id || modalContent.status === 'sold'}
                >
                  {isPurchasing === modalContent.id 
                    ? 'İşleniyor...' 
                    : (modalContent.status === 'sold' 
                        ? 'Bu Ürün Satılmış' 
                        : `Bu Ürünü Satın Al ($${modalContent.price})`)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}