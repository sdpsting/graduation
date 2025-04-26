'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import Navbar from 'src/app/components/navbar';

type InventoryItem = {
  name: string;
  icon_url: string;
  market_hash_name: string;
  tradable: number;
  selected?: boolean;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const steamId = '76561198386302142';

  useEffect(() => {
    // CORS proxy URL
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const steamUrl = `https://steamcommunity.com/inventory/${steamId}/730/2?l=english`;

    fetch(proxyUrl + steamUrl)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.descriptions) {
          setError('Envanter alınamadı.');
          return;
        }

        const tradableItems = data.descriptions
          .filter((item: any) => item.tradable === 1)
          .map((item: any) => ({
            name: item.name,
            icon_url: item.icon_url,
            market_hash_name: item.market_hash_name,
            tradable: item.tradable,
            selected: false,
          }));

        setItems(tradableItems);
        setError(null);
      })
      .catch(() => setError('Envanter çekilirken hata oluştu.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectItem = (item: InventoryItem) => {
    if (!selectedItems.find(i => i.market_hash_name === item.market_hash_name)) {
      setSelectedItems([...selectedItems, item]);

      setItems(prevItems =>
        prevItems.map(i =>
          i.market_hash_name === item.market_hash_name ? { ...i, selected: true } : i
        )
      );
    }
  };

  const handleRemoveItem = (item: InventoryItem) => {
    setSelectedItems(selectedItems.filter(i => i.market_hash_name !== item.market_hash_name));

    setItems(prevItems =>
      prevItems.map(i =>
        i.market_hash_name === item.market_hash_name ? { ...i, selected: false } : i
      )
    );
  };

  const handleSellClick = () => {
    if (selectedItems.length > 0) {
      alert(`${selectedItems.length} eşya satıldı!`);
      setSelectedItems([]);

      setItems(prevItems =>
        prevItems.map(i => ({ ...i, selected: false }))
      );
    }
  };

  const handleItemClick = (item: InventoryItem) => {
    setItems(prevState =>
      prevState.map(i =>
        i.market_hash_name === item.market_hash_name
          ? { ...i, selected: !i.selected }
          : i
      )
    );

    if (!selectedItems.find(i => i.market_hash_name === item.market_hash_name)) {
      setSelectedItems([...selectedItems, item]);
    } else {
      setSelectedItems(selectedItems.filter(i => i.market_hash_name !== item.market_hash_name));
    }
  };

  return (
    <div className="container-fluid custom-background text-white">
      <Navbar />

      <div className="row p-4">
        {/* Envanter */}
        <div className="col-md-8">
          <h3 className="mb-4">Envanter</h3>

          {loading && <p>Yükleniyor...</p>}
          {error && <p className="text-danger">{error}</p>}

          <div className="row">
            {items.length === 0 ? (
              <p>Takaslanabilir eşya bulunamadı.</p>
            ) : (
              items.map((item) => (
                <div className="col-6 col-md-4 col-lg-3 mb-4" key={item.market_hash_name}>
                  <div
                    className="card-items"
                    style={{
                      backgroundColor: '#222',
                      borderRadius: '8px',
                      padding: '10px',
                      opacity: item.selected ? 0.5 : 1,
                      cursor: 'pointer',
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <img
                      src={`https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`}
                      alt={item.name}
                      className="img-fluid"
                    />
                    <h6 className="mt-2 text-white" style={{ fontSize: '0.9rem' }}>{item.name}</h6>
                    <button
                      className="btn btn-sm btn-warning mt-2"
                      onClick={(e) => {
                        e.stopPropagation(); // Kart tıklamasını engeller
                        handleSelectItem(item);
                      }}
                    >
                      Satışa Ekle
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sağ Panel */}
        <div className="col-md-4">
          <div className="bg-dark p-3 rounded">
            <h5 className="text-white">
              {selectedItems.length === 0
                ? 'Eşya seçilmedi'
                : `${selectedItems.length} eşya seçildi`}
            </h5>

            <div className="mt-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {selectedItems.map((item) => (
                <div key={item.market_hash_name} className="d-flex align-items-center mb-2" style={{ backgroundColor: '#333', padding: '10px', borderRadius: '8px' }}>
                  <img
                    src={`https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`}
                    alt={item.name}
                    width="40"
                    className="me-2"
                  />
                  <span className="text-white" style={{ fontSize: '0.9rem' }}>{item.name}</span>
                  <button
                    className="btn btn-sm btn-danger ms-auto"
                    onClick={() => handleRemoveItem(item)}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
            </div>

            <button
              className="btn btn-success mt-3 w-100"
              disabled={selectedItems.length === 0}
              onClick={handleSellClick}
            >
              Seçilenleri Sat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
