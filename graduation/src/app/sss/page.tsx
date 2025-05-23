'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // next/navigation kullanımı
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar'; // Navbar bileşeni eklendi

type Item = {
  name: string;
  image: string;
};

export default function FAQComponent() {
  const [selectedFilters, setSelectedFilters] = useState({
    searchQuery: '',
    priceRange: { min: 0, max: 1000 },
  });

  const [user, setUser] = useState<{ name: string } | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Router burada next/navigation'dan geliyor

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    fetch('/api/items')
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleBalanceClick = () => {
    router.push('/payment'); // Ödeme sayfasına yönlendirme
  };

  const handleProfileClick = () => {
    // Profil sayfasına yönlendir
    router.push('/profile');
  };

  return (
    <div className="container-fluid custom-background">
      <Navbar />

      <div className="faq-container d-flex mt-4">
        {/* Sol menü */}
        <div className="faq-sidebar">
          <h3 className="text-white mb-4">Sıkça Sorulan Sorular</h3>
          
          <div className="faq-menu">
            <div className="menu-section mb-4">
              <div className="menu-item text-white-50 mb-2">
                1. Sitemde nasıl işlem yapabilirim?
              </div>
              <div className="menu-item text-white-50 mb-2">
                2. Eşyalarımı nasıl satabilirim?
              </div>
              <div className="menu-item text-white-50 mb-2">
                3. Eşyaların fiyatları nasıl belirleniyor?
              </div>
              <div className="menu-item text-white-50 mb-2">
                4. Ödemeyi nasıl yapabilirim?
              </div>
              <div className="menu-item text-white-50 mb-2">
                5. Eşyalarımı nasıl alabilirim?
              </div>
              <div className="menu-item text-white-50 mb-2">
                6. Satın aldığım eşyalar ne zaman hesabıma gelir?
              </div>
              <div className="menu-item text-white-50 mb-2">
                7. Hesabımda sorun yaşarsam ne yapmalıyım?
              </div>
              <div className="menu-item text-white-50 mb-2">
                8. Sitemiz ne kadar güvenli?
              </div>
            </div>
          </div>
        </div>

        {/* Sağ içerik alanı */}
        <div className="faq-content">
          <div className="content-section mb-5">
            <h2 className="text-white mb-4">1. Sitemde nasıl işlem yapabilirim?</h2>
            <p className="text-white-50">
                Sitemize üye olduktan sonra, Counter Strike 2 eşyalarınızı satın alabilir veya satabilirsiniz. Satış yapmak için, envanterinizden eşya seçerek satışa çıkartabilir, satın almak için istediğiniz eşyayı sepete ekleyerek ödeme işlemini tamamlayabilirsiniz.
            </p>
          </div>

          <div className="content-section mb-5">
            <h2 className="text-white mb-4">2. Eşyalarımı nasıl satabilirim?</h2>
            <p className="text-white-50">
                Eşyalarınızı satabilmek için, öncelikle sitemize üye olmanız gerekmektedir. Üyeliğinizi oluşturduktan sonra, envanterinizden satmak istediğiniz eşyayı seçin, fiyat belirleyin ve satışa sunun. Satış işlemi tamamlandığında, kazancınız hesabınıza aktarılacaktır.
            </p>
          </div>

          <div className="content-section mb-5">
            <h2 className="text-white mb-4">3. Eşyaların fiyatları nasıl belirleniyor?</h2>
            <p className="text-white-50">
                Eşyaların fiyatları, piyasa talebine ve sitemizdeki mevcut satış fiyatlarına göre belirlenir. Kullanıcılar, eşyalarını istedikleri fiyatla satışa çıkarabilir, ancak sitemiz, aşırı yüksek veya düşük fiyatları engellemek için belirli bir aralıkta fiyat düzenlemesi yapabilir.
            </p>
          </div>

          <div className="content-section mb-5">
            <h2 className="text-white mb-4">4. Ödemeyi nasıl yapabilirim?</h2>
            <p className="text-white-50">
                Ödemeler, kredi kartı, banka transferi veya sitemizdeki diğer ödeme yöntemleriyle yapılabilir. Ödeme işlemi, güvenli ödeme altyapımız aracılığıyla gerçekleşir ve bilgilerinizin güvenliği sağlanır.
            </p>
          </div>

          <div className="content-section mb-5">
            <h2 className="text-white mb-4">5. Eşyalarımı nasıl alabilirim?</h2>
            <p className="text-white-50">
                Eşyaları almak için, sitemizdeki mağaza sekmesinden veya kullanıcılar tarafından satılan eşyalardan seçim yapabilirsiniz. Beğendiğiniz eşyayı sepete ekleyip ödeme işlemini tamamladıktan sonra, eşya hesabınıza aktarılır.
            </p>
          </div>

          <div className="content-section mb-5">
            <h2 className="text-white mb-4">6. Satın aldığım eşyalar ne zaman hesabıma gelir?</h2>
            <p className="text-white-50">
                Satın alma işlemi tamamlandıktan sonra, eşyalarınız genellikle 15 dakika içinde hesabınıza aktarılır. Ancak, bazı durumlarda işlemlerin tamamlanması birkaç dakika sürebilir.
            </p>
          </div>

          <div className="content-section mb-5">
            <h2 className="text-white mb-4">7. Hesabımda sorun yaşarsam ne yapmalıyım?</h2>
            <p className="text-white-50">
                Herhangi bir sorunla karşılaştığınızda, destek ekibimizle iletişime geçebilirsiniz. İletişim bilgilerimiz sitemizin "İletişim" sekmesinde yer almaktadır.
            </p>
          </div>

          <div className="content-section mb-5">
            <h2 className="text-white mb-4">8. Sitemiz ne kadar güvenli?</h2>
            <p className="text-white-50">
                Sitemiz, kullanıcı güvenliğini ön planda tutarak gelişmiş şifreleme ve güvenlik önlemleri kullanmaktadır. Ödemeler, güvenli ödeme altyapılarımızla yapılır ve kişisel bilgileriniz korunur.
            </p>
          </div>
          
          
        </div>
      </div>
    </div>
  );
}
