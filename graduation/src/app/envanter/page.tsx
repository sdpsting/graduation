// InventoryPage.tsx
'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState, useCallback } from 'react';
import Navbar from 'src/app/components/navbar';

type InventoryItem = {
  name: string;
  icon_url: string; // Doğru alan adı
  market_hash_name: string;
  tradable: number;
  selected?: boolean;
  market_price_details?: {
    price: number | null;
    lowest_price_str?: string;
    median_price_str?: string;
    volume_str?: string;
  } | null;
  loading_price?: boolean;
  inventory_id?: number; 
};

const API_PRICE_BATCH_SIZE = 45; 

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemsForBulkAction, setSelectedItemsForBulkAction] = useState<InventoryItem[]>([]);
  const [itemForDetailView, setItemForDetailView] = useState<InventoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingPricesState, setLoadingPricesState] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [steamId, setSteamId] = useState<string | null>(null);

  // ... (useEffect for steamId - aynı)
  // ... (fetchPricesForItems fonksiyonu - aynı)
  // ... (useEffect for Steam Inventory and Prices - aynı)
  // ... (handleRefreshNullPrices - aynı)
  // ... (handleItemClick - aynı)
  // ... (handleRemoveItemFromSelection - aynı)
  // ... (handleWithdrawAction - aynı)
  // ... (handleSellToMarketAction - aynı)
  // ... (handleBulkSellClick - aynı)
  // Önceki mesajdaki bu fonksiyonların içleri doğruydu, sadece aşağıdaki JSX'te düzeltme var.
  // Tüm fonksiyonları tekrar ekliyorum karışıklık olmasın diye:
  useEffect(() => {
    const storedUserString = localStorage.getItem('user');
    if (storedUserString) {
      try {
        const userData = JSON.parse(storedUserString);
        if (userData && userData.steamId) {
          setSteamId(userData.steamId);
        } else {
          const errMsg = 'Oturum bilgileri eksik veya Steam ID bulunamadı. Lütfen tekrar giriş yapın.';
          setError(errMsg); 
          setMessage({type: 'error', text: errMsg});
          setLoadingInventory(false);
        }
      } catch (parseError) {
        const errMsg = "Oturum bilgileri okunamadı. Lütfen tekrar giriş yapın.";
        setError(errMsg); 
        setMessage({type: 'error', text: errMsg});
        localStorage.removeItem('user');
        setLoadingInventory(false);
      }
    } else {
      const errMsg = 'Bu sayfayı görüntülemek için lütfen giriş yapın.';
      setError(errMsg); 
      setMessage({type: 'error', text: errMsg});
      setLoadingInventory(false);
    }
  }, []);

  const fetchPricesForItems = useCallback(async (
    steamItemsToPrice: InventoryItem[], 
    forceRefreshSpecificNames?: string[]
  ) => {
    if (steamItemsToPrice.length === 0) {
      if (forceRefreshSpecificNames) setIsRefreshingPrices(false); else setLoadingPricesState(false);
      return;
    }
    if (forceRefreshSpecificNames && forceRefreshSpecificNames.length > 0) {
        setIsRefreshingPrices(true);
        setMessage({type: 'info', text: 'Seçili item fiyatları güncelleniyor...'});
    } else if (!forceRefreshSpecificNames) {
        setLoadingPricesState(true);
    }

    const batches: InventoryItem[][] = [];
    for (let i = 0; i < steamItemsToPrice.length; i += API_PRICE_BATCH_SIZE) {
      batches.push(steamItemsToPrice.slice(i, i + API_PRICE_BATCH_SIZE));
    }

    try {
      const priceUpdatePromises = batches.map(async (batch, batchIndex) => {
        const marketHashNamesInBatch = batch.map(item => item.market_hash_name);
        const requestBody: { market_hash_names: string[], force_refresh_names?: string[] } = { 
            market_hash_names: marketHashNamesInBatch 
        };
        if (forceRefreshSpecificNames) {
            const namesToForceInThisBatch = marketHashNamesInBatch.filter(name => forceRefreshSpecificNames.includes(name));
            if (namesToForceInThisBatch.length > 0) {
                requestBody.force_refresh_names = namesToForceInThisBatch;
            }
        }
        const priceRes = await fetch('/api/steam-item-prices-cached', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (!priceRes.ok) {
          const errData = await priceRes.json().catch(() => ({ message: `Batch ${batchIndex + 1} için fiyat sunucusundan geçersiz yanıt (${priceRes.status}).` }));
          console.error(`[Prices] Batch ${batchIndex + 1} fiyat API hatası:`, errData.message || `HTTP ${priceRes.status}`);
          setItems(prevItems =>
            prevItems.map(item =>
              marketHashNamesInBatch.includes(item.market_hash_name)
                ? { ...item, loading_price: false, market_price_details: null }
                : item));
          return null; 
        }
        const priceData = await priceRes.json();
        if (priceData.success) {
          setItems(prevItems =>
            prevItems.map(item => {
              const priceInfo = priceData.prices[item.market_hash_name];
              if (marketHashNamesInBatch.includes(item.market_hash_name)) {
                return {
                  ...item,
                  market_price_details: priceInfo || item.market_price_details,
                  loading_price: false,
                };
              }
              return item;
            }));
          return priceData.prices;
        } else {
          console.warn(`[Prices] Batch ${batchIndex + 1} için fiyatlar API'den alınamadı:`, priceData.message);
          setItems(prevItems =>
            prevItems.map(item =>
              marketHashNamesInBatch.includes(item.market_hash_name)
                ? { ...item, loading_price: false, market_price_details: null }
                : item));
          return null;
        }
      });
      await Promise.all(priceUpdatePromises);
      if (forceRefreshSpecificNames && forceRefreshSpecificNames.length > 0) {
        setMessage({type: 'success', text: 'Fiyatlar güncellendi.'});
      }
    } catch (err: any) {
      console.error('[Prices] Genel fiyat çekme (fetchPricesForItems) hatası:', err.message);
      const errMsg = `Fiyatlar yüklenirken bir sorun oluştu: ${err.message}`;
      setError(errMsg);
      setMessage({type: 'error', text: errMsg});
      setItems(prev => prev.map(i => ({ ...i, loading_price: false, market_price_details: null })));
    } finally {
      if (forceRefreshSpecificNames) setIsRefreshingPrices(false); else setLoadingPricesState(false);
    }
  }, []);

  useEffect(() => {
    if (!steamId) {
      if (loadingInventory && !error && !message) {} 
      else if (!loadingInventory && !error && !steamId && !message) { 
         const errMsg = 'Bu sayfayı görüntülemek için lütfen giriş yapın veya Steam ID\'nizi profilinize ekleyin.';
         setError(errMsg);
         setMessage({type: 'error', text: errMsg});
      }
      if (loadingInventory && !error) setLoadingInventory(false);
      return;
    }
    setLoadingInventory(true);
    setError(null); 
    setMessage(null);
    fetch(`https://steamcommunity.com/inventory/${steamId}/730/2?l=english`)
      .then(res => { 
        if (!res.ok) {
          if (res.status === 403) throw new Error('Steam envanteri gizli veya erişilemiyor.');
          if (res.status === 429) throw new Error('Steam API\'ye çok fazla istek gönderildi. Biraz bekleyip tekrar deneyin.');
          throw new Error(`Steam API hatası (${res.status}). Lütfen daha sonra tekrar deneyin.`);
        }
        return res.json();
      })
      .then(data => {
        if (!data || !data.descriptions || data.descriptions.length === 0) {
          setItems([]); 
          setMessage({type: 'info', text: 'Envanterinizde takaslanabilir CS2 eşyası bulunmuyor.'});
          return []; 
        }
        const tradableItems: InventoryItem[] = data.descriptions
          .filter((item: any) => item.tradable === 1)
          .map((item: any) => ({
            name: item.name, icon_url: item.icon_url, market_hash_name: item.market_hash_name,
            tradable: item.tradable, selected: false, market_price_details: null, loading_price: true,
            inventory_id: item.assetid, // Eğer assetid'yi inventory_id olarak kullanmak istersen
          }));
        setItems(tradableItems);
        return tradableItems;
      })
      .then(fetchedSteamItems => {
        if (fetchedSteamItems && fetchedSteamItems.length > 0) {
          fetchPricesForItems(fetchedSteamItems);
        } else if (fetchedSteamItems && fetchedSteamItems.length === 0) {
           setLoadingPricesState(false);
        }
      })
      .catch((err) => { 
        const errMsg = err instanceof Error ? err.message : 'Envanter çekilirken bilinmeyen bir hata oluştu.';
        setError(errMsg);
        setMessage({type: 'error', text: errMsg});
        setItems([]);
      })
      .finally(() => { setLoadingInventory(false); });
  }, [steamId, fetchPricesForItems]);

  const handleRefreshNullPrices = () => {
    setMessage(null);
    const itemsToRefresh = items.filter(
      item => !item.loading_price && (!item.market_price_details || item.market_price_details.price === null)
    );
    if (itemsToRefresh.length > 0) {
      setItems(prev => prev.map(pItem => 
        itemsToRefresh.find(np => np.market_hash_name === pItem.market_hash_name) 
          ? { ...pItem, loading_price: true } 
          : pItem
      ));
      fetchPricesForItems(itemsToRefresh, itemsToRefresh.map(i => i.market_hash_name));
    } else {
      setMessage({type: 'info', text: "Tüm item'lar için fiyat bilgisi mevcut veya zaten yükleniyor."});
    }
  };

  const handleItemClick = (clickedItem: InventoryItem) => {
    setItemForDetailView(prev => 
        prev?.market_hash_name === clickedItem.market_hash_name ? null : clickedItem
    );
    const isCurrentlyInMultiSelect = selectedItemsForBulkAction.find(i => i.market_hash_name === clickedItem.market_hash_name);
    setSelectedItemsForBulkAction(prevSelected =>
      isCurrentlyInMultiSelect
        ? prevSelected.filter(i => i.market_hash_name !== clickedItem.market_hash_name)
        : [...prevSelected, clickedItem]
    );
    setItems(prevState =>
      prevState.map(item =>
        item.market_hash_name === clickedItem.market_hash_name
          ? { ...item, selected: !isCurrentlyInMultiSelect }
          : item
      )
    );
    setMessage(null);
  };
  
  const handleRemoveItemFromSelection = (itemToRemove: InventoryItem) => {
    setSelectedItemsForBulkAction(selectedItemsForBulkAction.filter(i => i.market_hash_name !== itemToRemove.market_hash_name));
    setItems(prevItems =>
      prevItems.map(i =>
        i.market_hash_name === itemToRemove.market_hash_name ? { ...i, selected: false } : i
      )
    );
    if (itemForDetailView?.market_hash_name === itemToRemove.market_hash_name) {
        setItemForDetailView(null);
    }
    setMessage(null);
  };

  const handleWithdrawAction = async () => {
    if (!itemForDetailView) {
        setMessage({type: 'error', text: "Lütfen çekmek için bir eşya seçin."});
        return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'İşlem yapmak için lütfen giriş yapın.' });
      return;
    }
    setProcessingAction('withdraw');
    setMessage({type: 'info', text: `"${itemForDetailView.name}" için çekim isteği işleniyor...`});
    console.log("Çekim isteği (simülasyon):", itemForDetailView); 
    setTimeout(() => {
        setMessage({type: 'success', text: `"${itemForDetailView.name}" için çekim isteği başarıyla oluşturuldu (simülasyon).`});
        const newItems = items.filter(it => it.market_hash_name !== itemForDetailView.market_hash_name);
        setItems(newItems);
        setSelectedItemsForBulkAction(prev => prev.filter(it => it.market_hash_name !== itemForDetailView.market_hash_name));
        setItemForDetailView(null);
        setProcessingAction(null);
    }, 2500);
  };

  const handleSellToMarketAction = async () => {
    if (!itemForDetailView) {
        setMessage({type: 'error', text: "Lütfen satmak için bir eşya seçin."});
        return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ type: 'error', text: 'İşlem yapmak için lütfen giriş yapın.' });
      return;
    }
    setProcessingAction('sell_single');
    setMessage({type: 'info', text: `"${itemForDetailView.name}" pazara geri satılıyor...`});
    console.log("Pazara satma isteği (simülasyon):", itemForDetailView);
    setTimeout(() => {
        setMessage({type: 'success', text: `"${itemForDetailView.name}" pazara geri satıldı (simülasyon).`});
        const newItems = items.filter(it => it.market_hash_name !== itemForDetailView.market_hash_name);
        setItems(newItems);
        setSelectedItemsForBulkAction(prev => prev.filter(it => it.market_hash_name !== itemForDetailView.market_hash_name));
        setItemForDetailView(null);
        setProcessingAction(null);
    }, 2500);
  };
  
  const handleBulkSellClick = () => {
    if (selectedItemsForBulkAction.length > 0) {
        const totalValue = selectedItemsForBulkAction.reduce((sum, item) => sum + (item.market_price_details?.price || 0), 0);
        const token = localStorage.getItem('token');
        if (!token) {
            setMessage({ type: 'error', text: 'İşlem yapmak için lütfen giriş yapın.' });
            return;
        }
        setProcessingAction('sell_bulk');
        setMessage({type: 'info', text: `${selectedItemsForBulkAction.length} eşya toplu satılıyor...`});
        console.log("Toplu satış isteği (simülasyon):", selectedItemsForBulkAction);
        setTimeout(() => {
            setMessage({type: 'success', text: `${selectedItemsForBulkAction.length} eşya toplu satıldı! Toplam Değer: $${totalValue.toFixed(2)} (simülasyon).`});
            const soldItemHashes = selectedItemsForBulkAction.map(si => si.market_hash_name);
            const newItems = items.filter(it => !soldItemHashes.includes(it.market_hash_name));
            setItems(newItems);
            setSelectedItemsForBulkAction([]);
            setItemForDetailView(null);
            setProcessingAction(null);
        }, 3000);
      } else {
        setMessage({type: 'error', text: "Lütfen toplu satmak için en az bir eşya seçin."});
      }
  };

  if (loadingInventory && items.length === 0 && !error) {
    return (
        <div className="container-fluid custom-background text-white vh-100 d-flex flex-column">
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

  if (error && !loadingInventory) { 
    return (
      <div className="container-fluid custom-background text-white vh-100 d-flex flex-column">
        <Navbar />
        <div className="flex-grow-1 d-flex justify-content-center align-items-center text-center">
          <div>
            <p className="text-danger h4">Bir Hata Oluştu!</p>
            <p className="text-danger">{message?.text || error}</p>
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

  return (
    <div className="container-fluid custom-background" style={{minHeight: '100vh'}}>
      <Navbar />
      {message && !error && (
        <div className={`alert ${message.type === 'success' ? 'alert-success' : (message.type === 'info' ? 'alert-info' : 'alert-danger')} mx-auto col-md-10 col-lg-8 mt-3`} role="alert">
          {message.text}
        </div>
      )}
      <div className="row p-md-4 p-2">
        <div className="col-lg-8 col-md-7 mb-4 mb-md-0">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="mb-0">Envanteriniz {steamId && <small className="text-muted-custom fs-6">(ID: {steamId})</small>}</h3>
            {(items.length > 0 || isRefreshingPrices) && (
                 <button 
                 className="btn btn-sm btn-outline-warning" 
                 onClick={handleRefreshNullPrices}
                 disabled={loadingInventory || loadingPricesState || isRefreshingPrices || processingAction !== null}
                 title="Fiyatı alınamayan itemlar için tekrar dene"
               >
                 {isRefreshingPrices ? 
                   (<><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Fiyatlar Yenileniyor...</>) : 
                   "Eksik Fiyatları Yenile"}
               </button>
            )}
          </div>

          {(!loadingInventory && items.length === 0 && !(message && message.type === 'info')) && (
            <div className="alert alert-secondary">Takaslanabilir eşya bulunamadı veya envanteriniz gizli olabilir.</div>
          )}
          <div className="row g-3">
            {items.map((item) => (
              <div className="col-6 col-sm-4 col-md-4 col-lg-3" key={item.market_hash_name}>
                <div
                  className={`card h-100 inventory-item-card 
                    ${selectedItemsForBulkAction.find(si => si.market_hash_name === item.market_hash_name) ? 'selected-multi' : ''} 
                    ${itemForDetailView?.market_hash_name === item.market_hash_name ? 'selected-detail' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="card-img-container">
                    <img
                      src={`https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`}
                      alt={item.name}
                      className="card-img-top"
                    />
                  </div>
                  <div className="card-body d-flex flex-column p-2">
                    <h6 className="item-name flex-grow-1" title={item.name}>{item.name}</h6>
                    <div className="mt-auto item-price-container">
                      {item.loading_price ? (
                        <p className="text-muted-custom small mb-0">Fiyat yükleniyor...</p>
                      ) : item.market_price_details?.price !== null && item.market_price_details?.price !== undefined ? (
                        <p className="text-warning small fw-bold mb-0" title={`Medyan: ${item.market_price_details.median_price_str || 'N/A'} | Hacim: ${item.market_price_details.volume_str || 'N/A'}`}>
                          {item.market_price_details.lowest_price_str || `$${item.market_price_details.price.toFixed(2)}`}
                        </p>
                      ) : (
                        <p className="text-muted-custom small mb-0">Fiyat yok</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="col-lg-4 col-md-5">
          <div className="bg-dark-custom p-3 rounded sticky-top" style={{top: '20px'}}>
            <h5 className="mb-3">Seçili Eşya Detayı</h5>
            {itemForDetailView ? (
              <div className="card bg-secondary text-white p-3">
                <img 
                  src={`https://community.cloudflare.steamstatic.com/economy/image/${itemForDetailView.icon_url}`} // Düzeltildi
                  className="card-img-top mb-3" 
                  alt={itemForDetailView.name} 
                  style={{maxHeight: '200px', objectFit: 'contain'}}
                />
                <h6>{itemForDetailView.name}</h6>
                <p className="small">
                  Fiyat: {itemForDetailView.loading_price ? "Yükleniyor..." : 
                         (itemForDetailView.market_price_details?.price !== null && itemForDetailView.market_price_details?.price !== undefined 
                            ? <span className="text-warning fw-bold">{itemForDetailView.market_price_details.lowest_price_str || `$${itemForDetailView.market_price_details.price.toFixed(2)}`}</span>
                            : "Fiyat yok")}
                </p>
                {itemForDetailView.market_price_details?.median_price_str && <p className="small text-muted-custom mb-0">Medyan: {itemForDetailView.market_price_details.median_price_str}</p>}
                {itemForDetailView.market_price_details?.volume_str && <p className="small text-muted-custom">Hacim: {itemForDetailView.market_price_details.volume_str}</p>}
                
                <button 
                    className="btn btn-warning w-100 mb-2 mt-3"
                    onClick={handleWithdrawAction}
                    disabled={processingAction !== null}
                  >
                    {processingAction === 'withdraw' ? (<><span className="spinner-border spinner-border-sm"></span> Çekiliyor...</>) : 'Bu Eşyayı Çek'}
                  </button>
                  <button 
                    className="btn btn-info w-100"
                    onClick={handleSellToMarketAction}
                    disabled={processingAction !== null}
                  >
                    {processingAction === 'sell_single' ? (<><span className="spinner-border spinner-border-sm"></span> Satılıyor...</>) : 'Pazara Geri Sat'}
                  </button>
              </div>
            ) : (
              <div className="text-center text-muted-custom p-5 border border-secondary rounded">
                <p>Detaylarını görmek ve işlem yapmak için soldaki envanterinizden bir eşya seçin.</p>
              </div>
            )}
            
            <hr className="my-4"/>

            <h5 className="text-white mb-3">
              {selectedItemsForBulkAction.length === 0
                ? 'Toplu Satış İçin Eşya Seçilmedi'
                : `${selectedItemsForBulkAction.length} Eşya Satış İçin Seçildi`}
            </h5>
            <div className="selected-items-list mt-3">
              {selectedItemsForBulkAction.length === 0 && <p className="text-muted-custom small">Toplu satmak için envanterden eşyalar seçin.</p>}
              {selectedItemsForBulkAction.map((selectedItem) => (
                <div key={selectedItem.market_hash_name} className="selected-item">
                  <img
                    src={`https://community.cloudflare.steamstatic.com/economy/image/${selectedItem.icon_url}`} // Düzeltildi
                    alt={selectedItem.name}
                    className="selected-item-img"
                  />
                  <div className="selected-item-details">
                    <span className="selected-item-name">{selectedItem.name}</span>
                    {selectedItem.market_price_details?.price !== null && selectedItem.market_price_details?.price !== undefined ? (
                         <span className="selected-item-price text-warning">
                            {selectedItem.market_price_details.lowest_price_str || `$${selectedItem.market_price_details.price.toFixed(2)}`}
                         </span>
                    ) : (
                        <span className="text-muted-custom small">Fiyat yok</span>
                    )}
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger remove-item-btn"
                    onClick={(e) => { e.stopPropagation(); handleRemoveItemFromSelection(selectedItem);}}
                    title="Kaldır"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn btn-success mt-4 w-100"
              disabled={selectedItemsForBulkAction.length === 0 || loadingInventory || loadingPricesState || isRefreshingPrices || processingAction !== null}
              onClick={handleBulkSellClick}
            >
              {processingAction === 'sell_bulk' ? (<><span className="spinner-border spinner-border-sm"></span> Satılıyor...</>) : `Seçilenleri Sat (${selectedItemsForBulkAction.length})`}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-background { background-color: hsl(0, 0%, 10%); color: #e0e0e0; min-height: 100vh; }
        .custom-background h1, .custom-background h2, .custom-background h3, .custom-background h4, .custom-background h5, .custom-background h6 { color: #ffffff; }
        .text-muted-custom { color: #868e96 !important; }
        .inventory-item-card { background-color: #1f2933 !important; border: 1px solid #323f4b !important; border-radius: 0.5rem; transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; cursor: pointer; }
        .inventory-item-card:hover { transform: translateY(-4px); box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2); }
        .inventory-item-card.selected-multi { border-color: #0dcaf0 !important; /* Bootstrap info */ box-shadow: 0 0 0 0.2rem rgba(13, 202, 240, 0.25) !important; opacity: 0.9; }
        .inventory-item-card.selected-detail { border-color: #ffc107 !important; /* Bootstrap warning */ box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.5) !important; transform: translateY(-2px) scale(1.02); opacity: 1; }
        .card-img-container { padding: 0.75rem; background-color: #2a3b49; border-top-left-radius: calc(0.5rem - 1px); border-top-right-radius: calc(0.5rem - 1px); display: flex; justify-content: center; align-items: center; min-height: 120px; }
        .card-img-top { max-height: 100px; object-fit: contain; image-rendering: pixelated; }
        .inventory-item-card .item-name { font-size: 0.8rem; font-weight: 500; line-height: 1.2; height: 2.4em; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 0.25rem; color: #f0f0f0; }
        .bg-dark-custom { background-color: #1f2933 !important; }
        .selected-items-list { max-height: 300px; overflow-y: auto; padding-right: 5px; }
        .selected-item { display: flex; align-items: center; background-color: #2a3b49; padding: 0.5rem; border-radius: 0.375rem; margin-bottom: 0.5rem; }
        .selected-item-img { width: 40px; height: auto; margin-right: 0.75rem; border-radius: 0.25rem; }
        .selected-item-details { flex-grow: 1; overflow: hidden; }
        .selected-item-name { display: block; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #f0f0f0; }
        .selected-item-price { display: block; font-size: 0.75rem; font-weight: bold; }
        .remove-item-btn { padding: 0.1rem 0.4rem; font-size: 0.9rem; line-height: 1; }
      `}</style>
    </div>
  );
}