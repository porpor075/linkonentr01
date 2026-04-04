const { getAllianzAccessToken, getAllianzQuickQuote } = require('./src/integrations/insurers/allianz');
require('dotenv').config();

async function testSumInsured() {
  console.log('--- Allianz API Test (Class 1, Sum Insured: 1,000,000) ---');
  
  try {
    const token = await getAllianzAccessToken();
    if (!token) throw new Error('Could not get token');

    // ทดสอบ Toyota Hilux Revo ด้วยทุน 1,000,000
    const mockVehicle = {
      brand: '16', // Toyota
      model: '1044', // Hilux Revo
      year: '2024',
      fuelType: 'PETROL',
      sumInsured: 1000000,
      productCode: 'VMI',
      planType: 'VMI1',
      garageType: 'DEALER'
    };

    console.log(`\nTesting with Sum Insured: ${mockVehicle.sumInsured.toLocaleString()} THB...`);
    
    const quote = await getAllianzQuickQuote(token, mockVehicle);
    
    if (quote && quote.productPackages) {
      console.log('   Success!');
      quote.productPackages.forEach(pkg => {
        console.log(`   > Plan: ${pkg.planCode}, Price: ${pkg.premium?.grossPremium} THB`);
      });
    } else {
      console.log('   API Response Status:', quote?.fault?.faultstring || 'No Packages');
      console.log('   Full Error:', JSON.stringify(quote, null, 2));
    }

  } catch (e) {
    console.error('\n--- TEST FAILED ---');
    console.error('Error:', e.message);
  }
}

testSumInsured();
