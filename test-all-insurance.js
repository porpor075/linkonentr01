const { getAllianzAccessToken, getAllianzQuickQuote } = require('./src/integrations/insurers/allianz');
require('dotenv').config();

async function runTests() {
  console.log('--- Allianz API Comprehensive Test (1, 2, 2+, 3, 3+) ---');
  
  try {
    const token = await getAllianzAccessToken();
    console.log('Success! Token length:', token ? token.length : 0);

    const testPlans = [
      { name: 'ชั้น 1', plan: 'VMI1', sum: 1000000, garage: 'DEALER' },
      { name: 'ชั้น 2+', plan: 'VMI2+', sum: 100000, garage: 'COMPANY' },
      { name: 'ชั้น 3+', plan: 'VMI3+', sum: 100000, garage: 'COMPANY' },
      { name: 'ชั้น 2', plan: 'VMI2', sum: 0, garage: 'DEALER' },
      { name: 'ชั้น 3', plan: 'VMI3', sum: null, garage: 'COMPANY' }
    ];

    const vehicle = {
      brand: '16', // Toyota
      model: '1041', // Corolla Altis
      year: '2025',
      fuelType: 'PETROL'
    };

    for (const p of testPlans) {
      console.log(`\nTesting ${p.name} (${p.plan})...`);
      const mockVehicle = {
        ...vehicle,
        sumInsured: p.sum,
        productCode: 'VMI',
        planType: p.plan,
        garageType: p.garage
      };

      try {
        const quote = await getAllianzQuickQuote(token, mockVehicle);
        if (quote && quote.productPackages) {
          quote.productPackages.forEach(pkg => {
            const price = pkg.premium?.grossPremium;
            console.log(`   [SUCCESS] Price: ${price} THB`);
          });
        } else if (quote && quote.errors) {
          console.log(`   [API ERROR] ${quote.errors[0].message} (${quote.errors[0].code})`);
        } else {
          console.log('   [UNKNOWN ERROR] No packages found.');
        }
      } catch (err) {
        console.log(`   [FETCH ERROR] ${err.message}`);
      }
    }

  } catch (e) {
    console.error('Fatal Error:', e.message);
  }
}

runTests();
