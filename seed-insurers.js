const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const insurersData = JSON.parse(fs.readFileSync('./insurers.json', 'utf8'));
  
  for (const insurer of insurersData) {
    // อัปเดตโลโก้ Allianz ให้เป็นตัวใหม่ด้วย
    const logoUrl = insurer.id === 1 ? '/allianz-logo.png' : insurer.logoUrl;
    
    await prisma.insurer.upsert({
      where: { id: insurer.id },
      update: {
        nameTh: insurer.nameTh,
        nameEn: insurer.nameEn,
        logoUrl: logoUrl,
        integrationType: insurer.integrationType,
        apiEndpoint: insurer.apiEndpoint
      },
      create: {
        id: insurer.id,
        nameTh: insurer.nameTh,
        nameEn: insurer.nameEn,
        logoUrl: logoUrl,
        integrationType: insurer.integrationType,
        apiEndpoint: insurer.apiEndpoint
      }
    });
    console.log(`Synced insurer: ${insurer.nameTh}`);
  }
  
  console.log('Successfully synced all insurers from insurers.json');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
