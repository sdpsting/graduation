// src/app/api/admin/faq/route.ts
import { NextResponse, NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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
    if (error.code === 'ENOENT') {
      await fs.writeFile(faqFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    console.error("S.S.S. verileri okunamadı (admin):", error);
    throw new Error("S.S.S. verileri okunamadı.");
  }
}

async function writeFaqsToFile(faqs: FaqItem[]): Promise<void> {
  try {
    const jsonData = JSON.stringify(faqs, null, 2);
    await fs.writeFile(faqFilePath, jsonData, 'utf-8');
  } catch (error) {
    console.error("S.S.S. verileri yazılamadı (admin):", error);
    throw new Error("S.S.S. verileri kaydedilemedi.");
  }
}

function generateNewIdForFaq(): string {
  return `faq-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}
// ---- YARDIMCI FONKSİYONLAR SONU ----

export async function GET(request: NextRequest) {
  try {
    const faqs = await readFaqsFromFile();
    return NextResponse.json(faqs.sort((a, b) => (a.order || 0) - (b.order || 0)));
  } catch (error: any) { /* ... */ }
}

export async function POST(request: NextRequest) {
  try {
    const newFaqData = await request.json();
    if (!newFaqData.question || !newFaqData.answer_html) {
      return NextResponse.json({ message: "Soru ve cevap alanları zorunludur." }, { status: 400 });
    }
    const faqs = await readFaqsFromFile();
    const newFaq: FaqItem = {
      id: generateNewIdForFaq(),
      question: newFaqData.question,
      answer_html: newFaqData.answer_html,
      category: newFaqData.category || "Genel",
      order: Number(newFaqData.order) || (faqs.length > 0 ? Math.max(...faqs.map(f => f.order || 0)) + 1 : 1),
      is_active: newFaqData.is_active === true,
    };
    faqs.push(newFaq);
    await writeFaqsToFile(faqs);
    return NextResponse.json({ message: "S.S.S. başarıyla eklendi.", faq: newFaq }, { status: 201 });
  } catch (error: any) { /* ... */ }
}