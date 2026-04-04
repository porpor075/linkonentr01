const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config();

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('--- Seeding Mock Sales History ---');

  try {
    // 1. ดึง Agent ทั้งหมด
    const agents = await prisma.user.findMany({
      where: { role: { contains: 'agent' } }
    });
    console.log(`Found ${agents.length} agents.`);

    // 2. ดึงแผนประกันที่ใช้งานอยู่
    const plans = await prisma.insurancePlan.findMany({
      where: { isActive: true },
      include: { insurer: true }
    });
    
    if (plans.length === 0) {
      console.error('No active plans found. Please sync insurers and products first.');
      return;
    }

    const mockData = [
      { name: 'คุณสมชาย ใจดี', brand: 'Toyota', model: 'Hilux Revo', year: '2023' },
      { name: 'คุณวิภา มั่นคง', brand: 'Honda', model: 'Civic', year: '2022' },
      { name: 'คุณอำนาจ ร่ำรวย', brand: 'Isuzu', model: 'D-Max', year: '2024' },
      { name: 'คุณเกศรา มีทรัพย์', brand: 'Mazda', model: 'Mazda 2', year: '2021' },
      { name: 'คุณประเสริฐ ปลอดภัย', brand: 'Toyota', model: 'Fortuner', year: '2023' }
    ];

    for (const agent of agents) {
      console.log(`Generating sales for: ${agent.username}...`);
      
      // สร้าง 3-5 รายการต่อคน
      const count = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < count; i++) {
        const data = mockData[Math.floor(Math.random() * mockData.length)];
        const plan = plans[Math.floor(Math.random() * plans.length)];
        const status = Math.random() > 0.3 ? 'SUCCESS' : 'pending';
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30)); // ย้อนหลัง 0-30 วัน

        // สร้าง Quotation
        const quotation = await prisma.quotation.create({
          data: {
            userId: agent.id,
            customerName: data.name,
            vehicleBrand: data.brand,
            vehicleModel: data.model,
            vehicleYear: data.year,
            sumInsured: plan.totalPremium.mul(30), // ม็อคทุนประกัน
            status: 'completed',
            createdAt: createdAt
          }
        });

        // สร้าง Policy
        await prisma.policy.create({
          data: {
            quotationId: quotation.id,
            planId: plan.id,
            policyNumber: status === 'SUCCESS' ? `POL-${Math.random().toString().slice(2, 10)}` : null,
            status: status,
            premiumAmount: plan.totalPremium,
            commissionAmount: plan.totalPremium.mul(0.15), // ม็อคคอมฯ 15%
            createdAt: createdAt
          }
        });
      }
    }

    console.log('\n--- Mock Seeding Completed Successfully! ---');

  } catch (e) {
    console.error('Seeding failed:', e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
