// src/app/withdrawal/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from 'src/app/components/navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

interface UserInventoryItem {
  inventory_id: number;
  item_id: string;
  price_at_purchase: number | null;
  purchase_date: string;
  item_name: string;
  item_image: string;
  item_wears: string;
  item_inspect?: string;
  item_ingame?: string;
}

const API_PRICE_BATCH_SIZE = 45; 

export default function WithdrawalPage() {
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<UserInventoryItem | null>(null);
  
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null); // Genel sayfa hataları için

  const [sellPriceInput, setSellPriceInput] = useState<string>('');
  const [recommendedSellPrice, setRecommendedSellPrice] = useState<string>('');
  const [loadingPricesState, setLoadingPricesState] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [steamId, setSteamId] = useState<string | null>(null);


  const getWearColorClass = (wear: string): string => {
    switch (wear) {
      case 'Factory New': return 'factory-new';
      case 'Minimal Wear': return 'minimal-wear';
      case 'Field-Tested': return 'field-tested';
      case 'Well-Worn': return 'well-worn';
      case 'Battle-Scarred': return 'battle-scarred';
      default: return 'text-white';
    }
  };

  const fetchUserInventory = useCallback(async () => {
    setLoadingInventory(true);
    setMessage(null);
    setError(null); // Hataları da temizle
    const token = localStorage.getItem('token');
    if (!token) {
      const errMsg = 'Envanterinizi görmek için lütfen giriş yapın.';
      setMessage({ type: 'error', text: errMsg });
      setError(errMsg);
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
            const parsedPrice = parseFloat(String(apiItem.price_at_purchase));
            if (!isNaN(parsedPrice)) price = parsedPrice;
          }
          return { 
            ...apiItem, // Gelen tüm alanları al
            price_at_purchase: price,
            item_name: apiItem.item_name, // Backend'den gelen AS ile eşleşmeli
            item_image: apiItem.item_image,
            item_wears: apiItem.item_wears
         };
        });
        setInventory(typedItems);
        if (typedItems.length === 0) {
            setMessage({type: 'info', text: 'Envanterinizde marketten satın aldığınız eşya bulunmuyor.'});
        }
      } else {
        throw new Error(data.message || 'Envanter verileri alınamadı veya format yanlış.');
      }
    } catch (err: any) {
      console.error('Envanter çekme hatası:', err);
      const errMsg = err.message || 'Envanter yüklenirken bir sorun oluştu.';
      setMessage({ type: 'error', text: errMsg });
      setError(errMsg);
      setInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  }, []); // useCallback dependency array boş

  useEffect(() => {
    fetchUserInventory();
  }, [fetchUserInventory]);

  const handleItemSelect = (item: UserInventoryItem) => {
    setSelectedItem(item);
    setMessage(null);
    if (item && item.price_at_purchase !== null) {
      const recommended = item.price_at_purchase * 0.97;
      setRecommendedSellPrice(recommended.toFixed(2));
      setSellPriceInput(recommended.toFixed(2));
    } else {
      setRecommendedSellPrice('');
      setSellPriceInput('');
    }
  };

  const handleWithdrawItem = async () => {
    if (!selectedItem) {
        setMessage({type: 'error', text: "Lütfen çekmek için bir eşya seçin."});
        return;
    }
    alert(`"${selectedItem.item_name}" için çekim özelliği henüz entegre edilmedi.`);
  };

  const handleSellToMarketAction = async () => {
    if (!selectedItem || !sellPriceInput) {
      setMessage({ type: 'error', text: 'Lütfen satmak için bir eşya seçin ve satış fiyatı girin.' });
      return;
    }
    const sellPriceNum = parseFloat(sellPriceInput);
    if (isNaN(sellPriceNum) || sellPriceNum <= 0) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir pozitif satış fiyatı girin.' });
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'İşlem yapmak için lütfen giriş yapın.' });
      return;
    }
    setProcessingAction('sell_to_market');
    setMessage(null);
    try {
      const res = await fetch(`/api/market/sell-item`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
            inventoryId: selectedItem.inventory_id,
            itemId: selectedItem.item_id, // items tablosundaki ürün ID'si
            sellPrice: sellPriceNum 
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: data.message || 'Eşya başarıyla markete konuldu.' });
        fetchUserInventory(); 
        setSelectedItem(null);
        setSellPriceInput('');
        setRecommendedSellPrice('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Satış işlemi başarısız.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Sunucu ile iletişimde hata.' });
    }
    setProcessingAction(null);
  };
  
  // Yükleme durumu için JSX
  if (loadingInventory) {
    return (
        <div className="custom-background text-white min-vh-100 d-flex flex-column">
            <Navbar />
            <div className="flex-grow-1 d-flex justify-content-center align-items-center">
                <div>
                    <div className="spinner-border text-warning" role="status" style={{width: "3rem", height: "3rem"}}>
                        <span className="visually-hidden">Yükleniyor...</span>
                    </div>
                    <p className="mt-3 h5">Envanteriniz yükleniyor...</p>
                </div>
            </div>
        </div>
    );
  }

  // Hata durumu için JSX
  if (error) { 
    return (
      <div className="container-fluid custom-background text-white vh-100 d-flex flex-column">
        <Navbar />
        <div className="flex-grow-1 d-flex justify-content-center align-items-center text-center">
          <div>
            <p className="text-danger h4">Bir Hata Oluştu!</p>
            {/* message state'i varsa onu, yoksa genel error state'ini göster */}
            <p className="text-danger">{message && message.type === 'error' ? message.text : error}</p>
            {( (message?.text || error || '').includes("giriş yapılmamış") || (message?.text || error || '').includes("Oturum bilgileri")) && (
              <button className="btn btn-primary mt-2" onClick={() => window.location.href = '/login'}>
                Giriş Yap Sayfasına Git
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Ana JSX
  return (
    <div className="custom-background text-white min-vh-100">
      <Navbar />
      <div className="container-fluid mt-4">
        
        {/* Sadece işlem sonrası mesajları göster, error zaten yukarıda handle ediliyor */}
        {message && message.type !== 'error' && (
          <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-info'} mx-auto col-md-8 col-lg-6 mt-3`} role="alert">
            {message.text}
          </div>
        )}

        <div className="row">
          <div className="col-md-8">
            <h3 className="text-light mb-3">Sahip Olduğunuz Eşyalar</h3>
            {inventory.length === 0 && !loadingInventory ? ( // Yükleme bittiyse ve envanter boşsa
              <p className="alert alert-secondary">Envanterinizde marketten satın aldığınız eşya bulunmuyor.</p>
            ) : (
              <div className="row g-3">
                {inventory.map((item) => (
                  <div className="col-6 col-md-4 col-lg-3" key={item.inventory_id}>
                    <div 
                      className={`inventory-card h-100 d-flex flex-column position-relative ${selectedItem?.inventory_id === item.inventory_id ? 'selected-card' : ''}`}
                      onClick={() => handleItemSelect(item)}
                      style={{cursor: 'pointer'}}
                    >
                      <img src={item.item_image} className="card-img-top p-2" alt={item.item_name} style={{ maxHeight: '150px', objectFit: 'contain' }} />
                      <div className="card-body d-flex flex-column p-2">
                        <h6 className="card-title small" style={{minHeight: '2.4em', overflow: 'hidden', textOverflow: 'ellipsis'}}>{item.item_name}</h6>
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

          <div className="col-md-4">
            <div className="sticky-top" style={{ top: '20px' }}>
              <h3 className="text-light mb-3">Seçili Eşya</h3>
              {selectedItem ? (
                <div className="card bg-dark-accent text-white p-3">
                  <img src={selectedItem.item_image} className="card-img-top mb-3" alt={selectedItem.item_name} style={{maxHeight: '250px', objectFit: 'contain'}}/>
                  <h5>{selectedItem.item_name}</h5>
                  <p className={`small ${getWearColorClass(selectedItem.item_wears || '')}`}>
                    Aşınmışlık: {selectedItem.item_wears || 'N/A'}
                  </p>
                  <p className="small">Satın Alma Fiyatı: ${selectedItem.price_at_purchase != null ? selectedItem.price_at_purchase.toFixed(2) : 'N/A'}</p>
                  <p className="small"><small>Satın Alma Tarihi: {new Date(selectedItem.purchase_date).toLocaleDateString()}</small></p>
                  
                  <button 
                    className="btn btn-withdrawal w-100 mb-3 mt-2"
                    onClick={handleWithdrawItem}
                    disabled={processingAction !== null}
                  >
                    {processingAction === 'withdraw' ? (<><span className="spinner-border spinner-border-sm"></span> İşleniyor...</>) : 'Çekim Yap'}
                  </button>
                  
                  <hr className="my-3"/>
                  <h6>Pazara Geri Sat</h6>
                  {selectedItem.price_at_purchase !== null && (
                    <p className="small text-white">
                        Alış Fiyatı: ${selectedItem.price_at_purchase.toFixed(2)}<br/>
                        Tavsiye Edilen: 
                        <strong className="custom-text-sell ms-1" title="Alış fiyatınızın %3 altında (veya sizin belirlediğiniz marj)">${recommendedSellPrice}</strong>
                    </p>
                  )}
                  <div className="input-group mb-2">
                    <span className="input-group-text">$</span>
                    <input 
                        type="number" 
                        className="form-control form-control-sm" 
                        placeholder="Satış Fiyatınız"
                        value={sellPriceInput}
                        onChange={(e) => setSellPriceInput(e.target.value)}
                        min="0.01"
                        step="0.01"
                    />
                  </div>
                  <button 
                    className="btn btn-sell w-100"
                    onClick={handleSellToMarketAction}
                    disabled={processingAction !== null || !sellPriceInput || parseFloat(sellPriceInput) <= 0}
                  >
                    {processingAction === 'sell_to_market' ? (<><span className="spinner-border spinner-border-sm"></span> Markete Konuluyor...</>) : 'Markete Koy'}
                  </button>
                </div>
              ) : (
                <div className="text-center text-muted-custom p-5 border border-secondary rounded">
                  <p>İşlem yapmak için soldaki envanterinizden bir eşya seçin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}