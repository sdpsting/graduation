'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect, useCallback } from 'react';
import Navbar from 'src/app/components/navbar'; // Navbar importu
// import { toast, ToastContainer } from 'react-toastify'; // Opsiyonel bildirimler için
// import 'react-toastify/dist/ReactToastify.css';

// Item tipine previous_price ve seller_id eklendi
type Item = {
  id: string;
  name: string;
  image: string;
  wears: string;
  price: number; // Güncel satış fiyatı
  previous_price?: number | null; // Önceki satış fiyatı (indirim için)
  inspect: string;
  ingame: string;
  category_name?: string;
  seller_id?: number | null; // Satıcı ID'si
  status?: 'available' | 'sold' | string;
};

// Navbar'dan gelen StoredUser tipi (veya burada tanımlayabilirsiniz)
type StoredUser = {
  id: number;
  name: string;
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
  const [selectedFilters, setSelectedFilters] = useState({
    searchQuery: '',
    priceRange: { min: 0, max: 10000 },
    wearFilters: defaultWearFilters,
  });
  const [selectedWeaponType, setSelectedWeaponType] = useState<string | null>(null);
  const [originalItems, setOriginalItems] = useState<Item[]>([]); // Sadece originalItems'ı tutalım
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<Item | null>(null);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  const fetchItems = useCallback(() => {
    setError(null);
    fetch('/api/items') // Bu API artık previous_price ve seller_id döndürmeli
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: Item[]) => {
        if (Array.isArray(data)) {
          const processed = data.map((item: Item) => {
            const currentPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
            const previousPriceNum = item.previous_price === null || item.previous_price === undefined 
                                    ? null 
                                    : (typeof item.previous_price === 'string' 
                                        ? parseFloat(item.previous_price) 
                                        : item.previous_price);

            const wearsString = typeof item.wears === 'string' ? item.wears : '';
            const wearsArr = wearsString
              .split(',')
              .map((w: string) => w.trim())
              .filter((w: string) => w.length > 0);
            let finalWear = 'N/A';
            if (wearsArr.length > 0) {
              finalWear = wearsArr[Math.floor(Math.random() * wearsArr.length)];
            }
            return { 
                ...item, 
                wears: finalWear,
                price: isNaN(currentPrice) ? 0 : currentPrice,
                previous_price: previousPriceNum === null || isNaN(previousPriceNum) ? null : previousPriceNum
            };
          });
          setOriginalItems(processed);
          // setFilteredItems(processed); // Bu, applyFilters tarafından ilk useEffect'te yapılacak
        } else {
          console.error('Beklenmeyen veri formatı:', data);
          setError('Beklenmeyen veri formatı');
          setOriginalItems([]); 
          setFilteredItems([]);
        }
      })
      .catch((err) => {
        console.error('Veri çekme hatası:', err);
        setError(`Veri çekme hatası: ${err.message}`);
        setOriginalItems([]); 
        setFilteredItems([]);
      });
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const applyFilters = useCallback(() => {
    // Veri çekme hatası varsa veya originalItems henüz boşsa filtreleme yapma
    if (error && error.toLowerCase().includes("veri çekme hatası")) {
        setFilteredItems([]);
        return;
    }
    if (originalItems.length === 0 && !error) { // Henüz veri yok ama hata da yoksa (ilk yükleme)
        setFilteredItems([]); // veya originalItems (boş dizi)
        return;
    }
    
    const { min, max } = selectedFilters.priceRange;
    if (min > max) {
      // Sadece fiyat aralığı hatasını ayarla, diğer filtreleri etkileme
      if (!error || !error.toLowerCase().includes("minimum fiyat")) { // Mevcut hata farklıysa güncelle
        setError('Minimum fiyat maksimumdan büyük olamaz.');
      }
      // Bu durumda filtreli listeyi değiştirmeyebiliriz veya kullanıcıyı uyarıp mevcut listeyi koruyabiliriz.
      // Şimdilik, fiyat aralığı hatalıysa filtreli listeyi güncelleme.
      return; 
    }
    // Fiyat aralığı doğruysa veya başka bir filtreleme hatası yoksa error'u temizle
    // Sadece fiyat aralığı hatasını temizle, veri çekme hatası kalabilir.
    if (error && error.toLowerCase().includes("minimum fiyat")) {
        setError(null);
    }


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
  }, [originalItems, selectedFilters, selectedWeaponType, error]); // error'u dependency'ye ekledik

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFilters((prev) => ({ ...prev, searchQuery: e.target.value }));
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Otomatik filtreleme zaten var, bu fonksiyon boş kalabilir veya kaldırılabilir
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
  };

  const handleWearChange = (wear: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      wearFilters: {
        ...prev.wearFilters,
        [wear]: !prev.wearFilters[wear],
      },
    }));
  };

  const handleWeaponTypeChange = (type: string) => {
    setSelectedWeaponType((prevType) => (prevType === type ? null : type));
  };

  const resetFilters = () => {
    setSelectedFilters({
      searchQuery: '',
      priceRange: { min: 0, max: 10000 },
      wearFilters: defaultWearFilters,
    });
    setSelectedWeaponType(null);
    // Sadece filtreleme ile ilgili error'u temizle, veri çekme hatası kalabilir
    if (error && error.toLowerCase().includes("minimum fiyat")) {
        setError(null);
    }
    // filteredItems otomatik olarak useEffect ile güncellenecek
  };

  const handleCardClick = (item: Item) => setModalContent(item);
  const closeModal = () => setModalContent(null);

  const handlePurchase = async (itemToPurchase: Item) => {
    if (isPurchasing) return;
    setIsPurchasing(itemToPurchase.id);
    setError(null); 
    const token = localStorage.getItem('token');

    if (!token) {
      const errMsg = 'Satın alma yapmak için lütfen giriş yapın.';
      setError(errMsg);
      alert(errMsg); // Basit bildirim
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
        alert(data.message || 'Ürün başarıyla satın alındı!'); // Basit bildirim
        
        // localStorage'daki kullanıcı verisini güncelle ve Navbar'ı tetikle
        const storedUserString = localStorage.getItem('user');
        if (storedUserString) {
            try {
                const userObject: StoredUser = JSON.parse(storedUserString);
                const newBalanceValue = typeof data.newBalance === 'string' 
                                        ? parseFloat(data.newBalance) 
                                        : data.newBalance;

                if (typeof newBalanceValue === 'number' && !isNaN(newBalanceValue)) {
                    userObject.balance = newBalanceValue;
                    localStorage.setItem('user', JSON.stringify(userObject));
                    window.dispatchEvent(new CustomEvent('localStorageUserUpdated'));
                }
            } catch (e) {
                console.error("Kullanıcı verisi güncellenirken localStorage parse hatası:", e);
            }
        }
        
        fetchItems(); // Market listesini yenile (satın alınan item listeden kalkmalı)
        if (modalContent && modalContent.id === itemToPurchase.id) {
            closeModal();
        }
      } else {
        const errMsg = data.message || 'Satın alma sırasında bir hata oluştu.';
        setError(errMsg);
        alert(errMsg); // Basit bildirim
      }
    } catch (err: any) {
      const errMsg = `Ağ hatası: ${err.message || 'Sunucuya ulaşılamıyor.'}`;
      setError(errMsg);
      alert(errMsg); // Basit bildirim
    } finally {
      setIsPurchasing(null);
    }
  };

  const getWearColorClass = (wear: string): string => {
    switch (wear) {
      case 'Factory New': return 'text-success fw-bold'; // Bootstrap class'ları örnek
      case 'Minimal Wear': return 'text-primary';
      case 'Field-Tested': return 'text-info';
      case 'Well-Worn': return 'text-warning';
      case 'Battle-Scarred': return 'text-danger';
      default: return 'text-light'; // Veya text-white
    }
  };


  return (
    <div className="container-fluid p-0 custom-background">
      <Navbar />
      {/* <ToastContainer /> Eğer kullanıyorsanız */}

      <div className="weapon-type-container py-3 bg-dark-subtle"> {/* Stil eklendi */}
        <div className="container d-flex justify-content-center flex-wrap"> {/* Ortalamak için container */}
            {weaponTypes.map((type) => (
            <div
                key={type}
                className={`small-box p-2 m-1 border rounded ${selectedWeaponType === type ? 'active-weapon-box' : 'inactive-weapon-box'}`}
                onClick={() => handleWeaponTypeChange(type)}
                style={{cursor: 'pointer', minWidth: '80px', textAlign: 'center' }} // Stil eklendi
            >
                {type}
            </div>
            ))}
        </div>
      </div>

      <div className="row m-0 g-0" style={{ marginTop: '1rem' }}> {/* marginTop azaltıldı */}
        <aside className="col-12 col-md-3 col-lg-2 p-3"> {/* Boyutlar biraz ayarlandı */}
          <div className="filter-container p-3 rounded bg-dark-filter"> {/* Arkaplan ve padding eklendi */}
            <h5 className="text-white mb-3">Filtrele</h5>
            <div className="mb-3"> {/* mt-3 -> mb-3 */}
              <label htmlFor="searchInput" className="form-label text-light small">İsim ile Ara</label> {/* form-label ve small class */}
              <div className="input-group input-group-sm"> {/* input-group-sm eklendi */}
                <span className="input-group-text search-icon bg-secondary border-secondary"> {/* Stil eklendi */}
                  <i className="bi bi-search text-white"></i>
                </span>
                <input
                  type="text"
                  id="searchInput"
                  className="form-control search-bar bg-secondary text-white border-secondary" /* Stil eklendi */
                  placeholder="Eşya arayın..."
                  value={selectedFilters.searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-light small">Fiyat Aralığı</label>
              <div className="d-flex justify-content-between">
                <input
                  type="number" className="form-control form-control-sm price-range bg-secondary text-white border-secondary" /* Stil eklendi */
                  min="0" max="10000" value={selectedFilters.priceRange.min}
                  onChange={(e) => handlePriceRangeChange(e, 'min')} style={{ width: '48%' }}
                />
                <input
                  type="number" className="form-control form-control-sm price-range bg-secondary text-white border-secondary" /* Stil eklendi */
                  min="0" max="10000" value={selectedFilters.priceRange.max}
                  onChange={(e) => handlePriceRangeChange(e, 'max')} style={{ width: '48%' }}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-light small">Aşınmışlık</label>
              <div className="d-flex flex-wrap">
                {Object.entries(wearCodes).map(([wear, code]) => (
                  <div key={wear} className="form-check me-2 mb-1"> {/* form-check ve mb-1 eklendi */}
                    <input
                      className="form-check-input" type="checkbox" id={wear} // form-check-input eklendi
                      checked={selectedFilters.wearFilters[wear] === undefined ? true : selectedFilters.wearFilters[wear]}
                      onChange={() => handleWearChange(wear)}
                    />
                    <label htmlFor={wear} className="form-check-label text-light small">{code}</label> {/* form-check-label ve small */}
                  </div>
                ))}
              </div>
            </div>
            
            <button className="btn btn-outline-secondary btn-sm w-100 mt-2" onClick={resetFilters}> {/* Stil güncellendi */}
              Filtreyi Sıfırla
            </button>
            {error && !error.toLowerCase().includes("veri çekme hatası") && 
                !error.toLowerCase().includes("minimum fiyat") && // Sadece diğer filtre hatalarını göster
                <p className="text-danger small mt-2">{error}</p>
            }
          </div>
        </aside>

        <main className="col-12 col-md-9 col-lg-10 p-3"> {/* ps-md-3 pe-md-3 p-2 -> p-3 */}
          {error && error.toLowerCase().includes("veri çekme hatası") && (
            <div className="alert alert-danger text-center">{error}</div>
          )}
          {error && error.toLowerCase().includes("minimum fiyat") && ( // Fiyat aralığı hatasını burada göster
            <div className="alert alert-warning text-center">{error}</div>
          )}
          <div className="row g-3 m-0"> {/* g-3 itemlar arası boşluk */}
            {filteredItems.length === 0 && !error && (
              <div className="col-12">
                <p className="text-white text-center w-100 mt-5 h5"> {/* mt-5 h5 eklendi */}
                  Aramanıza uygun ürün bulunamadı.
                </p>
              </div>
            )}
            {filteredItems.map((item) => {
              const discountPercent = 
                item.previous_price && 
                typeof item.price === 'number' &&
                typeof item.previous_price === 'number' && 
                item.price < item.previous_price
                ? Math.round(((item.previous_price - item.price) / item.previous_price) * 100)
                : 0;

              return (
                <div className="col-6 col-sm-4 col-md-3 col-lg-3 col-xl-2" key={item.id}> {/* Responsive grid ayarı */}
                  <div className="card-items h-100 d-flex flex-column position-relative">
                    {discountPercent > 0 && (
                      <span 
                        className="badge bg-danger position-absolute top-0 end-0 m-1 shadow-sm" // shadow-sm eklendi
                        style={{zIndex: 1, fontSize: '0.65rem', padding: '0.3em 0.5em'}}
                        title={`Önceki Fiyat: $${item.previous_price?.toFixed(2)}`}
                      >
                        %{discountPercent} İNDİRİM
                      </span>
                    )}
                    
                    <div onClick={() => handleCardClick(item)} style={{ cursor: 'pointer' }} className="flex-grow-1 d-flex flex-column text-decoration-none"> {/* text-decoration-none eklendi */}
                      <div className={`px-2 py-1 mb-1 d-inline-block align-self-start rounded-top small ${getWearColorClass(item.wears)}`}>
                        {item.wears}
                      </div>
                      <div className="text-center px-1"> {/* Resim için ortalama ve padding */}
                        <img src={item.image} className="card-img-top" alt={item.name} style={{maxHeight: '100px', objectFit: 'contain', width: 'auto'}} />
                      </div>
                      <div className="card-body p-2 d-flex flex-column flex-grow-1">
                          <h5 className="card-title text-white" style={{ fontSize: '0.8rem', minHeight: '2.4em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom:'0.25rem' }}>
                              {item.name}
                          </h5>
                          <div className="mt-auto">
                            <p className="card-text fw-bold text-warning mb-0" style={{fontSize: '0.9rem'}}> {/* text-warning eklendi */}
                                ${typeof item.price === 'number' ? item.price.toFixed(2) : 'N/A'}
                            </p>
                            {discountPercent > 0 && item.previous_price && (
                                <p className="card-text small text-muted text-decoration-line-through mb-1" style={{fontSize: '0.7rem'}}>
                                    ${item.previous_price.toFixed(2)}
                                </p>
                            )}
                          </div>
                      </div>
                    </div>
                    <div className="card-footer p-2 bg-transparent border-top-0"> {/* Stil güncellendi */}
                      <button 
                        className="btn btn-sm w-100" // btn-sm eklendi
                        style={{backgroundColor: '#28a745', color: 'white', borderColor: '#28a745'}} // Özel yeşil buton
                        onClick={(e) => { e.stopPropagation(); handlePurchase(item);}}
                        disabled={isPurchasing === item.id || item.status === 'sold'}
                      >
                        {isPurchasing === item.id ? (<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>)
                         : (item.status === 'sold' ? 'Satıldı' : 'Satın Al')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Modal */}
      {modalContent && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-dark text-white">
              <div className="modal-header border-secondary">
                <h5 className="modal-title">
                  {modalContent.name}{' '}
                  <span style={{ fontWeight: 'normal', color: '#adb5bd', fontSize: '0.9em' }}> 
                    ({modalContent.wears})
                  </span>
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal} aria-label="Close"/>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                    <img src={modalContent.image} alt={modalContent.name} style={{ maxHeight: '250px', maxWidth: '100%', objectFit: 'contain', borderRadius: '4px' }}/>
                </div>
                <p style={{ fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Fiyat: <span className="text-warning">${typeof modalContent.price === 'number' ? modalContent.price.toFixed(2) : 'N/A'}</span>
                </p>
                {modalContent.previous_price && typeof modalContent.price === 'number' && modalContent.price < modalContent.previous_price && (
                    <p className="small text-muted">Önceki Fiyat: <span className="text-decoration-line-through">${modalContent.previous_price.toFixed(2)}</span>
                        <span className="badge bg-danger ms-2">
                            %{Math.round(((modalContent.previous_price - modalContent.price) / modalContent.previous_price) * 100)} İNDİRİM
                        </span>
                    </p>
                )}
                <div className="d-flex justify-content-around my-3">
                  <a href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(`${modalContent.name} (${modalContent.wears})`)}`}
                     target="_blank" rel="noopener noreferrer" className="btn btn-outline-info btn-sm">
                    Steam Pazarı
                  </a>
                  {modalContent.inspect && <button onClick={() => window.open(modalContent.inspect, '_blank')} className="btn btn-outline-light btn-sm">
                    İncele <i className="fas fa-search small"></i>
                  </button>}
                </div>
                <button 
                  className="btn btn-primary w-100 mt-2"
                  onClick={() => handlePurchase(modalContent)}
                  disabled={isPurchasing === modalContent.id || modalContent.status === 'sold'}
                >
                  {isPurchasing === modalContent.id 
                    ? (<><span className="spinner-border spinner-border-sm"></span> İşleniyor...</>)
                    : (modalContent.status === 'sold' 
                        ? 'Bu Ürün Satılmış' 
                        : `Satın Al ($${typeof modalContent.price === 'number' ? modalContent.price.toFixed(2) : 'N/A'})`)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
        .custom-background { background-color: #12181b; color: #e0e0e0; }
        .navbar-background { background-color: #1a1d24 !important; border-bottom: 1px solid #2c323a; }
        .navbar-background .nav-link { color: #c0c0c0 !important; }
        .navbar-background .nav-link:hover { color: #ffffff !important; }
        .navbar-brand img:hover { transform: scale(1.1); }
        .balance-container .balance-label { font-size: 0.75rem; color: #a0a0a0; }
        .balance-container .balance-amount { font-size: 0.9rem; color: #28a745; /* Yeşil bakiye */ }

        .weapon-type-container .small-box {
            background-color: #2a2a3e; color: #c0c0c0;
            transition: background-color 0.2s, color 0.2s, transform 0.1s;
        }
        .weapon-type-container .small-box:hover { background-color: #3a3a5e; color: white; transform: translateY(-2px); }
        .weapon-type-container .active-weapon-box { background-color: #ffc107; color: #212529; font-weight: bold; }
        
        .filter-container { background-color: #1f2933; } /* Filtre arkaplanı */
        .filter-container .form-control, .filter-container .input-group-text {
             background-color: #2a3b49 !important; color: #e0e0e0 !important; border-color: #323f4b !important;
        }
        .filter-container .form-control::placeholder { color: #868e96; }
        .filter-container .form-check-input:checked { background-color: #ffc107; border-color: #ffc107; }
        .btn-primary.reset-button { background-color: #6c757d; border-color: #6c757d; }
        .btn-primary.reset-button:hover { background-color: #5a6268; border-color: #545b62; }

        .card-items { background-color: #1f2933; border: 1px solid #323f4b; }
        .card-items:hover { transform: translateY(-4px); box-shadow: 0 6px 12px rgba(0,0,0,0.25); }
        .card-items.position-relative .badge { z-index: 2;}

        .modal-content.bg-dark { background-color: #1f2933 !important; }
        .modal-header.border-secondary { border-bottom-color: #323f4b !important; }
        .btn-close-white { filter: invert(1) grayscale(100%) brightness(200%); }

        .factory-new { color: #6a9ff3 !important; font-weight: bold; }
        .minimal-wear { color: #87ceeb !important; font-weight: bold; }
        .field-tested { color: #ffab40 !important; font-weight: bold; } /* Daha canlı turuncu */
        .well-worn { color: #d2691e !important; font-weight: bold; }
        .battle-scarred { color: #dc3545 !important; font-weight: bold; } /* Bootstrap danger rengi */
      `}</style>
    </div>
  );
}