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

    // ใช้ Gemini 2.5 Flash เป็นตัวหลักเพื่อความล้ำสมัยและแม่นยำสูง
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.0-flash"
    ];

    let lastError = null;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`[OCR] Executing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        // ปรับ Prompt ให้เน้นย้ำความแม่นยำของภาษาไทย (กฎ, กถ, กฒ)
        const prompt = `
          Extract vehicle registration details from this Thai car registration document. 
          Be extremely careful with Thai characters, especially similar ones like 'กฎ', 'กถ', 'กฒ', 'กก'.
          
          Respond ONLY with a JSON object:
          {
            "registrationNumber": "Full plate number, e.g., '8กฎ 8397'",
            "brand": "Vehicle brand",
            "model": "Vehicle model",
            "year": "Registration year",
            "vin": "17-digit VIN number",
            "engineNumber": "Engine number"
          }
          If any field is unclear, use null.
        `;

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
      error: lastError?.status === 429 ? 'โควต้า AI เต็ม' : (lastError?.message || 'AI Processing Failed') 
    }, { status: lastError?.status || 500 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
