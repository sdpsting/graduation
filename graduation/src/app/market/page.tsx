'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar';

// Item tipini tanımlıyoruz
type Item = {
  name: string;
  image: string;
  wears: string;
  price: number;
  inspect: string;
  ingame: string;
};

// Aşınmışlık kodları ve varsayılan filtre değeri
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

// Silah tipleri
const weaponTypes = ['Gloves', 'Heavy', 'Knives', 'Pistols', 'Rifles', 'SMGs'];

export default function FilterComponent() {
  const [selectedFilters, setSelectedFilters] = useState({
    searchQuery: '',
    priceRange: { min: 0, max: 10000 },
    wearFilters: defaultWearFilters,
  });
  const [selectedWeaponType, setSelectedWeaponType] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<Item | null>(null);

  useEffect(() => {
    fetch('/api/items')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const processed = data.map((item) => {
            const wearsArr = item.wears.split(',').map((w: string) => w.trim());
            const randomWear = wearsArr[Math.floor(Math.random() * wearsArr.length)];
            return { ...item, wears: randomWear };
          });
          setItems(processed);
          setFilteredItems(processed);
          setError(null);
        } else {
          setError('Beklenmeyen veri formatı');
          setItems([]);
        }
      })
      .catch(() => {
        setError('Veri çekme hatası');
        setItems([]);
      });
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedFilters((prev) => ({ ...prev, searchQuery: e.target.value }));

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
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
    setSelectedWeaponType((prev) => (prev === type ? null : type));
  };

  const applyFilters = () => {
    const { min, max } = selectedFilters.priceRange;
    if (min > max) {
      setError('Minimum fiyat maksimumdan büyük olamaz.');
      return;
    }
    setError(null);
    const filtered = items.filter((item) => {
      const priceOk = item.price >= min && item.price <= max;
      const searchOk = item.name
        .toLowerCase()
        .includes(selectedFilters.searchQuery.toLowerCase());
      const wearOk = selectedFilters.wearFilters[item.wears];
      // Eğer bir silah tipi seçildiyse, item.type ile eşleşmesi gerekir
      const typeOk = selectedWeaponType ? item.name.includes(selectedWeaponType) : true;
      return priceOk && searchOk && wearOk && typeOk;
    });
    setFilteredItems(filtered);
  };

  const resetFilters = () => {
    setSelectedFilters({
      searchQuery: '',
      priceRange: { min: 0, max: 10000 },
      wearFilters: defaultWearFilters,
    });
    setSelectedWeaponType(null);
    setFilteredItems(items);
    setError(null);
  };

  const handleCardClick = (item: Item) => setModalContent(item);
  const closeModal = () => setModalContent(null);

  const getWearColorClass = (wear: string): string => {
    switch (wear) {
      case 'Factory New':
        return 'factory-new';
      case 'Minimal Wear':
        return 'minimal-wear';
      case 'Field-Tested':
        return 'field-tested';
      case 'Well-Worn':
        return 'well-worn';
      case 'Battle-Scarred':
        return 'battle-scarred';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="container-fluid p-0 custom-background">
      <Navbar />

      {/* Silah Türü Seçim Kutusu */}
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
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  id="searchInput"
                  className="form-control search-bar"
                  placeholder="Eşya arayın..."
                  value={selectedFilters.searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
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

            {/* Durum filtresi */}
            <div className="custom-label mt-3">
              <label>Aşınmışlık</label>
              <div className="d-flex flex-wrap">
                {Object.entries(wearCodes).map(([wear, code]) => (
                  <div key={wear} className="wear-checkbox me-2">
                    <input
                      type="checkbox"
                      id={wear}
                      checked={selectedFilters.wearFilters[wear]}
                      onChange={() => handleWearChange(wear)}
                    />
                    <label htmlFor={wear} className="">{code}</label>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary apply-button mt-3" onClick={applyFilters}>
              Uygula
            </button>
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
            {filteredItems.map((item, idx) => (
              <div className="col-6 col-md-4 col-lg-2" key={idx}>
                <div
                  className="card-items h-100"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleCardClick(item)}
                >
                  <div className={`${getWearColorClass(item.wears)} px-2 py-1 mb-2 d-inline-block`}>
                    {item.wears}
                  </div>
                  <img src={item.image} className="card-img-top" alt={item.name} />
                  <div className="card-body">
                    <h5 className="card-title">{item.name}</h5>
                    <p className="card-text fw-bold text-white">Fiyat: ${item.price}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {modalContent && (
        <div
          className="modal-overlay"
          onClick={closeModal}
        >
          <div
            className="modal-dialog"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalContent.name}{' '}
                  <span style={{ fontWeight: 'bold', color: '#adb5bd' }}>
                    ({modalContent.wears})
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <img
                  src={modalContent.image}
                  alt={modalContent.name}
                  style={{ maxWidth: '100%', marginBottom: '1rem', borderRadius: '4px' }}
                />
                <p style={{ fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
                  Fiyat: ${modalContent.price}
                </p>
                <div className="button-group">
                  <a
                    href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(
                      `${modalContent.name} (${modalContent.wears})`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="open-steam"
                  >
                    Steam Market'te Aç
                  </a>
                  <button
                    onClick={() => window.open(modalContent.inspect, '_blank')}
                    className="custom-btn"
                  >
                    <i className="fas fa-camera"></i>
                  </button>
                  <button
                    onClick={() => window.open(modalContent.ingame, '_blank')}
                    className="custom-btn"
                  >
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
