const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const fs = require('fs');

async function testOCRWithImage() {
  console.log('--- Gemini OCR Terminal Test with Image ---');
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // โหลดไฟล์ภาพ
  let imageBuffer;
  try {
    imageBuffer = fs.readFileSync('test-ocr.jpg');
    console.log('Successfully loaded test-ocr.jpg');
  } catch (e) {
    console.error('Failed to load image:', e.message);
    return;
  }

  // รายชื่อ Model ที่เราจะทดสอบ (ใช้ชื่อเต็มที่ระบบต้องการ)
  const modelsToTry = ["gemini-1.5-flash-001", "gemini-1.5-flash", "gemini-1.5-flash-latest"];
  
  for (const modelName of modelsToTry) {
    try {
      console.log(`\nTrying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = "Extract vehicle registration info. Output ONLY JSON: {registrationNumber, brand, model, year, vin, engineNumber}. If not found, use null.";

      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/jpeg"
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      console.log(`Success with ${modelName}!`);
      console.log('AI Output:', text);
      
      // ลอง Parse JSON
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : text;
        const data = JSON.parse(jsonStr);
        console.log('Parsed Data:', JSON.stringify(data, null, 2));
        return; // สำเร็จแล้วหยุดเลย
      } catch (parseErr) {
        console.warn('AI output is not valid JSON, but extraction was successful.');
      }
      
    } catch (e) {
      console.error(`   Failed with ${modelName}: ${e.message}`);
    }
  }
}

testOCRWithImage();
