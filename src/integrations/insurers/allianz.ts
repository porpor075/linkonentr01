import fs from 'fs';
import path from 'path';

const logPath = path.join(process.cwd(), 'api_debug.log');
const apiLog = (msg: string) => {
  try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] [ALLIANZ_LIB] ${msg}\n`); } catch (e) {}
};

export async function getAllianzAccessToken() {
  const basicAuth = process.env.ALLIANZ_BASIC_AUTH;
  const url = 'https://asia-uat-th-pc.apis.allianz.com/api/oauth2/token?grant_type=client_credentials&oe_id=th-pc';
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for token

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${basicAuth}` },
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error('Auth Failed');
    const data = await response.json();
    return data.access_token;
  } catch (e: any) {
    clearTimeout(timeoutId);
    apiLog(`Auth Error: ${e.message}`);
    console.error('[Allianz Auth Error]:', e);
    throw e;
  }
}

async function callSingleQuote(accessToken: string, vehicleInfo: any, planCode: string, sumInsured: number, productCode: string = "VMI") {
  const url = 'https://asia-uat-th-pc.apis.allianz.com/v1/motor/quickquotes';
  
  // กำหนดประเภทอู่
  let garage = "COMPANY";
  if (productCode === "CMI" || planCode === "VMI2" || planCode === "VMI3") {
    garage = "UNSPECIFIED";
  } else if (planCode === "VMI1") {
    garage = "DEALER";
  }

  const today = new Date().toISOString().split('T')[0];
  const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0];

  const payload = {
    "policyStartDate": today,
    "policyExpiryDate": nextYear,
    "channel": "WS",
    "productCode": productCode,
    "financialInstitutionMode": "NONFIN",
    "vehicle": {
      "fuelType": String(vehicleInfo.fuelType || "PETROL"),
      "make": String(vehicleInfo.brand || "16"),
      "model": String(vehicleInfo.model || "1041"),
      "usage": productCode === "CMI" ? "1.10" : "110",
      "garageType": garage,
      "registrationNumber": String(vehicleInfo.registrationNumber || "กก1234"),
      "registrationState": "0",
      "registrationType": "GEN",
      "registrationCountry": "THA",
      "yearOfManufacture": String(vehicleInfo.year || "2025"),
      "vehicleIdentificationNumber": "KNDJA" + planCode.replace('+', 'P') + Date.now().toString().slice(-8),
      "color": "10",
      "numberOfSeats": 7
    },
    "productPackages": [
      {
        "name": "GRANU",
        "coverages": [{ "name": planCode, "code": planCode, "sumInsured": sumInsured }]
      }
    ]
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

  const startTime = Date.now();
  apiLog(`[${planCode}] START. Payload: ${JSON.stringify(payload)}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Language': 'th' 
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    apiLog(`[${planCode}] FINISHED in ${duration}ms. Status: ${response.status}`);

    const rawText = await response.text();
    apiLog(`[ALLIANZ_RAW] RESPONSE: ${rawText.slice(0, 1000)}`);
    try {
      return JSON.parse(rawText);
    } catch (parseError) {
      apiLog(`[${planCode}] Parse Error. Raw: ${rawText.slice(0, 200)}`);
      return { errors: [{ message: "Response is not valid JSON", code: "PARSE_ERROR", raw: rawText.slice(0, 100) }] };
    }
  } catch (e: any) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;
    if (e.name === 'AbortError') {
      apiLog(`[${planCode}] TIMEOUT after ${duration}ms`);
      return { errors: [{ message: "Allianz API ไม่ตอบสนอง (Timeout 60s)", code: "TIMEOUT" }] };
    }
    apiLog(`[${planCode}] ERROR after ${duration}ms: ${e.message}`);
    return null;
  }
}

export async function getAllianzQuickQuote(accessToken: string, vehicleInfo: any) {
  // รองรับการเช็คทั้ง VMI และ CMI
  const productCode = vehicleInfo.insuranceCategory === 'CMI' ? 'CMI' : 'VMI';
  const plan = productCode === 'CMI' ? 'CMI' : (vehicleInfo.planType || 'VMI1');
  const sum = productCode === 'CMI' ? 0 : (vehicleInfo.sumInsured || 1000000);
  
  return await callSingleQuote(accessToken, vehicleInfo, plan, sum, productCode);
}

export async function getAllianzPackagesList(accessToken: string, vehicleInfo: any, managedPlans: any[]) {
  const url = 'https://asia-uat-th-pc.apis.allianz.com/v1/motor/quickquotes';
  
  const userGarage = vehicleInfo.garageType || "COMPANY";
  const targetSum = vehicleInfo.listSumInsured || vehicleInfo.sumInsured || 500000;

  // สร้างรายการ productPackages แยกตามแผนเพื่อให้ Allianz คืนราคาแยกกันทุกแผน
  const productPackages = managedPlans.map(p => ({
    name: p.planName,
    coverages: [{
      name: p.planName,
      code: p.planCode,
      sumInsured: p.planCode === 'VMI1' ? targetSum : (p.planCode.includes('+') ? 100000 : 0)
    }]
  }));

  const payload = {
    "policyStartDate": new Date().toISOString().split('T')[0],
    "policyExpiryDate": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    "channel": "WS",
    "productCode": "VMI",
    "financialInstitutionMode": "NONFIN",
    "vehicle": {
      "fuelType": String(vehicleInfo.fuelType || "PETROL"),
      "make": String(vehicleInfo.brand || "16"),
      "model": String(vehicleInfo.model || "1041"),
      "usage": "110",
      "garageType": userGarage, 
      "vehicleIdentificationNumber": "KNDJALIST" + Date.now().toString().slice(-8),
      "color": "10",
      "registrationNumber": String(vehicleInfo.registrationNumber || "กก1234"),
      "registrationState": "0",
      "registrationType": "GEN",
      "registrationCountry": "THA",
      "yearOfManufacture": String(vehicleInfo.year || "2025"),
      "numberOfSeats": 7
    },
    "productPackages": productPackages
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  apiLog(`[LIST] START single consolidated request. Count: 5 plans`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Language': 'th' 
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const rawText = await response.text();
    apiLog(`[ALLIANZ_RAW] RESPONSE: ${rawText.slice(0, 1000)}`);
    try {
      return JSON.parse(rawText);
    } catch (e) {
      apiLog(`[LIST] Parse Error: ${rawText.slice(0, 100)}`);
      return null;
    }
  } catch (e: any) {
    clearTimeout(timeoutId);
    apiLog(`[LIST] Error: ${e.message}`);
    return null;
  }
}

export async function getAllianzContract(accessToken: string, contractId: string) {
  const url = `https://asia-uat-th-pc.apis.allianz.com/v1/motor/contracts/${contractId}`;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  apiLog(`[GET_CONTRACT] START. ID: ${contractId}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Language': 'th' 
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    apiLog(`[GET_CONTRACT] FINISHED. Status: ${response.status}`);

    const rawText = await response.text();
    apiLog(`[ALLIANZ_RAW] RESPONSE: ${rawText.slice(0, 1000)}`);
    try {
      return JSON.parse(rawText);
    } catch (e) {
      apiLog(`[GET_CONTRACT] Parse Error: ${rawText.slice(0, 100)}`);
      return null;
    }
  } catch (e: any) {
    clearTimeout(timeoutId);
    apiLog(`[GET_CONTRACT] Error: ${e.message}`);
    return null;
  }
}

