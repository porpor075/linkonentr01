// ข้อมูลมาตรฐานผู้เอาประกันและผู้ขับขี่ ตาม Allianz Motor Contract API Spec

export interface AllianzAddress {
  addressLine1: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
}

export interface AllianzBeneficiary {
  title: string;
  firstName: string;
  lastName: string;
  relationship: string; // เช่น บุตร, คู่สมรส
}

export interface AllianzPerson {
  title: string;
  firstName: string;
  lastName: string;
  identificationNumber: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  occupation: string;
  email: string;
  phoneNumber: string;
  address: AllianzAddress;
  isDigitalPolicy: boolean; // ข้อ 3: ระบบออกกรมธรรม์อิเล็กทรอนิกส์
}

export interface AllianzContractRequest {
  // ... fields from before
  beneficiaries?: AllianzBeneficiary[];
  isInstallment: boolean; // ข้อ 2: การเลือกงวดชำระ
  contractProcessState: 'VERIFY' | 'ISSUE'; // ข้อ 5: ระบบตรวจสอบสถานะงาน
}
