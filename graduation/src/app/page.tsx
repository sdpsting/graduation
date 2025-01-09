'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import '../app/globals.css';
import Link from 'next/link';
import { useState } from 'react';

export default function Home() {
  const [isSilahTuruOpen, setSilahTuruOpen] = useState(false); // Silah Türü menüsü için state

  const toggleSilahTuru = () => {
    setSilahTuruOpen(prevState => !prevState); // Silah Türü menüsünü aç/kapalı yap
  };

  return (
    <div className="container-fluid custom-background">

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
                <Link href="/about" className="nav-link text-white">
                  Envanter
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/services" className="nav-link text-white">
                  Eşya Sat
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/contact" className="nav-link text-white">
                  Eşya Al
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/blog" className="nav-link text-white">
                  Açık Artırma
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/faq" className="nav-link text-white">
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
                />
              </div>
            </form>

            <button className="sign-in-button" type="button">
              Giriş Yap
            </button>
          </div>
        </div>
      </nav>

      {/* Filtreleme kutusu */}
      <div className="filter-container">
        <h5>Filtrele</h5>

        {/* Silah Türü Dropdown */}
        <div className="dropdown dropdown-horizontal">
          <button
            className="btn btn-secondary dropdown-toggle"
            type="button"
            id="dropdownSilahTuru"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            onClick={toggleSilahTuru} // Silah Türü menüsünü tıklandığında aç
          >
            Silah Türü
          </button>
          {/* Silah Türü menüsünün içeriği */}
          {isSilahTuruOpen && (
            <div className="extra-dropdowns">
              {["Bıçaklar", "Eldivenler", "Tüfekler", "Tabancalar", "Hafif Makineliler", "Pompalılar", "Makineli Tüfekler", "Çıkartmalar", "Ajanlar", "Diğer"].map((menuName, index) => (
                <div className="dropdown" key={index}>
                  <button
                    className="btn btn-secondary dropdown-toggle"
                    type="button"
                    id={`dropdownExtra${index}`}
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {menuName} {/* Menü ismi burada */}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-right" aria-labelledby={`dropdownExtra${index}`}>
                    <li>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="option1" id={`checkbox${index}-1`} />
                        <label className="form-check-label" htmlFor={`checkbox${index}-1`}>
                          Karambit
                        </label>
                      </div>
                    </li>
                    <li>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="option2" id={`checkbox${index}-2`} />
                        <label className="form-check-label" htmlFor={`checkbox${index}-2`}>
                          Bayonet M9
                        </label>
                      </div>
                    </li>
                    <li>
                      <div className="form-check">
                        <input className="form-check-input" type="checkbox" value="option3" id={`checkbox${index}-3`} />
                        <label className="form-check-label" htmlFor={`checkbox${index}-3`}>
                          Gölge Hançerler
                        </label>
                      </div>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Kartlar */}
      <div className="container mt-4">
        <div className="row">
          {/* Kartları 6x3 düzeninde ekliyoruz */}
          {Array.from({ length: 18 }).map((_, index) => (
            <div className="col-6 col-md-4 col-lg-2 mb-4" key={index} >
              <div className="card-items" style={{ cursor: "pointer" }} onClick={() => alert(`Kart ${index + 1} tıklandı`)}>
                <img
                  src="https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP4jVC9vh5yYmGhJIKRdVA_NF6C-AC2yOjngJXu6MiaznU3v3Un7X-Iy0e1iEoeP_sv26JaEqwbxg/360fx360f"
                  className="card-img-top"
                  alt={`Card image ${index + 1}`}
                />
                <div className="card-body">
                  <h5 className="card-title">M4A1-S | Printstream</h5>
                  <p className="card-text">$ 634.59</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
