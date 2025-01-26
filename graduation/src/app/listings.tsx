'use client';

import React, { useState, useEffect } from 'react';

type Listing = {
  item: {
    item_name: string;
    wear_name: string;
    description: string;
    collection: string;
    float_value: number;
    scm: {
      price: number;
    };
  };
};

type FilteredListing = {
  itemName: string;
  wearName: string;
  description: string;
  collection: string;
  floatValue: number;
  scmPrice: number;
};

export default function Listings() {
  const [listings, setListings] = useState<FilteredListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch('/api/listings');
        if (!response.ok) {
          throw new Error('Veri çekme hatası');
        }
        const data: Listing[] = await response.json();

        // İhtiyacınız olan alanları seçin
        const filteredData: FilteredListing[] = data.map(listing => ({
          itemName: listing.item.item_name,
          wearName: listing.item.wear_name,
          description: listing.item.description,
          collection: listing.item.collection,
          floatValue: listing.item.float_value,
          scmPrice: listing.item.scm.price,
        }));

        setListings(filteredData);
      } catch (error) {
        setError((error as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;

  return (
    <div>
      <h1>Aktif Listeler</h1>
      <ul>
        {listings.map((listing, index) => (
          <li key={index}>
            <p>Ürün Adı: {listing.itemName}</p>
            <p>Aşınma Durumu: {listing.wearName}</p>
            <p>Açıklama: {listing.description}</p>
            <p>Koleksiyon: {listing.collection}</p>
            <p>Float Değeri: {listing.floatValue}</p>
            <p>SCM Fiyatı: {listing.scmPrice}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}