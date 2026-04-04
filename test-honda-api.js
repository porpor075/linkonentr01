const { getAllianzAccessToken, getAllianzQuickQuote } = require('./src/integrations/insurers/allianz');
require('dotenv').config();

async function testHonda() {
  console.log('--- Allianz API Terminal Test (HONDA) ---');
  
  try {
    const token = await getAllianzAccessToken();
    if (!token) throw new Error('Could not get token');

    // จำลองข้อมูลรถ Honda Civic 2024
    const mockVehicle = {
      brand: '10', // Honda
      model: '1021', // Civic
      year: '2024',
      fuelType: 'PETROL',
      sumInsured: 700000,
      productCode: 'VMI',
      planType: 'VMI1',
      garageType: 'DEALER'
    };

    console.log(`\nChecking premium for ${mockVehicle.brand === '10' ? 'Honda' : mockVehicle.brand} ${mockVehicle.model === '1021' ? 'Civic' : mockVehicle.model} ${mockVehicle.year}...`);
    
    const quote = await getAllianzQuickQuote(token, mockVehicle);
    
    if (quote && quote.productPackages) {
      console.log('   Success! Found', quote.productPackages.length, 'packages.');
      quote.productPackages.forEach(pkg => {
        const price = pkg.premium?.grossPremium;
        console.log(`   > Plan: ${pkg.planCode || 'N/A'}, Price: ${price} THB`);
      });
    } else {
      console.log('   API Response Status: Failed to get packages');
      console.log('   Full Response:', JSON.stringify(quote, null, 2));
    }

  } catch (e) {
    console.error('\n--- TEST FAILED ---');
    console.error('Error:', e.message);
  }
}

testHonda();
