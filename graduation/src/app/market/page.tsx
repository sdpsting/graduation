// src/app/components/FilterComponent.tsx

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
};

function getWearColorClass(wear: string): string {
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
}

export default function FilterComponent() {
  const [selectedFilters, setSelectedFilters] = useState({
    searchQuery: '',
    priceRange: { min: 0, max: 10000 },
  });
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
      applyFilters(); // Enter tuşuna basıldığında filtreleri uygula
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
      return priceOk && searchOk;
    });
    setFilteredItems(filtered);
  };

  const resetFilters = () => {
    setSelectedFilters({
      searchQuery: '',
      priceRange: { min: 0, max: 10000 },
    });
    setFilteredItems(items); // Tüm öğeleri tekrar göster
  };

  const handleCardClick = (item: Item) => setModalContent(item);
  const closeModal = () => setModalContent(null);

  return (
    <div className="container-fluid p-0 custom-background">
      <Navbar />

      <div className="row m-0 g-0">
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
                  onKeyDown={handleSearchKeyDown} // Enter tuşu için olay ekledik
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
            <button className="btn-primary apply-button" onClick={applyFilters}>
              Uygula
            </button>
            <button
              className="btn-primary reset-button reset-button mt-2"
              onClick={resetFilters}
            >
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
          className="modal-overlay" // Yeni overlay sınıfını ekledik
          onClick={closeModal}
        >
          <div
            className="modal-dialog"
            role="document"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content"> {/* Bootstrap sınıflarını kaldırdık */}
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalContent.name}{' '}
                  <span className="fw-bold text-secondary">({modalContent.wears})</span>
                </h5>
                <button
                  type="button"
                  className="btn-close" // Bootstrap sınıfını kaldırdık
                  onClick={closeModal}
                />
              </div>
              <div className="modal-body text-center">
                <img
                  src={modalContent.image}
                  alt={modalContent.name}
                  className="img-fluid mb-3"
                />
                <p className="fw-bold text-white">Fiyat: ${modalContent.price}</p>
                <a
                  href={`https://steamcommunity.com/market/listings/730/${encodeURIComponent(
                    `${modalContent.name} (${modalContent.wears})`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary open-steam mt-3"
                >
                  Steam Market'te Aç
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
