'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

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
      <nav className="navbar navbar-expand-lg navbar-background">
        <div className="container-fluid">
          <Link href="/" className="navbar-brand">
            <img
              src="https://ih1.redbubble.net/image.542370055.6839/st,small,507x507-pad,600x600,f8f8f8.jpg"
              alt="Logo"
              style={{ width: '60px', height: 'auto' }}
              className="d-inline-block align-text-top"
            />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link href="/" className="nav-link active text-white">
                  Market
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#" className="nav-link text-white">
                  Envanter
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/sell" className="nav-link text-white">
                  Eşya Sat
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#" className="nav-link text-white">
                  Eşya Al
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/sss" className="nav-link text-white">
                  S.S.S.
                </Link>
              </li>
            </ul>

            <form className="d-flex me-2">
              <div className="input-group">
                <span className="input-group-text search-icon">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  className="form-control search-bar"
                  type="search"
                  placeholder="Arama yap"
                  aria-label="Search"
                  onChange={handleSearchChange}
                />
              </div>
            </form>

            {user ? (
              <div className="d-flex align-items-center">
                <span className="text-white me-2">Hoş geldiniz, {user.name}</span>
                <div
                  className="balance-container d-flex flex-column justify-content-center align-items-center"
                  onClick={handleBalanceClick}
                >
                  <span className="balance-label">Bakiye</span>
                  <span className="balance-amount">$1000</span>
                </div>

                <div
                  className="account-logo"
                  style={{ cursor: 'pointer', marginRight: '10px' }}
                  onClick={handleProfileClick}
                >
                  <img
                    src="https://w7.pngwing.com/pngs/215/58/png-transparent-computer-icons-google-account-scalable-graphics-computer-file-my-account-icon-rim-123rf-symbol-thumbnail.png"
                    alt="Account Logo"
                    style={{ width: '40px', height: 'auto', borderRadius: '50%' }}
                  />
                </div>
                <button className="btn btn-outline-light" onClick={handleLogout} type="button">
                  Çıkış Yap
                </button>
              </div>
            ) : (
              <Link href="/login" passHref>
                <button className="btn btn-outline-light" type="button">
                  Giriş Yap
                </button>
              </Link>
            )}
          </div>
        </div>
      </nav>

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
                    Fiyat: ${item.price} {/* Fiyat bilgisi gösteriliyor */}
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
                <p style={{ fontWeight: 'bold', color: 'white' }}>Fiyat: ${modalContent.price}</p> {/* Fiyat bilgisi eklendi ve rengi beyaz yapıldı */}
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