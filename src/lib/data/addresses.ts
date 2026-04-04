// Allianz Address Master Data Mapping
// อ้างอิงรหัสจาก Allianz Motor API Specification (UAT)

export interface SubDistrict {
  code: string;
  name: string;
  postalCode: string;
}

export interface District {
  code: string;
  name: string;
  subDistricts: SubDistrict[];
}

export interface Province {
  code: string;
  name: string;
  districts: District[];
}

export const PROVINCES: Province[] = [
  {
    code: '0', // รหัสกรุงเทพฯ (อ้างอิงตาม Specification ตัวอย่างใช้รหัส 0)
    name: 'กรุงเทพมหานคร',
    districts: [
      {
        code: '6', // รหัสเขตปทุมวัน (Pathum Wan)
        name: 'ปทุมวัน',
        subDistricts: [
          {
            code: '84', // แขวงลุมพินี (Lumpini)
            name: 'ลุมพินี',
            postalCode: '10330'
          },
          {
            code: '83', // ตัวอย่าง: แขวงปทุมวัน
            name: 'ปทุมวัน',
            postalCode: '10330'
          }
        ]
      },
      {
        code: '1', // เขตพระนคร
        name: 'พระนคร',
        subDistricts: [
          {
            code: '1', 
            name: 'พระบรมมหาราชวัง',
            postalCode: '10200'
          }
        ]
      }
    ]
  }
];

// ฟังก์ชัน Helper สำหรับค้นหาข้อมูล
export const findProvince = (code: string) => PROVINCES.find(p => p.code === code);
export const findDistrict = (pCode: string, dCode: string) => 
  findProvince(pCode)?.districts.find(d => d.code === dCode);
