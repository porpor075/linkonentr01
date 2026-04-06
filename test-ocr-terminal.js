const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const fs = require('fs');

async function testOCR() {
  console.log('--- Gemini OCR Terminal Test ---');
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY is not set in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // รายชื่อ Model ที่เราจะทดสอบ
  const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro"];
  
  console.log('Testing model availability...');

  for (const modelName of modelsToTry) {
    try {
      console.log(`\nTrying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // ทดสอบด้วย Prompt ง่ายๆ ก่อนเพื่อเช็คว่า Model ออนไลน์ไหม
      const result = await model.generateContent("Hello, are you ready for OCR? Respond with 'YES'");
      const response = await result.response;
      console.log(`   Success! Response: ${response.text().trim()}`);
      
    } catch (e) {
      console.error(`   Failed: ${e.message}`);
    }
  }
}

testOCR();
