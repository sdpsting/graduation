'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useEffect, useState } from 'react';
import Navbar from 'src/app/components/navbar'; // Navbar importunun doğru olduğundan emin olun

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
  const [steamId, setSteamId] = useState<string | null>(null);

  // 1. Adım: Component yüklendiğinde localStorage'dan 'user' objesini çek ve içinden steamId'yi al
  useEffect(() => {
    const storedUserString = localStorage.getItem('user'); // 'user' anahtarını kullanıyoruz

    if (storedUserString) {
      try {
        const userData = JSON.parse(storedUserString);
        // userData'nın ve userData.steamId'nin varlığını kontrol et
        if (userData && userData.steamId) {
          setSteamId(userData.steamId);
          // setLoading(true) burada set etmeye gerek yok, ikinci useEffect steamId değişince tetiklenecek
          // ve orada setLoading(true) yapılıyor.
          setError(null); // Önceki hataları temizle (isteğe bağlı)
        } else {
          // steamId user objesinde yoksa veya user objesi beklenen formatta değilse
          setError('Kullanıcı oturum bilgileri eksik veya Steam ID bulunamadı. Lütfen tekrar giriş yapın.');
          setLoading(false);
        }
      } catch (parseError) {
        console.error("localStorage'daki 'user' verisi parse edilemedi:", parseError);
        setError("Kullanıcı oturum bilgileri bozuk. Lütfen tekrar giriş yapın.");
        localStorage.removeItem('user'); // Bozuk veriyi temizle
        setLoading(false);
      }
    } else {
      // localStorage'da 'user' anahtarı yoksa (kullanıcı hiç giriş yapmamış)
      setError('Kullanıcı girişi yapılmamış. Lütfen giriş yapın.');
      setLoading(false);
    }
  }, []); // Sadece component ilk yüklendiğinde çalışır

  // 2. Adım: Steam ID state'i güncellendikten sonra envanteri çek
  useEffect(() => {
    if (!steamId) {
      // Eğer steamId hala null ise (ya localStorage'da yoktu, ya parse edilemedi ya da steamId objede yoktu)
      // ve loading hala true ise (ve başka bir hata yoksa)
      if (loading && !error) {
        // Bu durum genellikle ilk useEffect'teki setError ile handle edilir,
        // ama bir güvenlik önlemi olarak burada da loading'i false yapabiliriz.
        // setError zaten ayarlanmış olabilir.
        setLoading(false);
      }
      return;
    }

    setLoading(true); // Envanter çekme işlemi başlıyor
    setError(null);   // Önceki envanter hatalarını temizle

    fetch(`https://steamcommunity.com/inventory/${steamId}/730/2?l=english`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 403) throw new Error('Steam envanteri gizli veya erişilemiyor.');
          if (res.status === 429) throw new Error('Steam API\'ye çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.');
          // Diğer olası hatalar (örn: 400, 401, 500) için
          throw new Error(`Steam API hatası: ${res.status} - ${res.statusText || 'Bilinmeyen hata'}`);
        }
        return res.json();
      })
      .then(data => {
        if (!data) { // data null veya undefined ise
            setError('Steam API\'den boş yanıt alındı.');
            setItems([]);
            return;
        }
        if (data.success === false && data.Error) { // Steam API bazen bu formatta hata dönebilir
            setError(`Envanter alınamadı: ${data.Error}`);
            setItems([]);
            return;
        }
        if (!data.descriptions) { // descriptions alanı yoksa
            setError('Envanter içeriği (descriptions) bulunamadı veya envanter boş/gizli.');
            setItems([]);
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
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Envanter çekilirken bilinmeyen bir hata oluştu.');
        setItems([]); // Hata durumunda eşyaları temizle
      })
      .finally(() => {
        setLoading(false);
      });
  }, [steamId]); // Bu effect, steamId state'i değiştiğinde çalışır

  // Handle fonksiyonları (bunlar değişmedi)
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
      alert(`${selectedItems.length} eşya satıldı!`); // Burası daha sonra gerçek bir API çağrısı olacak
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

  // Yükleme ve hata mesajlarını göster
  if (loading) {
    return (
      <div className="container-fluid custom-background text-white" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid custom-background text-white" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div>
            <p className="text-danger h4">Hata!</p>
            <p className="text-danger">{error}</p>
            {error.toLowerCase().includes("giriş yapılmamış") || error.toLowerCase().includes("oturum") ? (
              <button className="btn btn-primary mt-2" onClick={() => window.location.href = '/login'}>
                Giriş Yap
              </button>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  // Eğer steamId başarıyla alındıysa ama envanter boşsa veya hata yoksa ve yükleme bittiyse
  return (
    <div className="container-fluid custom-background text-white">
      <Navbar />
      <div className="row p-4">
        {/* Envanter */}
        <div className="col-md-8">
          <h3 className="mb-4">Envanteriniz {steamId && <small className="text-muted">(ID: {steamId})</small>}</h3>
          {items.length === 0 ? (
            <p>Takaslanabilir eşya bulunamadı veya envanteriniz gizli olabilir.</p>
          ) : (
            <div className="row">
              {items.map((item) => (
                <div className="col-6 col-md-4 col-lg-3 mb-4" key={item.market_hash_name}>
                  <div
                    className="card-items"
                    style={{
                      backgroundColor: '#222',
                      borderRadius: '8px',
                      padding: '10px',
                      opacity: item.selected ? 0.5 : 1,
                      cursor: 'pointer',
                      border: item.selected ? '2px solid #ffc107' : '2px solid transparent', // Seçiliyse kenarlık
                      transition: 'opacity 0.2s, border 0.2s',
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    <img
                      src={`https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`}
                      alt={item.name}
                      className="img-fluid"
                      style={{ imageRendering: 'pixelated' }} // CS itemları için daha iyi görünebilir
                    />
                    <h6 className="mt-2 text-white" style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</h6>
                    {/* Satışa Ekle butonu doğrudan tıklamayla seçime entegre edildiği için
                        ayrı bir "Satışa Ekle" butonuna burada gerek kalmayabilir,
                        handleItemClick zaten seçili listesine ekliyor/çıkarıyor.
                        Eğer hala ayrı bir "Satışa Ekle" butonu isteniyorsa handleSelectItem kullanılabilir.
                    */}
                    {/*
                    <button
                      className={`btn btn-sm mt-2 w-100 ${item.selected ? 'btn-secondary' : 'btn-warning'}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Kart tıklamasını engeller
                        handleItemClick(item); // veya handleSelectItem(item)
                      }}
                    >
                      {item.selected ? 'Seçimi Kaldır' : 'Satışa Ekle'}
                    </button>
                    */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ Panel */}
        <div className="col-md-4">
          <div className="bg-dark p-3 rounded">
            <h5 className="text-white mb-3">
              {selectedItems.length === 0
                ? 'Eşya seçilmedi'
                : `${selectedItems.length} eşya seçildi`}
            </h5>
            <div className="mt-3" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
              {selectedItems.map((item) => (
                <div key={item.market_hash_name} className="d-flex align-items-center mb-2" style={{ backgroundColor: '#333', padding: '8px', borderRadius: '8px' }}>
                  <img
                    src={`https://community.cloudflare.steamstatic.com/economy/image/${item.icon_url}`}
                    alt={item.name}
                    width="35"
                    className="me-2 rounded"
                  />
                  <span className="text-white" style={{ fontSize: '0.85rem', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  <button
                    className="btn btn-sm btn-danger ms-auto"
                    onClick={() => handleRemoveItem(item)} // Bu da handleItemClick(item) ile değiştirilebilir
                    title="Kaldır"
                  >
                    <i className="bi bi-trash"></i> {/* Bootstrap Icons kullanıyorsanız */}
                    {/* Eğer Bootstrap Icons yoksa basitçe 'X' yazabilirsiniz */}
                    {/* X */}
                  </button>
                </div>
              ))}
            </div>
            <button
              className="btn btn-success mt-4 w-100"
              disabled={selectedItems.length === 0}
              onClick={handleSellClick}
            >
              Seçilenleri Sat ({selectedItems.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}