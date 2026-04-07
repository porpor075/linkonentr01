const { getAllianzAccessToken, getAllianzQuickQuote } = require('./src/integrations/insurers/allianz');
require('dotenv').config();

async function testAllianz() {
  console.log('--- Allianz API Terminal Test ---');
  
  try {
    // 1. ทดสอบดึง Token
    console.log('1. Fetching Access Token...');
    const token = await getAllianzAccessToken();
    console.log('   Success! Token length:', token ? token.length : 0);

    if (!token) throw new Error('Could not get token');

    // 2. จำลองข้อมูลรถ (Toyota Altis 2024)
    const mockVehicle = {
      brand: '16', // Toyota
      model: '1041', // Corolla Altis
      year: '2025',
      fuelType: 'PETROL',
      sumInsured: 1000000,
      productCode: 'VMI',
      planType: 'VMI1',
      garageType: 'DEALER'
    };

    console.log('\n2. Fetching Premium for:', mockVehicle.brand, mockVehicle.model, mockVehicle.year);
    
    const quote = await getAllianzQuickQuote(token, mockVehicle);
    
    if (quote && quote.productPackages) {
      console.log('   Success! Found', quote.productPackages.length, 'packages.');
      quote.productPackages.forEach(pkg => {
        const price = pkg.premium?.grossPremium;
        console.log(`   > Plan: ${pkg.planCode || 'N/A'}, Price: ${price} THB`);
      });
    } else {
      console.log('   API returned success but no packages found.');
      console.log('   Full Response:', JSON.stringify(quote, null, 2));
    }

  } catch (e) {
    console.error('\n--- TEST FAILED ---');
    console.error('Error Message:', e.message);
    if (e.response) {
      console.error('API Error Response:', await e.response.text());
    }
  }
}

testAllianz();
