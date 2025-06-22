// src/app/api/faq/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// JSON dosyasının tam yolu
// Eğer data klasörünüz src içinde değilse, 'src' kısmını yoldan kaldırın.
const faqFilePath = path.join(process.cwd(), 'src', 'data', 'faq-data.json');

// Tip tanımı
type FaqItem = {
  id: string;
  question: string;
  answer_html: string;
  category: string;
  order: number;
  is_active: boolean;
};

export async function GET() {
  try {
    const jsonData = await fs.readFile(faqFilePath, 'utf-8');
    const allFaqs: FaqItem[] = JSON.parse(jsonData);

    // Sadece aktif olanları filtrele
    const activeFaqs = allFaqs.filter(faq => faq.is_active === true);

    // 'order' alanına göre sırala (küçükten büyüğe)
    const sortedFaqs = activeFaqs.sort((a, b) => (a.order || 0) - (b.order || 0));

    return NextResponse.json(sortedFaqs);

  } catch (error: any) {
    console.error("S.S.S. verileri okunurken hata oluştu:", error.message);
    return NextResponse.json(
      { message: "S.S.S. bölümüne erişilirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin." },
      { status: 500 }
    );
  }
}