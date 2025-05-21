'use client';

import React, { useState } from 'react';
import Navbar from 'src/app/components/navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function PaymentPage() {
  const [formData, setFormData] = useState({
    amount: '',
    cardName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('Lütfen geçerli bir bakiye miktarı girin.');
      return;
    }
    // Ödeme işleme mantığı buraya eklenecek
    console.log('Yüklenecek bakiye:', amount);
    console.log('Kart bilgileri:', formData);
    alert(`${amount.toFixed(2)} USD bakiyeniz yükleniyor.`);
  };

  return (
    <div className="container-fluid p-0 custom-background">
      <Navbar />
      <div className="row m-0 g-0 justify-content-center py-5">
        <div className="col-12 col-md-6 col-lg-4 bg-payment rounded-2xl shadow p-4">
          <h3 className="payment-page-title text-center">Bakiye Yükleme</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="amount" className="custom-label">
                Yüklenecek Tutar (USD)
              </label>
              <input
                type="number"
                step="1"
                id="amount"
                name="amount"
                className="form-control"
                placeholder="Örneğin: 50.00"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="cardName" className="custom-label">
                Kart Sahibinin Adı
              </label>
              <input
                type="text"
                id="cardName"
                name="cardName"
                className="form-control"
                placeholder="Adınızı Soyadınızı girin"
                value={formData.cardName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="cardNumber" className="custom-label">
                Kart Numarası
              </label>
              <input
                type="text"
                id="cardNumber"
                name="cardNumber"
                className="form-control"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                value={formData.cardNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="row g-3 mb-3">
              <div className="col-6">
                <label htmlFor="expiryMonth" className="custom-label">
                  Son Kullanma Ay
                </label>
                <input
                  type="text"
                  id="expiryMonth"
                  name="expiryMonth"
                  className="form-control"
                  placeholder="MM"
                  maxLength={2}
                  value={formData.expiryMonth}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-6">
                <label htmlFor="expiryYear" className="custom-label">
                  Son Kullanma Yıl
                </label>
                <input
                  type="text"
                  id="expiryYear"
                  name="expiryYear"
                  className="form-control"
                  placeholder="YY"
                  maxLength={2}
                  value={formData.expiryYear}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="cvv" className="custom-label">
                CVV
              </label>
              <input
                type="password"
                id="cvv"
                name="cvv"
                className="form-control"
                placeholder="123"
                maxLength={4}
                value={formData.cvv}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn-primary sign-in-button w-100">
              Bakiyeyi Yükle
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
