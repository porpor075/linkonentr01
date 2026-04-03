const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
  
  for (const p of products) {
    const { isApiManaged, ...data } = p;
    await prisma.insurancePlan.upsert({
      where: { id: String(data.id) },
      update: {
        planName: data.planName,
        planCode: data.planCode,
        planType: data.planType,
        repairType: data.repairType,
        basePremium: data.basePremium,
        totalPremium: data.totalPremium,
        isActive: data.isActive
      },
      create: {
        id: String(data.id),
        insurerId: data.insurerId,
        planName: data.planName,
        planCode: data.planCode,
        planType: data.planType,
        repairType: data.repairType,
        basePremium: data.basePremium,
        totalPremium: data.totalPremium,
        isActive: data.isActive
      }
    });
  }
  console.log('Successfully imported all products!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
