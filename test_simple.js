require('dotenv').config();
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

// Test script sederhana untuk Tencent Cloud FaceID API
async function testSimple() {
  console.log('🧪 Testing Tencent Cloud FaceID API...\n');
  
  // Credential dari .env
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  const region = "ap-jakarta";
  
  console.log('📋 Configuration:');
  console.log(`   Secret ID: ${secretId?.substring(0, 8)}...`);
  console.log(`   Secret Key: ${secretKey?.substring(0, 8)}...`);
  console.log(`   Region: ${region}\n`);
  
  // Import SDK
  const FaceidClient = tencentcloud.faceid.v20180301.Client;
  const Credential = tencentcloud.common.Credential;
  
  try {
    // Create credential
    const cred = new Credential(secretId, secretKey);
    
    // Create client
    const client = new FaceidClient(cred, region);
    
    console.log('✅ Client created successfully');
    
    // Test GetFaceIdTokenIntl
    console.log('\n🔄 Testing GetFaceIdTokenIntl...');
    
    const params = {
      CheckMode: "liveness",
      SecureLevel: "4",
      Extra: "test_simple"
    };
    
    console.log('📤 Request params:', JSON.stringify(params, null, 2));
    
    // Gunakan Promise-based call
    const result = await new Promise((resolve, reject) => {
      client.GetFaceIdTokenIntl(params, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('✅ SUCCESS!');
    console.log('📋 Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.SdkToken) {
      console.log('\n🎉 SdkToken generated successfully!');
      console.log(`Token: ${result.SdkToken}`);
    }
    
  } catch (error) {
    console.log('❌ ERROR:');
    console.log(`   Code: ${error.code}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);
    
    if (error.code === 'UnsupportedRegion') {
      console.log('\n💡 Suggestion: Try different region');
      console.log('   Supported regions: ap-singapore, ap-hongkong, ap-seoul, ap-tokyo');
    }
  }
}

// Jalankan test
testSimple().catch(console.error); 