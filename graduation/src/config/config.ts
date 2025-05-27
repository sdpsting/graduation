// src/lib/constants.ts (veya src/config/jwt.ts gibi bir isim)

// ÇOK ÖNEMLİ: Bu anahtarı üretimde ortam değişkenlerinden alın!
// Geliştirme için geçici bir anahtar:
export const JWT_SECRET = process.env.JWT_SECRET || '32266872293497330782730303369055';

// Token geçerlilik süresi (örneğin 1 saat)
export const JWT_EXPIRES_IN = '3h';