const { getAllianzAccessToken, getAllianzQuickQuote } = require('./src/integrations/insurers/allianz');
require('dotenv').config();

async function runTests() {
  console.log('--- Allianz API Multi-Vehicle Test ---');
  
  try {
    const token = await getAllianzAccessToken();

    const testCases = [
      {
        desc: 'HONDA ACCORD 2017 (Brand 16, Model 1041)',
        vehicle: { brand: '16', model: '1041', year: '2017', fuelType: 'PETROL' },
        plans: [
          { name: 'ชั้น 2+', plan: 'VMI2+', sum: 300000, garage: 'COMPANY' },
          { name: 'ชั้น 3+', plan: 'VMI3+', sum: 300000, garage: 'COMPANY' }
        ]
      },
      {
        desc: 'ISUZU D-MAX 2024 (Brand 18, Model 1133)',
        vehicle: { brand: '18', model: '1133', year: '2024', fuelType: 'PETROL', usage: '320' },
        plans: [
          { name: 'ชั้น 3+', plan: 'VMI3+', sum: 500000, garage: 'COMPANY' }
        ]
      },
      {
        desc: 'CHEVROLET COLORADO 2004 (Brand 4, Model 946)',
        vehicle: { brand: '4', model: '946', year: '2004', fuelType: 'PETROL', usage: '210' },
        plans: [
          { name: 'ชั้น 3', plan: 'VMI3', sum: null, garage: 'UNSPECIFIED' }
        ]
      }
    ];

    for (const tc of testCases) {
      console.log(`\n>>> ${tc.desc}`);
      for (const p of tc.plans) {
        process.stdout.write(`  Testing ${p.name} (${p.plan})... `);
        const mockVehicle = {
          ...tc.vehicle,
          sumInsured: p.sum,
          productCode: 'VMI',
          planType: p.plan,
          garageType: p.garage
        };

        try {
          const quote = await getAllianzQuickQuote(token, mockVehicle);
          if (quote && quote.productPackages) {
            const price = quote.productPackages[0].premium?.grossPremium;
            console.log(`[SUCCESS] Price: ${price} THB`);
          } else if (quote && quote.errors) {
            console.log(`[API ERROR] ${quote.errors[0].message} (${quote.errors[0].code})`);
          } else {
            console.log('[UNKNOWN ERROR]');
          }
        } catch (err) {
          console.log(`[FETCH ERROR] ${err.message}`);
        }
      }
    }

  } catch (e) {
    console.error('Fatal Error:', e.message);
  }
}

runTests();
