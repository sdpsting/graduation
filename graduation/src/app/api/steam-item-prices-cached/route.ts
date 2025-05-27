// src/app/api/steam-item-prices-cached/route.ts
import { NextResponse, NextRequest } from 'next/server';

interface CachedPrice {
  price: number | null;
  timestamp: number;
  lowest_price_str?: string;
  median_price_str?: string;
  volume_str?: string;
}

const priceCache = new Map<string, CachedPrice>();
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 dakika

const CURRENCY_USD = 1;
const CURRENCY_EUR = 3;
const CURRENCY_TRY = 20;

const parseSteamPrice = (priceString?: string): number | null => {
  if (!priceString) return null;
  const cleanedString = priceString
    .replace(/[^\d,.]/g, '')
    .replace(/\.(?=\d{3,}(?:[,.]\d{1,2})?$)/g, '')
    .replace(',', '.');
  const justDigits = cleanedString.replace(/[^\d.]/g, '');
  const number = parseFloat(justDigits);
  return isNaN(number) ? null : number;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const STEAM_API_REQUEST_DELAY_MS = 1500;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const marketHashNames: string[] = body.market_hash_names;
    const rawCurrencyIdInput = body.currency_id;
    const forceRefreshNames: string[] | undefined = body.force_refresh_names; // Frontend'den gelebilir

    let targetCurrency: number = CURRENCY_USD; // Varsayılan USD
    if (rawCurrencyIdInput !== undefined) {
      const parsedCurrencyId = parseInt(String(rawCurrencyIdInput), 10);
      if (!isNaN(parsedCurrencyId) && [CURRENCY_USD, CURRENCY_EUR, CURRENCY_TRY].includes(parsedCurrencyId)) {
        targetCurrency = parsedCurrencyId;
      } else {
        console.warn(`[API/prices] Geçersiz currency_id: "${rawCurrencyIdInput}", USD kullanılacak.`);
      }
    }

    if (!Array.isArray(marketHashNames) || marketHashNames.length === 0) {
      return NextResponse.json({ success: false, message: 'market_hash_names listesi gerekli.' }, { status: 400 });
    }
    if (marketHashNames.length > 50) {
        return NextResponse.json({ success: false, message: 'Tek seferde en fazla 50 item sorgulanabilir.' }, { status: 400 });
    }

    const results: Record<string, { price: number | null, lowest_price_str?: string, median_price_str?: string, volume_str?: string }> = {};
    const now = Date.now();
    // console.log(`[API/prices] ${marketHashNames.length} item için fiyat çekimi (Para Birimi: ${targetCurrency})`);
    if (forceRefreshNames && forceRefreshNames.length > 0) {
        console.log(`[API/prices] Cache bypass edilecek item sayısı: ${forceRefreshNames.length}`);
    }

    for (let i = 0; i < marketHashNames.length; i++) {
      const originalNameFromInventory = marketHashNames[i];
      const cacheKey = `${originalNameFromInventory}_${targetCurrency}`;
      const cachedEntry = priceCache.get(cacheKey);
      const shouldForceRefresh = forceRefreshNames && forceRefreshNames.includes(originalNameFromInventory);

      if (cachedEntry && (now - cachedEntry.timestamp < CACHE_DURATION_MS) && !shouldForceRefresh) {
        // console.log(`[API/prices] Cache HIT: "${originalNameFromInventory}"`);
        results[originalNameFromInventory] = { 
            price: cachedEntry.price,
            lowest_price_str: cachedEntry.lowest_price_str,
            median_price_str: cachedEntry.median_price_str,
            volume_str: cachedEntry.volume_str
        };
      } else {
        const nameForApi = originalNameFromInventory; 
        if (shouldForceRefresh) {
            console.log(`[API/prices] Cache BYPASS (${i+1}/${marketHashNames.length}) Fiyat "${originalNameFromInventory}" için ZORLA Steam'den çekilecek.`);
        } else {
            // console.log(`[API/prices] Cache MISS/EXPIRED (${i+1}/${marketHashNames.length}) Fiyat "${originalNameFromInventory}" için Steam'den çekilecek.`);
        }
        
        const queryParams = new URLSearchParams({
            appid: '730',
            currency: String(targetCurrency),
            market_hash_name: nameForApi 
        });
        const steamPriceUrl = `https://steamcommunity.com/market/priceoverview/?${queryParams.toString()}`;
        // console.log(`  Oluşturulan Steam URL (URLSearchParams ile): ${steamPriceUrl}`);
        
        try {
          const steamResponse = await fetch(steamPriceUrl, {
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
            }
          });

          if (!steamResponse.ok) {
            const errorBodyText = await steamResponse.text().catch(() => "Yanıt gövdesi okunamadı.");
            console.warn(`[API/prices] Steam API hatası "${originalNameFromInventory}": ${steamResponse.status}. URL: ${steamPriceUrl}. Yanıt: ${errorBodyText.substring(0,100)}`);
            results[originalNameFromInventory] = { price: null };
            // Başarısız olsa bile cache'e yaz (kısa süreliğine tekrar denenmesin diye, veya force refresh ile geçilebilir)
            priceCache.set(cacheKey, { price: null, timestamp: now });
            if (i < marketHashNames.length - 1) await delay(STEAM_API_REQUEST_DELAY_MS);
            continue;
          }

          const priceData = await steamResponse.json();
          if (priceData && priceData.success) {
            const lowestPriceNum = parseSteamPrice(priceData.lowest_price);
            results[originalNameFromInventory] = { 
                price: lowestPriceNum,
                lowest_price_str: priceData.lowest_price,
                median_price_str: priceData.median_price,
                volume_str: priceData.volume
            };
            priceCache.set(cacheKey, { 
                price: lowestPriceNum, 
                timestamp: now,
                lowest_price_str: priceData.lowest_price,
                median_price_str: priceData.median_price,
                volume_str: priceData.volume
            });
          } else {
            console.warn(`[API/prices] Steam'den "${originalNameFromInventory}" için fiyat alınamadı (success:false). Yanıt: ${priceData ? JSON.stringify(priceData).substring(0,100) : 'Boş yanıt'}`);
            results[originalNameFromInventory] = { price: null };
            priceCache.set(cacheKey, { price: null, timestamp: now });
          }
        } catch (fetchError: any) {
            console.error(`[API/prices] Steam API fetch error for "${originalNameFromInventory}": ${fetchError.message}`);
            results[originalNameFromInventory] = { price: null };
            priceCache.set(cacheKey, { price: null, timestamp: now });
        }
        if (i < marketHashNames.length - 1) await delay(STEAM_API_REQUEST_DELAY_MS);
      }
    }
    // console.log(`[API /prices-cached] Fiyat çekme işlemi tamamlandı.`);
    return NextResponse.json({ success: true, prices: results });
  } catch (error: any) {
    console.error("[API/prices] Genel POST hatası:", error.message);
    return NextResponse.json({ success: false, message: 'Fiyatlar alınırken bir sunucu hatası oluştu.' }, { status: 500 });
  }
}