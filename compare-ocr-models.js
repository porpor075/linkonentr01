const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const fs = require('fs');

async function compareModels() {
  console.log('--- 🤖 Gemini OCR Model Comparison Test ---');
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const imageBuffer = fs.readFileSync('test-ocr.jpg');
  
  const models = [
    { name: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Newest)" },
    { name: "gemini-1.5-flash", label: "Gemini 1.5 Flash (Standard)" },
    { name: "gemini-1.5-pro", label: "Gemini 1.5 Pro (High Precision)" }
  ];

  for (const m of models) {
    console.log(`\n🚀 Testing Model: ${m.label}...`);
    const start = Date.now();
    
    try {
      const model = genAI.getGenerativeModel({ model: m.name });
      const prompt = "Extract car registration details from this image. Output ONLY JSON: {registrationNumber, brand, model, year, vin, engineNumber}. Use null if unsure.";

      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { data: imageBuffer.toString("base64"), mimeType: "image/jpeg" } }
      ]);

      const duration = (Date.now() - start) / 1000;
      const text = result.response.text();
      
      console.log(`✅ Success in ${duration}s`);
      console.log(`📦 Data: ${text.trim()}`);
    } catch (e) {
      console.error(`❌ Failed: ${e.message}`);
    }
  }
}

compareModels();
