'use client';

import React from 'react';
import Navbar from 'src/app/components/navbar'; // Yolunu kendi proje yapına göre güncelle
import 'bootstrap/dist/css/bootstrap.min.css';

export default function BlogPage() {
  return (
    <div className="container-fluid custom-background">
      <Navbar />

      <div className="container mt-5 text-white">
        <h1 className="mb-4 text-center">Counter Strike 2 Güncellemeler</h1>

        {/* Counter-Strike 2 Update Boxes */}
        <div className="update-box mb-5">
          <h3 className="text-center ">📅 1 Nisan 2025 - Counter-Strike 2 Güncellemesi</h3>
          <div className="update-content">
            <h4>Haftalık Ödül Paketi</h4>
            <p>Haftalık Ödül Paketi listesine üç yeni silah koleksiyonu eklendi: Ascent, Boreal ve Radiant.</p>
            <p>Haftalık Ödül Paketi listesinden dört silah koleksiyonu kaldırıldı: Bank, Italy, Lake ve orijinal Train koleksiyonu.</p>

            <h4>Cephanelik</h4>
            <p>Yeni Cephanelik içeriği eklendi: Train 2025 Koleksiyonu, Ateş Kasası. Yeni bir sınırlı sürüm eşyası: XM1014 | Issızlık.</p>

            <h4>Haritalar</h4>
            <p><strong>Inferno:</strong> Muz bölgesi, CS:GO'daki boyutuna benzeyecek şekilde değiştirildi. T rampasının arka planı sadeleştirildi.</p>
            <p><strong>Train:</strong> Bombalama alanı A'nın ana girişinin üstündeki pencerelerden oyuncu gölgelerinin görülebildiği hata düzeltildi.</p>
          </div>
        </div>

        <div className="update-box mb-5">
          <h3 className="text-center">📅 21 Mart 2025 - Counter-Strike 2 Güncellemesi</h3>
          <div className="update-content">
            <h4>Haritalar</h4>
            <p>Basalt haritası Steam Atölyesi'ndeki son sürümle güncellendi. Güncelleme notlarına buradan ulaşabilirsiniz.</p>

            <h4>Atölye</h4>
            <p>Counter-Strike 2 Steam Atölyesi'ne Sosisli Süsler için desen oluşturma ve gönderme desteği eklendi.</p>
          </div>
        </div>

        <div className="update-box mb-5">
          <h3 className="text-center">📅 28 Şubat 2025 - Counter-Strike 2 Güncellemesi</h3>
          <div className="update-content">
            <h4>Haritalar</h4>
            <p>Inferno: Kazan girişinden görünür olan kilisedeki çatı geometrisi düzeltildi.</p>

            <h4>Çeşitli</h4>
            <p>Bir Steam Atölyesi haritasından çıkıldıktan sonra sesli sohbetin çalışmaması düzeltildi.</p>
          </div>
        </div>

        <div className="update-box mb-5">
          <h3 className="text-center">📅 14 Şubat 2025 - Counter-Strike 2 Güncellemesi</h3>
          <div className="update-content">
            <h4>Arayüz</h4>
            <p>Satın alma menüsü ve oyun içi gösterge arasında paylaşılan kullanıcı arayüzü öğelerinin boyutu ve ölçeklenmesi düzeltildi.</p>
            <p>CSTV izleyicileri için zırh görüntüleme hatası düzeltildi.</p>

            <h4>Atölye</h4>
            <p>Counter-Strike 2 Steam Atölye haritaları için desteklenen yükleme boyutu 3 GB'a çıkarıldı.</p>
          </div>
        </div>

        <div className="update-box mb-5">
          <h3 className="text-center">📅 7 Şubat 2025 - Counter-Strike 2 Güncellemesi</h3>
          <div className="update-content">
            <h4>Seçkin</h4>
            <p>Oyuncuların CS derecelerinin, eşleştirmeye birlikte katılmak için birbirinden çok farklı olduğu durumları belirleyen mantıkta ayarlamalar yapıldı.</p>

            <h4>Arayüz</h4>
            <p>"Hizmet Madalyası Al" kullanıcı arayüzü öğesi doğrudan ana menüdeki profil kartına eklendi.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
