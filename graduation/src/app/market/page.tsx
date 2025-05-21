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

const wearCodes: Record<string, string> = {
  'Factory New': 'FN',
  'Minimal Wear': 'MW',
  'Field-Tested': 'FT',
  'Well-Worn': 'WW',
  'Battle-Scarred': 'BS',
};

export default function FilterComponent() {
  const [selectedFilters, setSelectedFilters] = useState({
    searchQuery: '',
    priceRange: { min: 0, max: 10000 },
    wearFilters: Object.keys(wearCodes).reduce((acc, wear) => ({ ...acc, [wear]: true }), {} as Record<string, boolean>),
  });
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<Item | null>(null);

  useEffect(() => {
    fetch('/api/items')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const processed = data.map(item => {
            const wearsArr = item.wears.split(',').map((w: string) => w.trim());
            const randomWear = wearsArr[Math.floor(Math.random() * wearsArr.length)];
            return { ...item, wears: randomWear };
          });
          setItems(processed);
          setFilteredItems(processed);
        } else {
          setError('Beklenmeyen veri formatı');
        }
      })
      .catch(() => setError('Veri çekme hatası'));
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSelectedFilters(prev => ({ ...prev, searchQuery: e.target.value }));

  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const value = Number(e.target.value);
    setSelectedFilters(prev => ({
      ...prev,
      priceRange: { ...prev.priceRange, [type]: value },
    }));
  };

  const handleWearChange = (wear: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      wearFilters: {
        ...prev.wearFilters,
        [wear]: !prev.wearFilters[wear],
      },
    }));
  };

  const applyFilters = () => {
    const { min, max } = selectedFilters.priceRange;
    if (min > max) {
      setError('Minimum fiyat maksimumdan büyük olamaz.');
      return;
    }
    setError(null);
    const filtered = items.filter(item => {
      const priceOk = item.price >= min && item.price <= max;
      const searchOk = item.name.toLowerCase().includes(selectedFilters.searchQuery.toLowerCase());
      const wearOk = selectedFilters.wearFilters[item.wears];
      return priceOk && searchOk && wearOk;
    });
    setFilteredItems(filtered);
  };

  const resetFilters = () => {
    setSelectedFilters(prev => ({
      ...prev,
      searchQuery: '',
      priceRange: { min: 0, max: 10000 },
      wearFilters: Object.keys(prev.wearFilters).reduce((acc, wear) => ({ ...acc, [wear]: true }), {} as Record<string, boolean>),
    }));
    setFilteredItems(items);
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
            {/* İsim filtresi */}
            <div className="mt-3">
              <label htmlFor="searchInput" className="custom-label">İsim ile Ara</label>
              <div className="input-group">
                <span className="input-group-text search-icon"><i className="bi bi-search" /></span>
                <input
                  type="text"
                  id="searchInput"
                  className="form-control search-bar"
                  placeholder="Eşya arayın..."
                  value={selectedFilters.searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            {/* Fiyat filtresi */}
            <div className="custom-label mt-3">
              <label>Fiyat Aralığı</label>
              <div className="d-flex justify-content-between">
                <input
                  type="number"
                  className="price-range mt-1"
                  min="0"
                  max="10000"
                  value={selectedFilters.priceRange.min}
                  onChange={e => handlePriceRangeChange(e, 'min')}
                  style={{ width: '48%' }}
                />
                <input
                  type="number"
                  className="price-range mt-1"
                  min="0"
                  max="10000"
                  value={selectedFilters.priceRange.max}
                  onChange={e => handlePriceRangeChange(e, 'max')}
                  style={{ width: '48%' }}
                />
              </div>
            </div>
            {/* Durum filtresi */}
            <div className="custom-label mt-3">
              <label>Aşınmışlık</label>
              <div className="d-flex flex-wrap">
                {Object.entries(wearCodes).map(([wear, code]) => (
                  <div key={wear} className="wear-checkbox">
                    <input
                      type="checkbox"
                      id={wear}
                      checked={selectedFilters.wearFilters[wear]}
                      onChange={() => handleWearChange(wear)}
                    />
                    <label htmlFor={wear}>{code}</label>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-primary apply-button mt-3" onClick={applyFilters}>Uygula</button>
            <button className="btn-primary reset-button mt-2" onClick={resetFilters}>Sıfırla</button>
            {error && <p className="text-danger mt-2">{error}</p>}
          </div>
        </aside>
        <main className="col-12 col-md-10 ps-5 pe-3">
          <div className="row g-3 m-0">
            {filteredItems.length === 0 && !error && (
              <p className="text-white text-center w-100 mt-4">Aramanıza uygun ürün bulunamadı.</p>
            )}
            {filteredItems.map((item, idx) => (
              <div className="col-6 col-md-4 col-lg-2" key={idx}>
                <div className="card-items h-100" style={{ cursor: 'pointer' }} onClick={() => handleCardClick(item)}>
                  <div className={`${wearCodes[item.wears]} px-2 py-1 mb-2 d-inline-block`}>{item.wears}</div>
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
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" role="document" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              {/* ... */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
