import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const apiKey = process.env.GEMINI_API_KEY || "";
    
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY is not set in environment' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // รายชื่อ Model ที่จะพยายามลองเรียกใช้ (จากใหม่ไปเก่า)
    const modelsToTry = [
      process.env.GEMINI_MODEL, 
      "gemini-1.5-flash", 
      "gemini-1.5-flash-latest",
      "gemini-1.5-pro"
    ].filter(Boolean) as string[];

    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`[OCR] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `
          Extract vehicle registration information from this image. 
          Respond ONLY with a JSON object containing these keys:
          - registrationNumber (e.g. "กข 1234 กรุงเทพ")
          - brand (e.g. "TOYOTA")
          - model (e.g. "CAMRY")
          - year (e.g. "2024")
          - vin (Vehicle Identification Number - 17 characters)
          - engineNumber
          If a field is not visible, use null.
        `;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: buffer.toString("base64"),
              mimeType: file.type
            }
          }
        ]);

        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json|```/g, "").trim();
        const data = JSON.parse(jsonStr);

        return NextResponse.json({ success: true, data, usedModel: modelName });
      } catch (err: any) {
        console.warn(`[OCR] Model ${modelName} failed:`, err.message);
        lastError = err;
        continue; // ลอง Model ถัดไปในรายการ
      }
    }

    throw lastError || new Error('All models failed to process the request');

  } catch (error: any) {
    console.error('[OCR_FINAL_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
