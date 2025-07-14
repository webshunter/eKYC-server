require('dotenv').config();
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

// Test script untuk Tencent Cloud FaceID API dengan ap-jakarta
async function testApJakarta() {
  console.log('🧪 Testing Tencent Cloud FaceID API dengan ap-jakarta...\n');
  
  // Credential dari .env
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  const region = "ap-jakarta"; // Menggunakan ap-jakarta sesuai console
  
  console.log('📋 Configuration:');
  console.log(`   Secret ID: ${secretId?.substring(0, 8)}...`);
  console.log(`   Secret Key: ${secretKey?.substring(0, 8)}...`);
  console.log(`   Region: ${region}`);
  console.log(`   Endpoint: faceid.intl.tencentcloudapi.com\n`);
  
  // Import sesuai dokumentasi resmi
  const FaceidClient = tencentcloud.faceid.v20180301.Client;
  const Credential = tencentcloud.common.Credential;
  
  try {
    // 1. Create credential
    const cred = new Credential(secretId, secretKey);
    
    // 2. Create client dengan ap-jakarta
    const client = new FaceidClient(cred, region);
    
    console.log('✅ Client created successfully');
    console.log(`   Region: ${region}`);
    console.log(`   Endpoint: ${client.endpoint}\n`);
    
    // 3. Test GetFaceIdTokenIntl
    console.log('🔄 Testing GetFaceIdTokenIntl...');
    
    const tokenParams = {
      CheckMode: "liveness",
      SecureLevel: "4",
      Extra: "test_ap_jakarta"
    };
    
    console.log('📤 Request params:', JSON.stringify(tokenParams, null, 2));
    
    const tokenResult = await client.GetFaceIdTokenIntl(tokenParams);
    
    console.log('✅ GetFaceIdTokenIntl SUCCESS!');
    console.log('📋 Response:');
    console.log(JSON.stringify(tokenResult, null, 2));
    
    // 4. Test GetFaceIdResultIntl (jika token berhasil)
    if (tokenResult.SdkToken) {
      console.log('\n🔄 Testing GetFaceIdResultIntl...');
      
      const resultParams = {
        SdkToken: tokenResult.SdkToken
      };
      
      console.log('📤 Request params:', JSON.stringify(resultParams, null, 2));
      
      const resultResponse = await client.GetFaceIdResultIntl(resultParams);
      
      console.log('✅ GetFaceIdResultIntl SUCCESS!');
      console.log('📋 Response:');
      console.log(JSON.stringify(resultResponse, null, 2));
    }
    
  } catch (error) {
    console.log('❌ ERROR:');
    console.log(`   Code: ${error.code}`);
    console.log(`   Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);
    console.log(`   Full Error:`, JSON.stringify(error, null, 2));
    
    // Coba region lain jika ap-jakarta gagal
    console.log('\n🔄 Trying alternative regions...');
    const altRegions = ['ap-singapore', 'ap-hongkong', 'ap-seoul'];
    
    for (const altRegion of altRegions) {
      try {
        console.log(`\n📋 Testing region: ${altRegion}`);
        const altClient = new FaceidClient(cred, altRegion);
        
        const altTokenResult = await altClient.GetFaceIdTokenIntl(tokenParams);
        console.log(`✅ SUCCESS with region: ${altRegion}`);
        console.log('📋 Token:', altTokenResult.SdkToken);
        break;
        
      } catch (altError) {
        console.log(`❌ FAILED with region: ${altRegion}`);
        console.log(`   Error: ${altError.code} - ${altError.message}`);
      }
    }
  }
}

// Jalankan test
testApJakarta().catch(console.error); 