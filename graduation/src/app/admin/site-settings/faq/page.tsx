// src/app/admin/site-settings/faq/page.tsx
'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import Navbar from 'src/app/components/navbar';
// import type { FaqItem } from '@/types';
type FaqItem = {
    id: string; question: string; answer_html: string; category: string; order: number; is_active: boolean;
};

export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [question, setQuestion] = useState('');
  const [answerHtml, setAnswerHtml] = useState('');
  const [category, setCategory] = useState('Genel');
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [formMessage, setFormMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFaqs = useCallback(async () => {
    setIsLoading(true); setMessage(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({type: 'error', text: 'Yetki bulunamadı. Lütfen giriş yapın.'});
      setIsLoading(false); return;
    }
    try {
      const res = await fetch('/api/admin/faq', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) { const d = await res.json().catch(()=>null); throw new Error(d?.message || 'S.S.S. yüklenemedi');}
      const data: FaqItem[] = await res.json();
      setFaqs(data);
    } catch (err: any) { setMessage({type: 'error', text: err.message}); } 
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchFaqs(); }, [fetchFaqs]);

  const handleAddNew = () => { 
    resetForm(); 
    setEditingFaq(null); 
    // Yeni eklenecek item için varsayılan order'ı ayarla
    const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.order || 0)) : 0;
    setOrder(maxOrder + 1);
    setShowForm(true); 
  };
  const handleEdit = (faq: FaqItem) => {
    setEditingFaq(faq);
    setQuestion(faq.question); setAnswerHtml(faq.answer_html); setCategory(faq.category);
    setOrder(faq.order); setIsActive(faq.is_active);
    setShowForm(true); setFormMessage(null); window.scrollTo(0, 0);
  };

  const handleDelete = async (faqId: string) => {
    const faqToDelete = faqs.find(f => f.id === faqId);
    if (!confirm(`"${faqToDelete?.question || 'Bu S.S.S.'}" maddesini silmek istediğinizden emin misiniz?`)) return;
    
    const token = localStorage.getItem('token');
    if (!token) { setMessage({type: 'error', text: 'Yetki bulunamadı.'}); return; }

    const originalFaqs = [...faqs];
    setFaqs(prev => prev.filter(f => f.id !== faqId));
    setMessage({type:'info', text:`"${faqToDelete?.question || 'S.S.S.'}" siliniyor...`});
    try {
      const res = await fetch(`/api/admin/faq/${faqId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) { setFaqs(originalFaqs); throw new Error(data.message || 'Silme işlemi başarısız');}
      setMessage({type:'success', text:data.message || 'S.S.S. başarıyla silindi.'});
      if (editingFaq?.id === faqId) resetForm();
    } catch (err: any) { setFaqs(originalFaqs); setMessage({type:'error', text:`Silme hatası: ${err.message}`}); }
  };
  
  const resetForm = () => {
    setEditingFaq(null); setQuestion(''); setAnswerHtml(''); setCategory('Genel'); 
    const maxOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.order || 0)) : 0;
    setOrder(maxOrder + 1);
    setIsActive(true); setShowForm(false); setFormMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setIsSubmitting(true); setFormMessage(null);
    const token = localStorage.getItem('token');
    if (!token) {
        setFormMessage({type: 'error', text: 'Yetki bulunamadı.'});
        setIsSubmitting(false); return;
    }
    const faqData = { 
        question: question.trim(), answer_html: answerHtml, category: category.trim() || "Genel", 
        order: Number(order) || 0, is_active: isActive 
    };
    if (!faqData.question || !faqData.answer_html) {
        setFormMessage({type: 'error', text: "Soru ve Cevap alanları boş bırakılamaz."});
        setIsSubmitting(false); return;
    }
    const url = editingFaq ? `/api/admin/faq/${editingFaq.id}` : '/api/admin/faq';
    const method = editingFaq ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { 
        method, 
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, 
        body: JSON.stringify(faqData) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem başarısız');
      setFormMessage({type:'success', text:data.message});
      fetchFaqs(); resetForm();
    } catch (err: any) { setFormMessage({type:'error', text:`Hata: ${err.message}`}); } 
    finally { setIsSubmitting(false); }
  };
  
  if (isLoading) return (
    <div className="container-fluid custom-admin-background">
        <Navbar/>
        <div className="container mt-5 text-center"><p>S.S.S. Yönetimi yükleniyor...</p></div>
    </div>
  );

  return (
    <div className="container-fluid custom-admin-background">
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>S.S.S. Yönetimi</h1>
          {!showForm && <button onClick={handleAddNew} className="btn btn-success"><i className="bi bi-plus-circle-fill me-2"></i>Yeni S.S.S. Ekle</button>}
        </div>

        {message && (
            <div className={`alert ${message.type === 'success' ? 'alert-success' : message.type === 'info' ? 'alert-info' : 'alert-danger'} alert-dismissible fade show`} role="alert">
                {message.text}
                <button type="button" className="btn-close" onClick={() => setMessage(null)} aria-label="Close"></button>
            </div>
        )}

        {showForm && (
          <div className="card bg-dark text-white mb-4 border-secondary shadow-lg">
            <div className="card-header d-flex justify-content-between align-items-center">
                {editingFaq ? `S.S.S. Düzenle: "${editingFaq.question.substring(0,30)}..."` : 'Yeni S.S.S. Oluştur'}
                <button type="button" className="btn-close btn-close-white" onClick={resetForm} aria-label="Formu Kapat"></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="question" className="form-label">Soru</label>
                  <input type="text" className="form-control form-control-sm bg-light border-dark text-dark" id="question" value={question} onChange={e => setQuestion(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="answerHtml" className="form-label">Cevap (HTML)</label>
                  <textarea className="form-control form-control-sm bg-light border-dark text-dark" id="answerHtml" rows={5} value={answerHtml} onChange={e => setAnswerHtml(e.target.value)} required />
                </div>
                <div className="row">
                  <div className="col-md-5 mb-3">
                    <label htmlFor="category" className="form-label">Kategori</label>
                    <input type="text" className="form-control form-control-sm bg-light border-dark text-dark" id="category" value={category} onChange={e => setCategory(e.target.value)} placeholder="Genel"/>
                  </div>
                  <div className="col-md-4 mb-3">
                    <label htmlFor="order" className="form-label">Sıralama (Küçük olan önce)</label>
                    <input type="number" className="form-control form-control-sm bg-light border-dark text-dark" id="order" value={order} onChange={e => setOrder(parseInt(e.target.value,10) || 0)} />
                  </div>
                  <div className="col-md-3 mb-3 align-self-center">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" role="switch" id="isActiveFaq" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                      <label className="form-check-label" htmlFor="isActiveFaq">Aktif mi?</label>
                    </div>
                  </div>
                </div>
                {formMessage && <p className={`mb-2 small ${formMessage.type === 'error' ? 'text-danger':'text-success'}`}>{formMessage.text}</p>}
                <button type="submit" className="btn btn-primary me-2" disabled={isSubmitting}>{isSubmitting ? 'Kaydediliyor...' : (editingFaq ? 'Güncelle' : 'Oluştur')}</button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">Formu Kapat</button>
              </form>
            </div>
          </div>
        )}

        <div className="card bg-dark text-white border-secondary">
            <div className="card-header">Mevcut S.S.S. Maddeleri</div>
            {(faqs.length === 0 && !isLoading) ? <div className="card-body"><p>Henüz S.S.S. maddesi yok.</p></div> : (
            <ul className="list-group list-group-flush">
            {faqs.map(faq => (
                <li key={faq.id} className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center flex-wrap py-3">
                <div className="me-auto" style={{maxWidth: '70%'}}>
                    <strong>{faq.question}</strong>
                    <small className="d-block text-muted">
                        Kategori: {faq.category || 'Belirtilmemiş'} | Sıra: {faq.order} | Durum: {faq.is_active ? 
                        <span className="badge bg-success ms-1">AKTİF</span> : 
                        <span className="badge bg-secondary ms-1">PASİF</span>}
                    </small>
                </div>
                <div className="mt-2 mt-md-0">
                    <button onClick={() => handleEdit(faq)} className="btn btn-sm btn-outline-info me-2"><i className="bi bi-pencil-square me-1"></i> Düzenle</button>
                    <button onClick={() => handleDelete(faq.id)} className="btn btn-sm btn-outline-danger"><i className="bi bi-trash-fill me-1"></i> Sil</button>
                </div>
                </li>
            ))}
            </ul>
            )}
        </div>
      </div>
      <style jsx global>{`
        .custom-admin-background { background-color: #1e272e; color: #f5f6fa; min-height: 100vh; padding-bottom: 3rem; }
        .custom-admin-background .card { border-color: #4a5568; }
        .form-control-sm.bg-light.text-dark { background-color: #f8f9fa !important; color: #212529 !important; }
        .form-check-input:checked { background-color: #3c50e0; border-color: #3c50e0; }
        .hover-underline:hover { text-decoration: underline !important; }
      `}</style>
    </div>
  );
}