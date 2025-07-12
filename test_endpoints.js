const axios = require('axios');

const BASE_URL = 'http://localhost:8071';

async function testEndpoints() {
  console.log('🧪 Testing eKYC Backend Endpoints...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Debug Environment Variables
    console.log('2️⃣ Testing Debug Environment Variables...');
    const debugResponse = await axios.get(`${BASE_URL}/debug/env`);
    console.log('✅ Debug Env:', debugResponse.data);
    console.log('');

    // Test 3: Service Status
    console.log('3️⃣ Testing Service Status...');
    const statusResponse = await axios.get(`${BASE_URL}/api/ekyc/status`);
    console.log('✅ Service Status:', statusResponse.data);
    console.log('');

    // Test 4: Generate Token
    console.log('4️⃣ Testing Token Generation...');
    try {
      const tokenResponse = await axios.get(`${BASE_URL}/api/ekyc/token`);
      console.log('✅ Token Generated:', tokenResponse.data);
      
      // Test 5: Get Result (if token was generated)
      if (tokenResponse.data.success && tokenResponse.data.token) {
        console.log('');
        console.log('5️⃣ Testing Get Result...');
        const resultResponse = await axios.post(`${BASE_URL}/api/ekyc/result`, {
          SdkToken: tokenResponse.data.token
        });
        console.log('✅ Get Result:', resultResponse.data);
      }
    } catch (tokenError) {
      console.log('❌ Token Generation Failed:', tokenError.response?.data || tokenError.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Test with a specific token (if you have one)
async function testWithSpecificToken(token) {
  console.log(`🧪 Testing with specific token: ${token}\n`);
  
  try {
    const resultResponse = await axios.post(`${BASE_URL}/api/ekyc/result`, {
      SdkToken: token
    });
    console.log('✅ Get Result:', resultResponse.data);
  } catch (error) {
    console.error('❌ Get Result Failed:', error.response?.data || error.message);
  }
}

// Run tests
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Test with specific token
    testWithSpecificToken(args[0]);
  } else {
    // Run all tests
    testEndpoints();
  }
}

module.exports = { testEndpoints, testWithSpecificToken }; 