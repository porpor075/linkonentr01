const { getAllianzAccessToken, getAllianzQuickQuote } = require('./src/integrations/insurers/allianz');
require('dotenv').config();

async function testSpecModels() {
  console.log('--- Allianz API Test (Standard Spec Models) ---');
  
  try {
    const token = await getAllianzAccessToken();
    if (!token) throw new Error('Could not get token');

    const testVehicles = [
      { name: 'Toyota Hilux Revo', brand: '16', model: '1044', year: '2024' },
      { name: 'Honda City', brand: '10', model: '1022', year: '2024' }
    ];

    for (const v of testVehicles) {
      console.log(`\nTesting ${v.name} (${v.year})...`);
      
      const mockVehicle = {
        brand: v.brand,
        model: v.model,
        year: v.year,
        fuelType: 'PETROL',
        sumInsured: 500000,
        productCode: 'VMI',
        planType: 'VMI1',
        garageType: 'DEALER'
      };

      const quote = await getAllianzQuickQuote(token, mockVehicle);
      
      if (quote && quote.productPackages) {
        console.log('   Success!');
        quote.productPackages.forEach(pkg => {
          console.log(`   > Plan: ${pkg.planCode || 'N/A'}, Price: ${pkg.premium?.grossPremium} THB`);
        });
      } else {
        console.log('   API Response Status:', quote?.fault?.faultstring || 'No Packages');
      }
    }

  } catch (e) {
    console.error('\n--- TEST FAILED ---');
    console.error('Error:', e.message);
  }
}

testSpecModels();
