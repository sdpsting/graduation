// src/app/api/admin/faq/[id]/route.ts
import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// FaqItem tipini burada tanımlıyoruz veya src/types.ts'den import edebiliriz
type FaqItem = { 
  id: string; 
  question: string; 
  answer_html: string; 
  category: string; 
  order: number; 
  is_active: boolean;
};

const faqFilePath = path.join(process.cwd(), 'src', 'data', 'faq-data.json');

// ---- YARDIMCI FONKSİYONLAR BU DOSYAYA ÖZEL ----
async function readFaqsFromFile(): Promise<FaqItem[]> {
  try {
    const jsonData = await fs.readFile(faqFilePath, 'utf-8');
    return JSON.parse(jsonData) as FaqItem[];
  } catch (error: any) {
    if (error.code === 'ENOENT') { // Dosya bulunamadıysa, boş bir dosya oluştur ve boş dizi dön
      console.log(`[API ADMIN FAQ / ID] ${faqFilePath} bulunamadı, boş dosya oluşturuluyor.`);
      await fs.writeFile(faqFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    console.error("Admin S.S.S. verileri okunamadı (dosya okuma hatası):", error);
    throw new Error("S.S.S. verileri okunamadı."); // Bu hata catch bloklarında yakalanacak
  }
}

async function writeFaqsToFile(faqs: FaqItem[]): Promise<void> {
  try {
    const jsonData = JSON.stringify(faqs, null, 2); // Okunabilirlik için 2 space indent
    await fs.writeFile(faqFilePath, jsonData, 'utf-8');
  } catch (error: any) {
    console.error("Admin S.S.S. verileri yazılamadı (dosya yazma hatası):", error);
    throw new Error("S.S.S. verileri kaydedilemedi."); // Bu hata catch bloklarında yakalanacak
  }
}
// ---- YARDIMCI FONKSİYONLAR SONU ----

// Tek bir S.S.S. maddesini ID ile getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Middleware'in admin kontrolü yaptığını varsayıyoruz
  try {
    const faqId = params.id;
    if (!faqId) {
      return NextResponse.json({ message: "S.S.S. ID'si gerekli." }, { status: 400 });
    }
    const faqs = await readFaqsFromFile();
    const faq = faqs.find(f => f.id === faqId);
    if (!faq) { 
      return NextResponse.json({ message: "S.S.S. maddesi bulunamadı." }, { status: 404 });
    }
    return NextResponse.json(faq);
  } catch (error: any) {
    console.error(`[API ADMIN FAQ GET /${params.id}] Hata:`, error.message);
    return NextResponse.json({ message: error.message || "S.S.S. maddesi getirilirken bir sorun oluştu." }, { status: 500 });
  }
}

// Bir S.S.S. maddesini ID ile güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Middleware'in admin kontrolü yaptığını varsayıyoruz
  try {
    const faqId = params.id;
    if (!faqId) {
      return NextResponse.json({ message: "S.S.S. ID'si gerekli." }, { status: 400 });
    }
    const updatedData = await request.json();
    if (!updatedData || Object.keys(updatedData).length === 0) {
        return NextResponse.json({ message: "Güncellenecek veri bulunamadı." }, { status: 400 });
    }

    let faqs = await readFaqsFromFile();
    const faqIndex = faqs.findIndex(f => f.id === faqId);

    if (faqIndex === -1) { 
      return NextResponse.json({ message: "Güncellenecek S.S.S. maddesi bulunamadı." }, { status: 404 });
    }
    
    const currentFaq = faqs[faqIndex];
    // Gelen verideki alanları mevcut S.S.S. ile birleştirerek güncelle
    const newFaqData: FaqItem = {
        ...currentFaq, // Önceki değerleri koru
        question: updatedData.question !== undefined ? String(updatedData.question) : currentFaq.question,
        answer_html: updatedData.answer_html !== undefined ? String(updatedData.answer_html) : currentFaq.answer_html,
        category: updatedData.category !== undefined ? String(updatedData.category) : currentFaq.category,
        order: updatedData.order !== undefined ? Number(updatedData.order) : currentFaq.order,
        is_active: updatedData.is_active !== undefined ? Boolean(updatedData.is_active) : currentFaq.is_active,
    };
    
    // Sadece id'si aynı olanı güncelle, geri kalanı koru
    faqs[faqIndex] = newFaqData;
    await writeFaqsToFile(faqs);

    return NextResponse.json({ message: "S.S.S. maddesi başarıyla güncellendi.", faq: faqs[faqIndex] });
  } catch (error: any) {
    console.error(`[API ADMIN FAQ PUT /${params.id}] Hata:`, error.message, error.stack);
    return NextResponse.json({ message: error.message || "S.S.S. maddesi güncellenirken bir sorun oluştu." }, { status: 500 });
  }
}

// Bir S.S.S. maddesini ID ile sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Middleware'in admin kontrolü yaptığını varsayıyoruz
  try {
    const faqId = params.id;
    if (!faqId) {
      return NextResponse.json({ message: "S.S.S. ID'si gerekli." }, { status: 400 });
    }

    let faqs = await readFaqsFromFile();
    const initialLength = faqs.length;
    faqs = faqs.filter(f => f.id !== faqId);

    if (faqs.length === initialLength) { 
      return NextResponse.json({ message: "Silinecek S.S.S. maddesi bulunamadı." }, { status: 404 });
    }

    await writeFaqsToFile(faqs);
    return NextResponse.json({ message: "S.S.S. maddesi başarıyla silindi." });
  } catch (error: any) {
    console.error(`[API ADMIN FAQ DELETE /${params.id}] Hata:`, error.message);
    return NextResponse.json({ message: error.message || "S.S.S. maddesi silinirken bir sorun oluştu." }, { status: 500 });
  }
}