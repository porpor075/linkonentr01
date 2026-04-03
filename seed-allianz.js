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
      logoUrl: 'https://www.allianz.co.th/content/dam/onemarketing/azth/allianz-ayudhya/logo/Allianz_Ayudhya_Logo.png',
      integrationType: 'API',
      apiEndpoint: 'https://asia-uat-th-pc.apis.allianz.com/v1'
    },
    create: {
      nameTh: 'อลิอันซ์ อยุธยา ประกันภัย',
      nameEn: 'Allianz Ayudhya General Insurance',
      logoUrl: 'https://www.allianz.co.th/content/dam/onemarketing/azth/allianz-ayudhya/logo/Allianz_Ayudhya_Logo.png',
      integrationType: 'API',
      apiEndpoint: 'https://asia-uat-th-pc.apis.allianz.com/v1'
    }
  });
  console.log('Successfully added Allianz:', insurer);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
