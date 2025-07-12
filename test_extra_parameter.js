const axios = require('axios');

const BASE_URL = 'http://localhost:8071';

async function testExtraParameter() {
  console.log('🧪 Testing Extra Parameter with User IDs\n');

  const testUsers = [
    { id: 'user001', name: 'John Doe' },
    { id: 'user002', name: 'Jane Smith' },
    { id: '12345', name: 'Numeric User' },
    { id: '', name: 'Default User (no ID)' }
  ];

  for (const user of testUsers) {
    console.log(`\n👤 Testing User: ${user.name} (ID: ${user.id || 'default'})`);
    console.log('─'.repeat(50));

    try {
      // Generate token with user ID
      const tokenUrl = user.id 
        ? `${BASE_URL}/api/ekyc/token?userId=${user.id}`
        : `${BASE_URL}/api/ekyc/token`;

      console.log(`📤 Request URL: ${tokenUrl}`);

      const tokenResponse = await axios.get(tokenUrl);
      
      if (tokenResponse.data.success) {
        console.log('✅ Token generated successfully!');
        console.log(`   User ID: ${tokenResponse.data.userId}`);
        console.log(`   Extra: ${tokenResponse.data.extra}`);
        console.log(`   Token: ${tokenResponse.data.token.substring(0, 20)}...`);
        console.log(`   Method: ${tokenResponse.data.method}`);

        // Simulate saving to database
        console.log('\n💾 Simulating database save:');
        const dbRecord = {
          userId: tokenResponse.data.userId,
          sdkToken: tokenResponse.data.token,
          extra: tokenResponse.data.extra,
          timestamp: new Date().toISOString(),
          status: 'pending'
        };
        console.log('   Database Record:', JSON.stringify(dbRecord, null, 2));

        // Extract user ID from extra parameter
        const extraParts = tokenResponse.data.extra.split('_');
        const extractedUserId = extraParts[1];
        const timestamp = extraParts[2];
        
        console.log('\n🔍 Extra Parameter Analysis:');
        console.log(`   Extracted User ID: ${extractedUserId}`);
        console.log(`   Timestamp: ${timestamp}`);
        console.log(`   Original User ID: ${user.id || 'default'}`);
        console.log(`   Match: ${extractedUserId === (user.id || 'default_user') ? '✅' : '❌'}`);

      } else {
        console.log('❌ Token generation failed:');
        console.log('   Error:', tokenResponse.data.error);
        if (tokenResponse.data.tencentError) {
          console.log('   Tencent Error:', tokenResponse.data.tencentError.message);
        }
      }

    } catch (error) {
      console.log('❌ Request failed:');
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Error:', error.response.data.error);
      } else {
        console.log('   Error:', error.message);
      }
    }
  }

  console.log('\n\n📊 Summary:');
  console.log('Extra parameter format: user_{userId}_{timestamp}');
  console.log('Benefits:');
  console.log('  ✅ User tracking and identification');
  console.log('  ✅ Database integration');
  console.log('  ✅ Audit trail');
  console.log('  ✅ Compliance requirements');
}

async function testResultRetrieval() {
  console.log('\n\n🔍 Testing Result Retrieval with Extra Parameter\n');
  console.log('Note: This test requires a valid SdkToken from previous requests');
  console.log('You can manually test with:');
  console.log('curl -X POST "http://localhost:8071/api/ekyc/result" \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"SdkToken": "your_token_here"}\'');
}

// Run tests
async function runTests() {
  try {
    await testExtraParameter();
    await testResultRetrieval();
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first:');
    console.log('   cd backend && npm start');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Extra Parameter Test Suite');
  console.log('='.repeat(50));

  const serverRunning = await checkServer();
  if (serverRunning) {
    await runTests();
  }
}

main(); 