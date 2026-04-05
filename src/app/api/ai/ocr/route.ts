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

    // ลำดับโมเดลที่รองรับ (ใช้ชื่อล่าสุดที่ทดสอบแล้วผ่าน)
    const modelsToTry = [
      "gemini-flash-latest",
      "gemini-2.0-flash", 
      "gemini-1.5-flash-latest"
    ];

    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`[OCR] Executing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = "Extract car registration details from this image. Output ONLY JSON: {registrationNumber, brand, model, year, vin, engineNumber}. Use null if unsure.";

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
        console.warn(`[OCR] ${modelName} failed:`, err.message);
        continue;
      }
    }

    return NextResponse.json({ 
      error: lastError?.status === 429 ? 'โควต้าการใช้งาน AI ของคุณหมดสำหรับวันนี้' : (lastError?.message || 'AI Processing Failed') 
    }, { status: lastError?.status || 500 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
