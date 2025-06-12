// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

// Config dosyasının yolu middleware'e göre ./config/config.ts olmalı
import { JWT_SECRET as ENV_JWT_SECRET } from './config/config'; 

let secretKey: Uint8Array;
try {
    if (!ENV_JWT_SECRET) {
        console.error("KRİTİK HATA [Middleware]: JWT_SECRET tanımlanmamış!");
        if (process.env.NODE_ENV === 'development') {
            console.warn("[Middleware]: Geliştirme için geçici JWT_SECRET kullanılıyor.");
            secretKey = new TextEncoder().encode('DEV_ONLY_FALLBACK_SECRET_123');
        } else {
            throw new Error('JWT_SECRET is not defined in production for middleware.');
        }
    } else {
        secretKey = new TextEncoder().encode(ENV_JWT_SECRET);
    }
} catch (e: any) {
    console.error("Middleware: JWT_SECRET yüklenirken KRİTİK HATA:", e.message);
    if (process.env.NODE_ENV === 'development') {
        secretKey = new TextEncoder().encode('DEV_ONLY_FALLBACK_SECRET_ERROR_CASE');
    } else {
        // Bu durumda middleware'in çalışmaması için null bırakabiliriz veya hata fırlatabiliriz.
        // Eğer null bırakırsak, aşağıdaki secretKey kontrolü devreye girer.
        // Şimdilik null bırakalım, aşağıdaki kontrol yakalasın.
        // secretKey = null as any; // Hata fırlatmak daha iyi olabilir
        throw new Error('Failed to initialize JWT secret key for middleware due to config error.');
    }
}

const ADMIN_API_PATHS = ['/api/admin/'];

export const config = {
  matcher: [
    // SADECE TOKEN GEREKTİREN API ROTALARI
    '/api/market/purchase/:path*',
    '/api/inventory/my-items/:path*',
    '/api/admin/:path*', 
    '/api/admin/items/:path*',
    '/api/admin/users/:path*',
    '/api/market/sell-item/:path*',
    // '/api/users/:id/balance', // Eğer bu da token gerektiriyorsa eklenebilir
    // '/api/profile/update',   // Eğer bu da token gerektiriyorsa eklenebilir
  ],
  // runtime: 'edge', // jose için varsayılan Edge'dir, bu satır opsiyoneldir.
};

interface MyJwtPayload extends jose.JWTPayload {
    userId?: string | number;
    username?: string;
    role?: 'user' | 'admin' | string;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // console.log(`[Middleware] İstek (SADECE API İÇİN): ${request.method} ${pathname}`);

  // Middleware artık sadece matcher'daki API yolları için çalışacak.
  // Bu yüzden isPotentiallyProtectedRoute kontrolüne gerek kalmadı.

  const authorizationHeader = request.headers.get('authorization');
  let token = null;

  if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
    token = authorizationHeader.split(' ')[1];
  }

  if (!token) {
    // console.log('[Middleware] Token bulunamadı. 401 JSON yanıtı döndürülüyor.');
    return NextResponse.json(
      { success: false, message: 'Yetkilendirme tokenı bulunamadı.' },
      { status: 401 }
    );
  }

  if (!secretKey) { // secretKey yüklenememişse
      console.error("[Middleware] KRİTİK: secretKey tanımlı değil, token doğrulanamıyor. API isteği reddediliyor.");
      return NextResponse.json({ success: false, message: 'Sunucu yapılandırma hatası (auth).' }, { status: 500 });
  }

  try {
    const { payload } = await jose.jwtVerify<MyJwtPayload>(token, secretKey);
    // console.log('[Middleware] Token doğrulandı. Payload:', payload);

    const requestHeaders = new Headers(request.headers);
    if (payload && payload.userId) {
      requestHeaders.set('x-user-id', String(payload.userId));
      if (payload.role) {
        requestHeaders.set('x-user-role', String(payload.role));
      }
    } else {
      throw new Error('Token payload geçerli kullanıcı veya rol bilgisi içermiyor.');
    }

    const isAdminApiPath = ADMIN_API_PATHS.some(p => pathname.startsWith(p));
    if (isAdminApiPath && payload.role !== 'admin') {
      console.warn(`[Middleware] YETKİSİZ API ERİŞİM DENEMESİ (admin değil): Kullanıcı ${payload.userId} (${payload.role}) -> ${pathname}`);
      return NextResponse.json({ success: false, message: 'Bu API işlemi için admin yetkisine sahip değilsiniz.' }, { status: 403 });
    }
    
    return NextResponse.next({ request: { headers: requestHeaders } });

  } catch (error: any) {
    console.error('[Middleware] Token doğrulama hatası:', error.message, error.code ? `(Code: ${error.code})` : '');
    let errorMessage = 'Geçersiz veya süresi dolmuş token.';
    if (error.code === 'ERR_JWT_EXPIRED') {
        errorMessage = 'Oturumunuzun süresi doldu.';
    } else if (error.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED' || error.code === 'ERR_JWS_INVALID') {
        errorMessage = `Token doğrulanamadı: ${error.message || error.code}`;
    }
    return NextResponse.json(
      { success: false, message: errorMessage, errorDetails: error.message, errorCode: error.code },
      { status: 401 }
    );
  }
}