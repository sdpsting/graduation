// src/app/withdrawal/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from 'src/app/components/navbar';
import 'bootstrap/dist/css/bootstrap.min.css';
// Gerekirse ikonlar için Font Awesome veya Bootstrap Icons
// import '@fortawesome/fontawesome-free/css/all.min.css';

interface UserInventoryItem {
  inventory_id: number;
  item_id: string;
  price_at_purchase: number | null;
  purchase_date: string;
  item_name: string;
  item_image: string;
  item_wears: string;
  item_inspect?: string; // Market sayfasından gelen detaylar için
  item_ingame?: string;  // Market sayfasından gelen detaylar için
  // item_category?: string; // İhtiyaç olursa
}

// StoredUser tipine gerek kalmayabilir eğer token ile her şeyi hallediyorsak
// interface StoredUser {
//   id: number;
// }

export default function WithdrawalPage() {
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<UserInventoryItem | null>(null); // Seçilen tüm item objesini tutar
  
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [processingAction, setProcessingAction] = useState<string | null>(null); // 'withdraw' veya 'sell'
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Aşınmışlık için renk sınıfı (Market sayfasından alınabilir veya ortak bir utils'e taşınabilir)
  const getWearColorClass = (wear: string): string => {
    switch (wear) {
      case 'Factory New': return 'factory-new-class'; // CSS'te bu class'ları tanımlayın
      case 'Minimal Wear': return 'minimal-wear-class';
      case 'Field-Tested': return 'field-tested-class';
      case 'Well-Worn': return 'well-worn-class';
      case 'Battle-Scarred': return 'battle-scarred-class';
      default: return 'text-secondary';
    }
  };

  const fetchUserInventory = useCallback(async () => {
    setLoadingInventory(true);
    setMessage(null);
    const token = localStorage.getItem('token');

    if (!token) {
      setMessage({ type: 'error', text: 'Envanterinizi görmek için lütfen giriş yapın.' });
      setLoadingInventory(false);
      return;
    }

    try {
      const res = await fetch('/api/inventory/my-items', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Sunucudan geçersiz yanıt.' }));
        throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        const typedItems: UserInventoryItem[] = data.items.map((apiItem: any) => {
          let price: number | null = null;
          if (apiItem.price_at_purchase !== null && apiItem.price_at_purchase !== undefined) {
            const parsedPrice = parseFloat(String(apiItem.price_at_purchase)); // String'e çevirip parse etmeyi garantile
            if (!isNaN(parsedPrice)) price = parsedPrice;
          }
          return { ...apiItem, price_at_purchase: price };
        });
        setInventory(typedItems);
      } else {
        throw new Error(data.message || 'Envanter verileri alınamadı veya format yanlış.');
      }
    } catch (err: any) {
      console.error('Envanter çekme hatası:', err);
      setMessage({ type: 'error', text: err.message || 'Envanter yüklenirken bir sorun oluştu.' });
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  useEffect(() => {
    fetchUserInventory();
  }, [fetchUserInventory]);

  const handleItemSelect = (item: UserInventoryItem) => {
    setSelectedItem(item);
    setMessage(null); // Önceki mesajları temizle
  };

  // ÇEKİM İŞLEMİ (Sizin mevcut /api/users/${userId}/withdraw endpoint'inize göre uyarlanmalı)
  const handleWithdrawItem = async () => {
    if (!selectedItem) return;
    const token = localStorage.getItem('token');
    // const storedUserString = localStorage.getItem('user'); // Eğer hala userId'yi buradan almanız gerekiyorsa
    // if (!storedUserString) { /* hata yönetimi */ return; }
    // const parsedUser: StoredUser = JSON.parse(storedUserString);
    // const userId = parsedUser.id;


    if (!token) {
        setMessage({ type: 'error', text: 'İşlem yapmak için lütfen giriş yapın.' });
        return;
    }

    setProcessingAction('withdraw');
    setMessage(null);

    try {
      // API endpoint'iniz ve body'niz buraya gelecek.
      // Örneğin: /api/items/withdraw (bu API'nin inventory_id veya item_id beklemesi lazım)
      // Body: { inventoryId: selectedItem.inventory_id } veya { itemId: selectedItem.item_id }
      const res = await fetch(`/api/your-withdraw-endpoint`, { // GERÇEK ENDPOINTİNİZİ YAZIN
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Eğer token gerekiyorsa
        },
        body: JSON.stringify({ inventoryId: selectedItem.inventory_id }), // VEYA itemId
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Eşya çekme isteği başarılı.' });
        fetchUserInventory(); // Envanteri güncelle
        setSelectedItem(null); // Seçimi kaldır
      } else {
        setMessage({ type: 'error', text: data.message || 'Çekme işlemi başarısız.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Sunucu ile iletişimde hata.' });
    }
    setProcessingAction(null);
  };

  // PAZARA GERİ SATMA İŞLEMİ (Yeni bir API endpoint'i gerektirebilir)
  const handleSellItem = async () => {
    if (!selectedItem) return;
    const token = localStorage.getItem('token');
    if (!token) {
        setMessage({ type: 'error', text: 'İşlem yapmak için lütfen giriş yapın.' });
        return;
    }

    setProcessingAction('sell');
    setMessage(null);

    try {
      // API endpoint'i: /api/market/sell-item (veya benzeri)
      // Body: { inventoryId: selectedItem.inventory_id, sellPrice: belirlenen_bir_fiyat }
      // Bu API, item'ı user_inventory'den silip, items tablosunda status='available' ve yeni fiyatla güncelleyebilir.
      const res = await fetch(`/api/market/sell-item`, { // YENİ BİR ENDPOINT GEREKEBİLİR
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        // Belki kullanıcı satış fiyatını belirler? Şimdilik sadece ID'yi gönderelim.
        body: JSON.stringify({ inventoryId: selectedItem.inventory_id }), 
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Eşya başarıyla pazara geri konuldu.' });
        fetchUserInventory(); // Envanteri güncelle
        setSelectedItem(null); // Seçimi kaldır
      } else {
        setMessage({ type: 'error', text: data.message || 'Satış işlemi başarısız.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Sunucu ile iletişimde hata.' });
    }
    setProcessingAction(null);
  };


  return (
    <div className="custom-background text-white min-vh-100">
      <Navbar />
      <div className="container-fluid mt-4"> {/* container-fluid daha geniş alan sağlar */}
        <h1 className="text-center mb-4 text-warning">Envanterim / Eşya Yönetimi</h1>
        
        {message && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mx-auto col-md-8`} role="alert">
            {message.text}
          </div>
        )}

        <div className="row">
          {/* Sol Taraf: Envanter Listesi */}
          <div className="col-md-8">
            <h3 className="text-light mb-3">Sahip Olduğunuz Eşyalar</h3>
            {loadingInventory ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning" role="status"></div>
                <p className="mt-2">Envanter yükleniyor...</p>
              </div>
            ) : inventory.length === 0 ? (
              <p>Envanterinizde hiç ürün bulunmuyor.</p>
            ) : (
              <div className="row g-3">
                {inventory.map((item) => (
                  <div className="col-6 col-md-4 col-lg-3" key={item.inventory_id}>
                    <div 
                      className={`card h-100 bg-dark text-white inventory-card ${selectedItem?.inventory_id === item.inventory_id ? 'selected-card' : ''}`}
                      onClick={() => handleItemSelect(item)}
                      style={{cursor: 'pointer'}}
                    >
                      <img src={item.item_image} className="card-img-top p-2" alt={item.item_name} style={{ maxHeight: '150px', objectFit: 'contain' }} />
                      <div className="card-body d-flex flex-column p-2">
                        <h6 className="card-title small">{item.item_name}</h6>
                        <p className={`card-text small ${getWearColorClass(item.item_wears || '')}`}>
                          {item.item_wears || 'N/A'}
                        </p>
                        <p className="card-text small mt-auto">
                          Alış: ${item.price_at_purchase != null ? item.price_at_purchase.toFixed(2) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sağ Taraf: Seçili Item Detayları ve Aksiyonlar */}
          <div className="col-md-4">
            <div className="sticky-top" style={{ top: '20px' }}> {/* Sağa yapışkan olması için */}
              <h3 className="text-light mb-3">Seçili Eşya</h3>
              {selectedItem ? (
                <div className="card bg-dark-accent text-white p-3"> {/* Farklı bir arkaplan rengi */}
                  <img src={selectedItem.item_image} className="card-img-top mb-3" alt={selectedItem.item_name} style={{maxHeight: '250px', objectFit: 'contain'}}/>
                  <h5>{selectedItem.item_name}</h5>
                  <p className={getWearColorClass(selectedItem.item_wears || '')}>
                    Aşınmışlık: {selectedItem.item_wears || 'N/A'}
                  </p>
                  <p>Satın Alma Fiyatı: ${selectedItem.price_at_purchase != null ? selectedItem.price_at_purchase.toFixed(2) : 'N/A'}</p>
                  <p><small>Satın Alma Tarihi: {new Date(selectedItem.purchase_date).toLocaleDateString()}</small></p>
                  
                  {/* Steam, Inspect linkleri (varsa) */}
                  {(selectedItem.item_inspect || selectedItem.item_ingame) && (
                    <div className="btn-group mb-3 d-flex" role="group">
                        {selectedItem.item_inspect && 
                            <a href={selectedItem.item_inspect} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm flex-fill">
                                <i className="fas fa-search"></i> Incele
                            </a>}
                        {selectedItem.item_ingame && 
                            <a href={selectedItem.item_ingame} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm flex-fill">
                                <i className="fas fa-gamepad"></i> Oyunda Gör
                            </a>}
                    </div>
                  )}

                  <button 
                    className="btn btn-warning w-100 mb-2"
                    onClick={handleWithdrawItem}
                    disabled={processingAction === 'withdraw'}
                  >
                    {processingAction === 'withdraw' ? 'İşleniyor...' : 'Çekim Yap'}
                  </button>
                  <button 
                    className="btn btn-info w-100"
                    onClick={handleSellItem}
                    disabled={processingAction === 'sell'}
                  >
                    {processingAction === 'sell' ? 'İşleniyor...' : 'Pazara Geri Sat'}
                  </button>
                </div>
              ) : (
                <div className="text-center text-muted p-5 border border-secondary rounded">
                  <p>İşlem yapmak için soldaki envanterinizden bir eşya seçin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-background { /* Varsa market sayfanızdakiyle aynı yapın */
            background-color: hsl(0, 0%, 10%) ; /* Koyu mavi-mor örnek */
            min-height: 100vh;
        }
        .inventory-card {
            transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
            border: 1px solid #333;
        }
        .inventory-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 4px 15px rgba(255, 193, 7, 0.2); /* Sarımsı bir gölge */
        }
        .selected-card {
            border-color: #ffc107; /* Seçili kart için belirgin kenarlık */
            box-shadow: 0 0 15px rgba(255, 193, 7, 0.5);
        }
        .bg-dark-accent { /* Sağ panel için biraz farklı bir koyu renk */
            background-color: #232336;
        }
        /* Wear color classes (market sayfanızdakiyle aynı olmalı) */
        .factory-new-class { color: #6a9 pesticidelue; font-weight: bold; } /* Örnek renkler */
        .minimal-wear-class { color: #87ceeb; font-weight: bold; }
        .field-tested-class { color: #ffdead; font-weight: bold; }
        .well-worn-class { color: #d2691e; font-weight: bold; }
        .battle-scarred-class { color: #a52a2a; font-weight: bold; }

        /* İkonlar için (eğer FontAwesome kullanıyorsanız) */
        /* @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css'); */
      `}</style>
    </div>
  );
}