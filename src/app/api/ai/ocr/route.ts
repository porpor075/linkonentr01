import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const apiKey = process.env.GEMINI_API_KEY || "";
    
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY is not set' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // รายชื่อ Model ที่เราจะลองเรียก (ใช้ชื่อเต็มที่ระบบ Google ต้องการ)
    const modelsToTry = [
      "gemini-1.5-flash-001",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-pro-vision" // รุ่นเก่าสำหรับ Fallback
    ];

    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`[OCR] Executing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = "Extract vehicle registration info. Output ONLY JSON: {registrationNumber, brand, model, year, vin, engineNumber}";

        const result = await model.generateContent([
          { text: prompt },
          {
            inlineData: {
              data: buffer.toString("base64"),
              mimeType: file.type
            }
          }
        ]);

        const response = await result.response;
        const text = response.text();
        
        // Clean and parse JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        const data = JSON.parse(jsonStr);

        return NextResponse.json({ success: true, data, usedModel: modelName });
      } catch (err: any) {
        lastError = err;
        console.warn(`[OCR] ${modelName} failed, moving to next...`);
        continue;
      }
    }

    return NextResponse.json({ error: lastError?.message || 'AI Processing Failed' }, { status: 500 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
