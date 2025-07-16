require('dotenv').config();
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

// Import sesuai dokumentasi resmi
const OcrClient = tencentcloud.ocr.v20181119.Client;
const Credential = tencentcloud.common.Credential;

// Create client dengan cara yang benar sesuai dokumentasi
const cred = new Credential(
  process.env.TENCENT_SECRET_ID,
  process.env.TENCENT_SECRET_KEY
);

// Create OCR client dengan ap-jakarta
const ocrClient = new OcrClient(cred, process.env.TENCENT_REGION || "ap-jakarta");

// Helper function untuk Promise-based API calls
function callTencentAPI(client, method, params) {
  return new Promise((resolve, reject) => {
    client[method](params, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response);
      }
    });
  });
}

// Test image base64 (1x1 pixel PNG)
const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

async function testOCRMethods() {
  console.log('🔍 Testing Tencent Cloud OCR Methods...');
  console.log('📋 Using credentials:');
  console.log(`   Secret ID: ${process.env.TENCENT_SECRET_ID?.substring(0, 8)}...`);
  console.log(`   Secret Key: ${process.env.TENCENT_SECRET_KEY?.substring(0, 8)}...`);
  console.log(`   Region: ${process.env.TENCENT_REGION || "ap-jakarta"}`);
  console.log(`   OCR Endpoint: ${ocrClient.endpoint}`);
  console.log('');

  // Test 1: RecognizeIndonesiaIDCardOCR
  console.log('🧪 Test 1: RecognizeIndonesiaIDCardOCR');
  try {
    const params1 = {
      ImageBase64: testImageBase64
    };
    
    console.log('📤 Request params:', JSON.stringify(params1, null, 2));
    const result1 = await callTencentAPI(ocrClient, 'RecognizeIndonesiaIDCardOCR', params1);
    console.log('✅ SUCCESS!');
    console.log('📋 Response:', JSON.stringify(result1, null, 2));
  } catch (error) {
    console.log('❌ FAILED:');
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);
  }
  console.log('');

  // Test 2: GeneralBasicOCR (general text recognition)
  console.log('🧪 Test 2: GeneralBasicOCR');
  try {
    const params2 = {
      ImageBase64: testImageBase64
    };
    
    console.log('📤 Request params:', JSON.stringify(params2, null, 2));
    const result2 = await callTencentAPI(ocrClient, 'GeneralBasicOCR', params2);
    console.log('✅ SUCCESS!');
    console.log('📋 Response:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.log('❌ FAILED:');
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);
  }
  console.log('');

  // Test 3: IDCardOCR (general ID card recognition)
  console.log('🧪 Test 3: IDCardOCR');
  try {
    const params3 = {
      ImageBase64: testImageBase64
    };
    
    console.log('📤 Request params:', JSON.stringify(params3, null, 2));
    const result3 = await callTencentAPI(ocrClient, 'IDCardOCR', params3);
    console.log('✅ SUCCESS!');
    console.log('📋 Response:', JSON.stringify(result3, null, 2));
  } catch (error) {
    console.log('❌ FAILED:');
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);
  }
  console.log('');

  // Test 4: Check OCR service status
  console.log('🧪 Test 4: Check available OCR methods');
  try {
    console.log('📋 Available methods in OCR client:');
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(ocrClient))
      .filter(name => typeof ocrClient[name] === 'function' && name !== 'constructor');
    
    methods.forEach(method => {
      console.log(`   - ${method}`);
    });
  } catch (error) {
    console.log('❌ FAILED to get methods:', error.message);
  }
}

// Run tests
testOCRMethods().catch(console.error); 