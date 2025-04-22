'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar'; // Navbar component'ini buraya dahil ettik

type Item = {
  name: string;
  image: string;
  wears: string;
  price: number; // Price alanı eklendi
};

export default function FilterComponent() {
  const [selectedFilters, setSelectedFilters] = useState({
    searchQuery: '',
    priceRange: { min: 0, max: 1000 },
  });

  const [user, setUser] = useState<{ name: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]); // Filtrelenmiş ürünler için yeni state
  const [error, setError] = useState<string | null>(null);
  const [modalContent, setModalContent] = useState<Item | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetch('/api/items')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const processedItems = data.map(item => {
            const wearsArray: string[] = item.wears.split(',').map((wear: string) => wear.trim());
            const randomWear = wearsArray[Math.floor(Math.random() * wearsArray.length)];
            return {
              ...item,
              wears: randomWear,
              price: item.price, // Price bilgisi eklendi
            };
          });
          setItems(processedItems);
          setFilteredItems(processedItems); // Başlangıçta tüm ürünleri göster
          setError(null);
        } else {
          console.error('Beklenmeyen veri formatı:', data);
          setError('Beklenmeyen veri formatı');
          setItems([]);
        }
      })
      .catch((error) => {
        console.error('Veri çekme hatası:', error);
        setError('Veri çekme hatası');
        setItems([]);
      });
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFilters((prevState) => ({
      ...prevState,
      searchQuery: e.target.value,
    }));
  };

  const handlePriceRangeChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const value = Number(e.target.value);
    setSelectedFilters((prevState) => ({
      ...prevState,
      priceRange: {
        ...prevState.priceRange,
        [type]: value,
      },
    }));
  };

  const applyFilters = () => {
    const { min, max } = selectedFilters.priceRange;
    const filtered = items.filter(item => item.price >= min && item.price <= max);
    setFilteredItems(filtered);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleBalanceClick = () => {
    router.push('/payment');
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleCardClick = (item: Item) => {
    setModalContent(item);
  };

  const closeModal = () => {
    setModalContent(null);
  };

  return (
    <div className="container-fluid custom-background">
      {/* Navbar */}
      <Navbar /> {/* Navbar bileşenini burada çağırıyoruz */}

      {/* Filtreleme Kutusu */}
      <div className="filter-container text-white">
        <h5>Filtrele</h5>
        <div className="price-range mt-3">
          <label>Fiyat Aralığı</label>
          <div className="d-flex justify-content-between">
            <input
              type="number"
              className="form-control"
              min="0"
              max="10000"
              value={selectedFilters.priceRange.min}
              onChange={(e) => handlePriceRangeChange(e, 'min')}
              style={{ width: '48%' }}
            />
            <input
              type="number"
              className="form-control"
              min="0"
              max="10000"
              value={selectedFilters.priceRange.max}
              onChange={(e) => handlePriceRangeChange(e, 'max')}
              style={{ width: '48%' }}
            />
          </div>
        </div>

        <button className="btn-apply" type="button" onClick={applyFilters}>
          Uygula
        </button>
      </div>

      {/* İtemlar */}
      {error && <p className="text-danger text-center mt-4">{error}</p>}

      <div className="container mt-4">
        <div className="row">
          {filteredItems.map((item, index) => (
            <div className="col-6 col-md-4 col-lg-2 mb-4" key={index}>
              <div
                className="card-items"
                style={{ cursor: 'pointer' }}
                onClick={() => handleCardClick(item)}
              >
                <img
                  src={item.image}
                  className="card-img-top"
                  alt={`Card image ${index + 1}`}
                />
                <div className="card-body">
                  <h5 className="card-title">{item.name}</h5>
                  <p className="card-text" style={{ fontWeight: 'bold', color: '#555' }}>
                    {item.wears}
                  </p>
                  <p className="card-text" style={{ fontWeight: 'bold', color: 'white' }}>
                    Fiyat: ${item.price}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modalContent && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog" role="document">
            <div className="modal-content" style={{ backgroundColor: '#333', color: 'white' }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalContent.name} <span style={{ fontWeight: 'bold', color: '#ccc' }}>({modalContent.wears})</span>
                </h5>
              </div>
              <div className="modal-body text-center">
                <img src={modalContent.image} alt={modalContent.name} className="img-fluid" />
                <p style={{ fontWeight: 'bold', color: 'white' }}>Fiyat: ${modalContent.price}</p>
                <a
                  href={`https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(modalContent.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary mt-3"
                >
                  Steam Market'te Ara
                </a>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
