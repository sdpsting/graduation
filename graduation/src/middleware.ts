// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose'; // jose'yi import et

// JWT_SECRET'i config dosyanızdan veya .env'den alın
import { JWT_SECRET as ENV_JWT_SECRET } from './config/config'; // YOLUNUZU KONTROL EDİN

// JWT_SECRET'i jose için uygun formata getirin (Uint8Array)
let secretKey: Uint8Array;
try {
    if (!ENV_JWT_SECRET) {
        throw new Error('JWT_SECRET ortam değişkeni middleware için tanımlanmamış!');
    }
    secretKey = new TextEncoder().encode(ENV_JWT_SECRET);
} catch (e: any) {
    console.error("Middleware: JWT_SECRET yüklenirken hata:", e.message);
    // Geliştirme için varsayılan veya hata fırlat
    secretKey = new TextEncoder().encode('fallback-secret-for-middleware-dev-only');
}

export const config = {
  matcher: [
    '/api/market/purchase/:path*',
    '/api/inventory/my-items/:path*',
    '/envanter/:path*',
    '/withdrawal/:path*',
    '/pay/:path*',
    '/profile/:path*',
  ],
  // runtime: 'nodejs', // Artık buna gerek yok, jose Edge Runtime'da çalışır
};

interface MyJwtPayload extends jose.JWTPayload {
    userId?: string | number;
    username?: string;
    role?: string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log(`[Middleware] İstek geldi: ${request.method} ${pathname}`);

  if (pathname.startsWith('/api/')) {
    console.log('[Middleware] API yolu, token kontrolü yapılacak.');
    const authorizationHeader = request.headers.get('authorization');
    console.log('[Middleware] Authorization Header:', authorizationHeader);

    let token = null;
    if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
      token = authorizationHeader.split(' ')[1];
      console.log('[Middleware] Bearer token bulundu:', token ? 'EVET' : 'HAYIR');
    } else {
      console.log('[Middleware] Bearer token formatı uygun değil veya Authorization header yok.');
    }

    if (!token) {
      console.log('[Middleware] Token bulunamadı. 401 döndürülüyor.');
      return NextResponse.json(
        { success: false, message: 'Erişim yetkiniz yok: Token bulunamadı.' },
        { status: 401 }
      );
    }

    try {
      console.log('[Middleware] Token doğrulamaya çalışılıyor (jose ile)...');
      const { payload } = await jose.jwtVerify<MyJwtPayload>(token, secretKey, {
        // algorithms: ['HS256'], // Gerekirse algoritma belirtin
      });
      console.log('[Middleware] Token başarıyla doğrulandı (jose). Çözümlenmiş Payload:', payload);

      const requestHeaders = new Headers(request.headers);
      if (payload && payload.userId) {
        requestHeaders.set('x-user-id', String(payload.userId));
        console.log('[Middleware] x-user-id header AYARLANDI:', String(payload.userId));
        if (payload.role) {
          requestHeaders.set('x-user-role', String(payload.role));
          console.log('[Middleware] x-user-role header AYARLANDI:', String(payload.role));
        }
      } else {
        console.warn("[Middleware] UYARI: Token payload'ı 'userId' içermiyor. Payload:", payload);
        return NextResponse.json(
          { success: false, message: 'Geçersiz token yapısı: Kullanıcı kimliği bulunamadı.' },
          { status: 401 }
        );
      }
      console.log('[Middleware] İstek yeni headerlarla devam ettiriliyor.');
      return NextResponse.next({ request: { headers: requestHeaders } });

    } catch (error) {
      const err = error as any;
      console.error('[Middleware] JWT DOĞRULAMA HATASI (jose):', err.name, '-', err.message, err.code ? `(Code: ${err.code})` : '');
      let errorMessage = 'Geçersiz veya süresi dolmuş token.';
      if (err.code === 'ERR_JWT_EXPIRED') {
        errorMessage = 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.';
      } else if (err.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED' || err.code === 'ERR_JWS_INVALID' || err.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED') {
        errorMessage = `Token doğrulanamadı: ${err.message || err.code}`;
      } else {
        errorMessage = `Token hatası: ${err.message || err.name}`;
      }
      console.log(`[Middleware] ${errorMessage}. 401 döndürülüyor.`);
      return NextResponse.json(
        { success: false, message: errorMessage, errorCode: err.code, errorName: err.name },
        { status: 401 }
      );
    }
  }

  console.log(`[Middleware] API yolu değil (${pathname}), istek devam ettiriliyor.`);
  return NextResponse.next();
}