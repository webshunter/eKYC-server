require('dotenv').config();
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

// Test dengan lebih banyak region
async function testMoreRegions() {
  console.log('🧪 Testing More Regions for FaceID...\n');
  
  const secretId = "IKID5BAzb1HLJ4f4HHrMjutiYHqiT1OpBLJ7";
  const secretKey = "hDWdZIo8II5i9PSIwPfkhR0NXUHtPn14";
  
  // Region-region yang mungkin mendukung FaceID
  const regions = [
    'ap-singapore',
    'ap-hongkong', 
    'ap-seoul',
    'ap-tokyo',
    'ap-bangkok',
    'na-siliconvalley',
    'na-ashburn',
    'eu-frankfurt',
    'ap-guangzhou',
    'ap-shanghai',
    'ap-beijing'
  ];
  
  for (const region of regions) {
    console.log(`🔄 Testing region: ${region}`);
    
    try {
      const FaceidClient = tencentcloud.faceid.v20180301.Client;
      const client = new FaceidClient({
        secretId: secretId,
        secretKey: secretKey,
        region: region,
        endpoint: "faceid.intl.tencentcloudapi.com"
      });
      
      const params = {
        CheckMode: "liveness",
        SecureLevel: "4",
        Extra: "idxxxx"
      };
      
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
      console.log(`🎯 Token: ${result.Response.SdkToken}`);
      console.log(`🎯 Request ID: ${result.Response.RequestId}`);
      return;
      
    } catch (error) {
      console.log(`❌ ${region}: ${error.code} - ${error.message}`);
    }
  }
  
  console.log('\n❌ All regions failed. FaceID service may not be activated.');
}

// Test service activation
async function testServiceActivation() {
  console.log('\n🔍 Testing Service Activation...\n');
  
  const secretId = "IKID5BAzb1HLJ4f4HHrMjutiYHqiT1OpBLJ7";
  const secretKey = "hDWdZIo8II5i9PSIwPfkhR0NXUHtPn14";
  
  try {
    // Test dengan service lain untuk memastikan credential valid
    const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");
    const CvmClient = tencentcloud.cvm.v20170312.Client;
    
    const client = new CvmClient({
      secretId: secretId,
      secretKey: secretKey,
      region: "ap-singapore"
    });
    
    const params = {
      Limit: 1
    };
    
    const result = await new Promise((resolve, reject) => {
      client.DescribeInstances(params, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('✅ Credential valid! CVM service works.');
    console.log('📥 CVM Response:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log('❌ Credential test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testMoreRegions();
  await testServiceActivation();
}

runTests(); 