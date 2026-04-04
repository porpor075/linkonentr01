// ข้อมูลจริงจากเอกสาร Motor Contract API 4.0.1 Specification (YAML)
// เฉพาะค่าที่ระบุไว้ในคำอธิบายฟิลด์ (Description) และตัวอย่าง (Example) เท่านั้น

export const VEHICLE_BRANDS = [
  { code: '16', name: 'Honda' },
  { code: '39', name: 'Toyota' },
  { code: '10', name: 'Toyota (Spec Code 10)' },
];

export const VEHICLE_MODELS: Record<string, { code: string; name: string }[]> = {
  '16': [ // Honda
    { code: '1041', name: 'ACCORD 2.0 4 Doors' },
    { code: '1043', name: 'CIVIC 1.8' },
  ],
  '39': [ // Toyota
    { code: '1091', name: 'COROLLA ALTIS 1.6' },
    { code: '1001', name: 'HILUX VIGO SINGLE 2.5 J' },
  ],
  '10': [ // Toyota Spec Code 10
    { code: '1041', name: 'COROLLA (Standard)' },
  ]
};

export const YEARS = ['2025', '2024', '2023', '2022', '2021', '2020', '2019'];

export const FUEL_TYPES = [
  { code: 'PETROL', name: 'น้ำมัน (Petrol)' },
  { code: 'ELECTRIC', name: 'ไฟฟ้า (Electric)' },
];

export const GARAGE_TYPES = [
  { code: 'DEALER', name: 'ซ่อมห้าง (Dealer)' },
  { code: 'COMPANY', name: 'ซ่อมอู่ (Company)' },
];
