const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const insurer = await prisma.insurer.upsert({
    where: { id: 1 },
    update: {
      nameTh: 'อลิอันซ์ อยุธยา ประกันภัย',
      nameEn: 'Allianz Ayudhya General Insurance',
      logoUrl: '/allianz-logo.png', // เปลี่ยนเป็นโลโก้ใหม่ที่คุณส่งมา
      integrationType: 'API',
      apiEndpoint: 'https://asia-uat-th-pc.apis.allianz.com/v1'
    },
    create: {
      id: 1,
      nameTh: 'อลิอันซ์ อยุธยา ประกันภัย',
      nameEn: 'Allianz Ayudhya General Insurance',
      logoUrl: '/allianz-logo.png', // เปลี่ยนเป็นโลโก้ใหม่ที่คุณส่งมา
      integrationType: 'API',
      apiEndpoint: 'https://asia-uat-th-pc.apis.allianz.com/v1'
    }
  });
  console.log('Successfully updated Allianz logo to local path:', insurer);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
