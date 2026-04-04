const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const insurerId = 2; // ID ของบริษัทประกันทดสอบ
  
  const plans = [
    {
      id: 'p-mock-1',
      insurerId: insurerId,
      planName: 'ประกันชั้น 1 (Super Protection)',
      planCode: 'VMI1',
      planType: 'VMI1',
      repairType: 'DEALER',
      basePremium: 18500,
      totalPremium: 19200,
      isActive: true
    },
    {
      id: 'p-mock-2',
      insurerId: insurerId,
      planName: 'ประกันชั้น 2+ (Extra Safe)',
      planCode: 'VMI2+',
      planType: 'VMI2+',
      repairType: 'COMPANY',
      basePremium: 8500,
      totalPremium: 8900,
      isActive: true
    },
    {
      id: 'p-mock-3',
      insurerId: insurerId,
      planName: 'ประกันชั้น 3+ (Value Save)',
      planCode: 'VMI3+',
      planType: 'VMI3+',
      repairType: 'COMPANY',
      basePremium: 6500,
      totalPremium: 6900,
      isActive: true
    },
    {
      id: 'p-mock-cmi',
      insurerId: insurerId,
      planName: 'พ.ร.บ. รถยนต์ (CMI)',
      planCode: 'CMI',
      planType: 'CMI',
      repairType: 'UNSPECIFIED',
      basePremium: 600,
      totalPremium: 645.21,
      isActive: true
    }
  ];

  console.log('Seeding products for Test Insurer...');
  
  for (const plan of plans) {
    await prisma.insurancePlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan
    });
    console.log(`- Synced: ${plan.planName}`);
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
