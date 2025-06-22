// src/app/sss/page.tsx
'use client';

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import Navbar from 'src/app/components/navbar';
// CSS dosyanızı import edin
// import 'src/app/admin/admin-styles.css'; // Örnek

type FaqItem = {
  id: string;
  question: string;
  answer_html: string;
  category: string;
  order: number;
  is_active: boolean; // API'den geliyor ama şu anki gösterimde kullanılmıyor
};

export default function FAQComponent() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null); // Hangi S.S.S. açık

  useEffect(() => {
    setLoading(true);
    setError(null); // Önceki hataları temizle
    fetch('/api/faq') // API endpoint'imiz
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.message || 'S.S.S. yüklenemedi.');
          }).catch(() => {
            throw new Error(`S.S.S. yüklenemedi. Sunucu hatası: ${res.status}`);
          });
        }
        return res.json();
      })
      .then((data: FaqItem[]) => {
        // API zaten aktif ve sıralanmışları dönüyor
        setFaqs(data);
      })
      .catch(err => {
        console.error("FAQ fetch error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleAccordion = (id: string) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  if (loading) {
    return (
        <div className="container-fluid custom-background"> {/* CSS'inizdeki class */}
            <Navbar />
            <div className="container mt-5 text-white text-center">
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Yükleniyor...</span>
                </div>
                <p className="mt-2">S.S.S. yükleniyor...</p>
            </div>
        </div>
    );
  }
  if (error) {
    return (
        <div className="container-fluid custom-background"> {/* CSS'inizdeki class */}
            <Navbar />
            <div className="container mt-5">
                <div className="alert alert-danger text-center">Hata: {error}</div>
            </div>
        </div>
    );
  }

  // S.S.S.'leri kategoriye göre grupla (opsiyonel ama daha düzenli gösterim için iyi)
  const groupedFaqs: Record<string, FaqItem[]> = faqs.reduce((acc, faq) => {
    const category = faq.category || 'Diğer Sorular'; // Kategorisi olmayanlar için varsayılan
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, FaqItem[]>);

  return (
    <div className="container-fluid custom-background"> {/* CSS'inizdeki class */}
      <Navbar />
      <div className="container mt-5"> {/* Sadece container kullandım, faq-container'a gerek yok */}
        <h1 className="text-center text-white mb-5">Sıkça Sorulan Sorular</h1>

        {Object.keys(groupedFaqs).length === 0 && !loading && (
            <p className="text-center alert alert-info">S.S.S. bulunamadı.</p>
        )}

        {Object.entries(groupedFaqs).map(([category, itemsInCategory]) => (
          <div key={category} className="mb-5">
            <h2 className="text-white mb-4 pb-2 border-bottom">{category}</h2>
            <div className="accordion" id={`faqAccordion-${category.replace(/\s+/g, '-')}`}>
              {itemsInCategory.map((faq, index) => (
                <div className="accordion-item faq-accordion-item" key={faq.id}>
                  <h2 className="accordion-header" id={`heading-${faq.id}`}>
                    <button 
                      className={`accordion-button faq-accordion-button ${openAccordion !== faq.id ? 'collapsed' : ''}`}
                      type="button" 
                      onClick={() => toggleAccordion(faq.id)}
                      aria-expanded={openAccordion === faq.id}
                      aria-controls={`collapse-${faq.id}`}
                    >
                      {faq.question}
                    </button>
                  </h2>
                  <div 
                    id={`collapse-${faq.id}`}
                    className={`accordion-collapse collapse ${openAccordion === faq.id ? 'show' : ''}`}
                    aria-labelledby={`heading-${faq.id}`}
                    // data-bs-parent={`#faqAccordion-${category.replace(/\s+/g, '-')}`} // Eğer accordion group davranışı isteniyorsa
                  >
                    <div className="accordion-body faq-accordion-body"
                         dangerouslySetInnerHTML={{ __html: faq.answer_html }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* S.S.S. için ek stiller (Bootstrap accordion'u özelleştirmek için) */}
      <style jsx global>{`
        .faq-accordion-item {
            background-color: #282828; /* CSS'inizdeki .update-box rengi */
            border: 1px solid #444;
            margin-bottom: 0.5rem;
        }
        .faq-accordion-button {
            background-color: #343a40; /* Koyu gri */
            color: #f8f9fa; /* Açık renk */
            font-weight: 500;
            border-radius: 0 !important; /* Köşeleri sıfırla */
        }
        .faq-accordion-button:not(.collapsed) {
            background-color: #c2a061; /* CSS'inizdeki altın rengi */
            color: #212529; /* Koyu metin */
            box-shadow: inset 0 -1px 0 rgba(0,0,0,.125);
        }
        .faq-accordion-button:focus {
            box-shadow: 0 0 0 0.25rem rgba(255, 193, 7, 0.25); /* Odaklanma rengi */
        }
        .faq-accordion-button::after { /* Bootstrap ok ikonu rengi */
            filter: invert(1) grayscale(100%) brightness(200%);
        }
        .faq-accordion-button:not(.collapsed)::after {
            filter: none; /* Açıkken normal renk */
        }
        .faq-accordion-body {
            background-color: #2c2c2c; /* Biraz daha açık bir arkaplan */
            color: #e0e0e0; /* Cevap metni rengi */
        }
        .faq-accordion-body p:last-child {
            margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}