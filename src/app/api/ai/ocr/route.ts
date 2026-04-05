import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // แปลงไฟล์เป็น Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ดึงชื่อ Model จาก Environment Variable หรือใช้ค่าเริ่มต้น
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
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
    
    // ทำความสะอาด JSON string ที่ได้จาก AI
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error('[OCR_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
