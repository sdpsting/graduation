'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import './globals.css';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';

type Item = {
  name: string;
  image: string;
};

export default function FilterComponent() {
  const [selectedFilters, setSelectedFilters] = useState({
    searchQuery: '',
    priceRange: { min: 0, max: 1000 },
  });

  const [user, setUser] = useState<{ name: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    // Kullanıcı bilgilerini yerel depolamadan al
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Veritabanından verileri çek
    fetch('/api/items')
      .then((response) => response.json())
      .then((data) => setItems(data))
      .catch((error) => console.error('Veri çekme hatası:', error));
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

  const handleLogout = () => {
    // Kullanıcıyı çıkış yaptır
    localStorage.removeItem('user');
    setUser(null);
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
                <Link href="/market" className="nav-link active text-white">
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
                <Link href="#" className="nav-link text-white">
                  Açık Artırma
                </Link>
              </li>
              <li className="nav-item">
                <Link href="#" className="nav-link text-white">
                  Yardım
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
      <div className="filter-container">
        <h5>Filtrele</h5>

        {/* Arama Çubuğu */}
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

        {/* Fiyat Aralığı */}
        <div className="price-range mt-3">
          <label>Fiyat Aralığı</label>

          {/* Fiyat Aralığı Inputları */}
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

        {/* Filtre Uygula */}
        <button className="btn-apply" type="button">
          Uygula
        </button>
      </div>

      {/* Kartlar */}
      <div className="container mt-4">
        <div className="row">
          {items.map((item, index) => {
            const searchUrl = `https://steamcommunity.com/market/search?appid=730&q=${encodeURIComponent(item.name)}`;
            return (
              <div className="col-6 col-md-4 col-lg-2 mb-4" key={index}>
                <div
                  className="card-items"
                  style={{ cursor: 'pointer' }}
                  onClick={() => alert(`Kart ${index + 1} tıklandı`)}
                >
                  <img
                    src={item.image}
                    className="card-img-top"
                    alt={`Card image ${index + 1}`}
                  />
                  <div className="card-body">
                    <h5 className="card-title">{item.name}</h5>
                    <a href={searchUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                      Steam Market'te Ara
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}