export async function createAllianzContract(accessToken: string, data: any) {
  const url = 'https://asia-uat-th-pc.apis.allianz.com/v1/motor/contracts';
  
  const payload = {
    "quotationId": data.quotationId,
    "policyStartDate": new Date().toISOString().split('T')[0],
    "policyExpiryDate": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    "insuredPerson": {
      "title": data.insured.title,
      "firstName": data.insured.firstName,
      "lastName": data.insured.lastName,
      "identificationNumber": data.insured.idCard,
      "birthDate": data.insured.birthDate || "1995-01-01",
      "gender": data.insured.gender || "MALE",
      "occupation": data.insured.occupation || "1",
      "email": data.insured.email || "test@example.com",
      "phoneNumber": data.insured.phone || "0812345678",
      "address": {
        "addressLine1": data.insured.addressLine1,
        "subDistrict": data.insured.subDistrict,
        "district": data.insured.district,
        "province": data.insured.province,
        "postalCode": data.insured.postalCode
      },
      "isDigitalPolicy": true
    },
    "vehicle": {
      "make": data.vehicle.make,
      "model": data.vehicle.model,
      "yearOfManufacture": String(data.vehicle.yearOfManufacture),
      "vehicleIdentificationNumber": data.vehicle.vin,
      "registrationNumber": data.vehicle.registrationNumber || "กก1234",
      "registrationState": "0"
    },
    "productPackages": [{
      "code": data.plan.planCode,
      "coverages": [{
        "code": data.plan.planCode,
        "sumInsured": data.plan.price || 500000
      }]
    }],
    "isInstallment": false,
    "contractProcessState": "ISSUE"
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  apiLog(`[CREATE_CONTRACT] START. Payload: ${JSON.stringify(payload)}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Language': 'th' 
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const rawText = await response.text();
    apiLog(`[CREATE_CONTRACT] Status: ${response.status}. Raw: ${rawText}`);
    
    return JSON.parse(rawText);
  } catch (e: any) {
    clearTimeout(timeoutId);
    apiLog(`[CREATE_CONTRACT] Error: ${e.message}`);
    throw e;
  }
}

export async function cancelAllianzContract(accessToken: string, contractId: string, reason: string = "User requested cancellation") {
  const url = `https://asia-uat-th-pc.apis.allianz.com/v1/motor/contracts/${contractId}/amendments`;
  
  const payload = {
    "type": "RY11", // RY11 คือรหัสสำหรับ Cancellation ตาม Spec
    "reason": reason
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  apiLog(`[CANCEL_CONTRACT] START. ID: ${contractId}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Language': 'th' 
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    const rawText = await response.text();
    apiLog(`[CANCEL_CONTRACT] Status: ${response.status}. Raw: ${rawText}`);
    
    return JSON.parse(rawText);
  } catch (e: any) {
    clearTimeout(timeoutId);
    apiLog(`[CANCEL_CONTRACT] Error: ${e.message}`);
    throw e;
  }
}
