'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Kullanıcı bilgilerini kontrol etmek için backend'e istek gönder
    fetch('/api/auth/user')
      .then((res) => res.json())
      .then((data) => {
        if (data.role === 'admin') {
          setIsAdmin(true);
        } else {
          router.push('/login'); // Admin değilse login sayfasına yönlendir
        }
      });
  }, [router]);

  if (!isAdmin) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div>
      <h1>Admin Paneli</h1>
      <p>Buraya sadece adminler erişebilir.</p>
    </div>
  );
}
