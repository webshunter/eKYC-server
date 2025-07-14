require('dotenv').config();
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

// Test script untuk Tencent Cloud FaceID API
async function testTencentAPI() {
  console.log('🧪 Testing Tencent Cloud FaceID API...\n');
  
  // Credential dari .env
  const secretId = "IKID5BAzb1HLJ4f4HHrMjutiYHqiT1OpBLJ7";
  const secretKey = "hDWdZIo8II5i9PSIwPfkhR0NXUHtPn14";
  
  console.log('📋 Using credentials:');
  console.log(`   Secret ID: ${secretId.substring(0, 8)}...`);
  console.log(`   Secret Key: ${secretKey.substring(0, 8)}...`);
  console.log(`   Region: ap-singapore (changed from ap-jakarta)`);
  console.log(`   Endpoint: faceid.intl.tencentcloudapi.com\n`);
  
  // Test dengan region yang didukung
  const regions = ['ap-singapore', 'ap-hongkong', 'ap-seoul', 'ap-tokyo', 'ap-bangkok'];
  
  for (const region of regions) {
    console.log(`🔄 Testing region: ${region}`);
    
    try {
      // Create client dengan region yang berbeda
      const FaceidClient = tencentcloud.faceid.v20180301.Client;
      const client = new FaceidClient({
        secretId: secretId,
        secretKey: secretKey,
        region: region,
        endpoint: "faceid.intl.tencentcloudapi.com"
      });
      
      // Parameter untuk GetFaceIdTokenIntl
      const params = {
        CheckMode: "liveness",
        SecureLevel: "4",
        Extra: "idxxxx"
      };
      
      console.log(`📤 Sending request to ${region} with params:`, JSON.stringify(params, null, 2));
      
      // Call API dengan Promise
      const result = await new Promise((resolve, reject) => {
        client.GetFaceIdTokenIntl(params, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
      
      console.log(`✅ SUCCESS! Region ${region} works!`);
      console.log(`📥 Response:`, JSON.stringify(result, null, 2));
      
      if (result && result.Response && result.Response.SdkToken) {
        console.log(`🎯 Token generated: ${result.Response.SdkToken}`);
        console.log(`🎯 Request ID: ${result.Response.RequestId}`);
        
        // Test GetFaceIdResultIntl dengan token yang baru dibuat
        console.log(`\n🔍 Testing GetFaceIdResultIntl with token...`);
        try {
          const resultParams = {
            SdkToken: result.Response.SdkToken
          };
          
          const resultResponse = await new Promise((resolve, reject) => {
            client.GetFaceIdResultIntl(resultParams, (err, response) => {
              if (err) {
                reject(err);
              } else {
                resolve(response);
              }
            });
          });
          
          console.log(`✅ GetFaceIdResultIntl response:`, JSON.stringify(resultResponse, null, 2));
        } catch (resultError) {
          console.log(`⚠️  GetFaceIdResultIntl failed (expected for new token): ${resultError.message}`);
        }
        
        return; // Stop testing setelah berhasil
      }
      
    } catch (error) {
      console.log(`❌ Region ${region} failed:`);
      console.log(`   Error Code: ${error.code}`);
      console.log(`   Error Message: ${error.message}`);
      console.log(`   Request ID: ${error.requestId}`);
      console.log('');
    }
  }
  
  console.log('❌ All regions failed. Please check:');
  console.log('   1. FaceID service activation in Tencent Cloud Console');
  console.log('   2. Credential validity');
  console.log('   3. Network connectivity');
}

// Test dengan ApplySdkVerificationToken sebagai alternatif
async function testApplySdkVerificationToken() {
  console.log('\n🔄 Testing ApplySdkVerificationToken as alternative...\n');
  
  const secretId = "IKID5BAzb1HLJ4f4HHrMjutiYHqiT1OpBLJ7";
  const secretKey = "hDWdZIo8II5i9PSIwPfkhR0NXUHtPn14";
  
  try {
    const FaceidClient = tencentcloud.faceid.v20180301.Client;
    const client = new FaceidClient({
      secretId: secretId,
      secretKey: secretKey,
      region: "ap-singapore",
      endpoint: "faceid.intl.tencentcloudapi.com"
    });
    
    const params = {
      IdCardType: "IDCARD",
      NeedVerifyIdCard: false
    };
    
    console.log(`📤 Sending ApplySdkVerificationToken request with params:`, JSON.stringify(params, null, 2));
    
    const result = await new Promise((resolve, reject) => {
      client.ApplySdkVerificationToken(params, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    
    console.log(`✅ ApplySdkVerificationToken SUCCESS!`);
    console.log(`📥 Response:`, JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log(`❌ ApplySdkVerificationToken failed:`);
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);
  }
}

// Run tests
async function runTests() {
  try {
    await testTencentAPI();
    await testApplySdkVerificationToken();
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Execute
runTests(); 