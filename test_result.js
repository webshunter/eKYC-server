require('dotenv').config();
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

// Test script untuk GetFaceIdResultIntl
async function testResult() {
  console.log('🧪 Testing GetFaceIdResultIntl API...\n');
  
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
    
    // Test GetFaceIdResultIntl
    console.log('\n🔄 Testing GetFaceIdResultIntl...');
    
    // Gunakan token dari test sebelumnya
    const sdkToken = "3D59F094-23424-0241C1-9160-8ECE095DA385";
    
    const params = {
      SdkToken: sdkToken
    };
    
    console.log('📤 Request params:');
    console.log(JSON.stringify(params, null, 2));
    
    // Gunakan Promise-based call
    const result = await new Promise((resolve, reject) => {
      client.GetFaceIdResultIntl(params, (err, response) => {
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
    
    // Parse result
    if (result.Result) {
      console.log('\n📊 Result Analysis:');
      console.log(`   Result: ${result.Result}`);
      console.log(`   Description: ${result.Description}`);
      console.log(`   BestFrame: ${result.BestFrame}`);
      console.log(`   Video: ${result.Video}`);
      console.log(`   LivenessCode: ${result.LivenessCode}`);
      console.log(`   CompareCode: ${result.CompareCode}`);
      console.log(`   Sim: ${result.Sim}`);
    }
    
  } catch (error) {
    console.log('❌ ERROR:');
    console.log(`   Code: ${error.code}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);
    
    if (error.code === 'InvalidSdkToken') {
      console.log('\n💡 Suggestion: Token mungkin sudah expired atau invalid');
    }
  }
}

// Jalankan test
testResult().catch(console.error); 