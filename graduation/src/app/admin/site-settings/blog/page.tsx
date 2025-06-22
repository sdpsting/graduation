// src/app/admin/site-settings/blog/page.tsx
'use client';

import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import Link from 'next/link';
import Navbar from 'src/app/components/navbar'; // Genel Navbar'ı veya AdminNavbar'ı kullanabilirsiniz

// BlogPost tipini import edin veya burada tanımlayın
// import type { BlogPost } from '@/types'; // Eğer src/types.ts oluşturduysanız
type BlogPost = {
  id: string;
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  content_html: string;
  is_published: boolean;
};

// WYSIWYG Editör (ReactQuill örneği - opsiyonel)
// npm install react-quill @types/react-quill
// import ReactQuill from 'react-quill';
// import 'react-quill/dist/quill.snow.css'; // Quill'in stilleri

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'info', text: string} | null>(null);

  // Form state'leri
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [contentHtml, setContentHtml] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  
  const [formMessage, setFormMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlogPosts = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({type: 'error', text: 'Yetki bulunamadı. Lütfen giriş yapın.'});
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/admin/blog', {
        headers: { 'Authorization': `Bearer ${token}` }
      }); 
      if (!res.ok) {
        const errData = await res.json().catch(() => ({message: 'Bilinmeyen sunucu hatası.'}));
        throw new Error(errData.message || 'Blog yazıları yüklenemedi.');
      }
      const data: BlogPost[] = await res.json();
      setPosts(data);
    } catch (err: any) {
      setMessage({type: 'error', text: err.message});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  const handleAddNew = () => {
    resetForm();
    setEditingPost(null);
    setShowForm(true);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setDate(post.date);
    setContentHtml(post.content_html);
    setIsPublished(post.is_published);
    setShowForm(true);
    setFormMessage(null);
    window.scrollTo(0, 0);
  };

  const handleDelete = async (postId: string) => {
    const postToDelete = posts.find(p => p.id === postId);
    if (!confirm(`"${postToDelete?.title || 'Bu'}" başlıklı yazıyı silmek istediğinizden emin misiniz?`)) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
        setMessage({type: 'error', text: 'Yetki bulunamadı. İşlem iptal edildi.'});
        return;
    }

    const originalPosts = [...posts];
    setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
    setMessage({type: 'info', text: `"${postToDelete?.title || 'Yazı'}" siliniyor...`});

    try {
      const res = await fetch(`/api/admin/blog/${postId}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        setPosts(originalPosts);
        throw new Error(data.message || 'Silme işlemi başarısız oldu.');
      }
      setMessage({type: 'success', text: data.message || "Yazı başarıyla silindi."});
      if (editingPost?.id === postId) resetForm();
    } catch (err: any) {
      setPosts(originalPosts);
      setMessage({type: 'error', text: `Silme hatası: ${err.message}`});
    }
  };
  
  const resetForm = () => {
    setEditingPost(null); setTitle(''); setSlug('');
    setDate(new Date().toISOString().split('T')[0]);
    setContentHtml(''); setIsPublished(true);
    setShowForm(false); setFormMessage(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setFormMessage(null);

    const token = localStorage.getItem('token');
    if (!token) {
        setFormMessage({type: 'error', text: 'Yetki bulunamadı. Lütfen tekrar giriş yapın.'});
        setIsSubmitting(false);
        return;
    }

    const finalSlug = slug.trim() || title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').substring(0,100);
    if (!finalSlug && !editingPost?.slug) { // Slug boşsa ve düzenleme modunda da slug yoksa
        setFormMessage({type: 'error', text: 'Slug oluşturulamadı veya boş. Lütfen başlığı kontrol edin veya manuel bir slug girin.'});
        setIsSubmitting(false);
        return;
    }

    const postData = { 
        title: title.trim(), 
        slug: finalSlug, 
        date, 
        content_html: contentHtml, 
        is_published: isPublished 
    };
    
    const url = editingPost ? `/api/admin/blog/${editingPost.id}` : '/api/admin/blog';
    const method = editingPost ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(postData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'İşlem başarısız oldu.');
      
      setFormMessage({type: 'success', text: data.message});
      fetchBlogPosts(); 
      resetForm(); 
    } catch (err: any) {
      setFormMessage({type: 'error', text: `Hata: ${err.message}`});
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) return (
    <div className="container-fluid custom-admin-background">
        <Navbar/>
        <div className="container mt-5 text-center">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Yükleniyor...</span>
            </div>
            <p className="mt-2">Blog Yönetimi yükleniyor...</p>
        </div>
    </div>
  );

  return (
    <div className="container-fluid custom-admin-background">
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Blog Yönetimi</h1>
          {!showForm && (
            <button onClick={handleAddNew} className="btn btn-success">
              <i className="bi bi-plus-circle-fill me-2"></i>Yeni Yazı Ekle
            </button>
          )}
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
              {editingPost ? `Yazıyı Düzenle: "${editingPost.title}"` : 'Yeni Yazı Oluştur'}
              <button type="button" className="btn-close btn-close-white" onClick={resetForm} aria-label="Formu Kapat"></button>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Başlık</label>
                  <input type="text" className="form-control form-control-sm bg-light border-dark text-dark" id="title" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="slug" className="form-label">Slug (URL için)</label>
                  <input type="text" className="form-control form-control-sm bg-light border-dark text-dark" id="slug" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, ''))} placeholder="Boş bırakılırsa başlıktan üretilir"/>
                </div>
                <div className="mb-3">
                  <label htmlFor="date" className="form-label">Tarih</label>
                  <input type="date" className="form-control form-control-sm bg-light border-dark text-dark" id="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label htmlFor="contentHtml" className="form-label">İçerik (HTML)</label>
                  <textarea className="form-control form-control-sm bg-light border-dark text-dark" id="contentHtml" rows={10} value={contentHtml} onChange={e => setContentHtml(e.target.value)} required />
                  {/* <ReactQuill theme="snow" value={contentHtml} onChange={setContentHtml}/> */}
                </div>
                <div className="form-check mb-3">
                  <input className="form-check-input" type="checkbox" id="isPublished" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
                  <label className="form-check-label" htmlFor="isPublished">Yayınlansın mı?</label>
                </div>
                {formMessage && <p className={`mb-2 small ${formMessage.type === 'error' ? 'text-danger':'text-success'}`}>{formMessage.text}</p>}
                <button type="submit" className="btn btn-primary me-2" disabled={isSubmitting}>
                  {isSubmitting ? (<><span className="spinner-border spinner-border-sm me-2"></span>Kaydediliyor...</>) 
                               : (editingPost ? 'Güncelle' : 'Oluştur')}
                </button>
                <button type="button" onClick={resetForm} className="btn btn-secondary">Formu Kapat</button>
              </form>
            </div>
          </div>
        )}

        <div className="card bg-dark text-white border-secondary">
            <div className="card-header">Mevcut Blog Yazıları</div>
            {posts.length === 0 && !isLoading ? <div className="card-body"><p>Henüz blog yazısı yok.</p></div> : (
            <ul className="list-group list-group-flush">
              {posts.map(post => (
                <li key={post.id} className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center flex-wrap py-3">
                  <div className="me-auto" style={{maxWidth: '70%'}}>
                    <Link href={`/blog/${post.slug || post.id}`} target="_blank" className="text-warning fw-bold fs-5 text-decoration-none hover-underline">{post.title}</Link>
                    <small className="d-block text-muted">
                        Tarih: {new Date(post.date).toLocaleDateString('tr-TR', {day: '2-digit', month: '2-digit', year: 'numeric'})} | Slug: /blog/{post.slug} | Durum: {post.is_published ? 
                        <span className="badge bg-success ms-1">YAYINLANDI</span> : 
                        <span className="badge bg-secondary ms-1">TASLAK</span>}
                    </small>
                  </div>
                  <div className="mt-2 mt-md-0">
                    <button onClick={() => handleEdit(post)} className="btn btn-sm btn-outline-info me-2">
                        <i className="bi bi-pencil-square me-1"></i> Düzenle
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="btn btn-sm btn-outline-danger">
                        <i className="bi bi-trash-fill me-1"></i> Sil
                    </button>
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