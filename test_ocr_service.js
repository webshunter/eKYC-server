require('dotenv').config();
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

// Test OCR service activation
async function testOcrService() {
  try {
    console.log('🧪 Testing OCR Service Activation...');
    
    const OcrClient = tencentcloud.ocr.v20181119.Client;
    const Credential = tencentcloud.common.Credential;

    const cred = new Credential(
      process.env.TENCENT_SECRET_ID,
      process.env.TENCENT_SECRET_KEY
    );

    const ocrClient = new OcrClient(cred, process.env.TENCENT_REGION || "ap-jakarta");

    console.log('🔐 OCR Client Configuration:');
    console.log(`   Secret ID: ${process.env.TENCENT_SECRET_ID?.substring(0, 8)}...`);
    console.log(`   Secret Key: ${process.env.TENCENT_SECRET_KEY?.substring(0, 8)}...`);
    console.log(`   Region: ${process.env.TENCENT_REGION || "ap-jakarta"}`);
    console.log(`   Endpoint: ${ocrClient.endpoint}`);

    // Test with a minimal base64 image (1x1 pixel)
    const testImageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

    console.log('🔄 Testing RecognizeIndonesiaIDCardOCR...');
    
    const params = {
      ImageBase64: testImageBase64
    };

    const result = await new Promise((resolve, reject) => {
      ocrClient.RecognizeIndonesiaIDCardOCR(params, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });

    console.log('✅ OCR Service is ACTIVATED!');
    console.log('📋 Response:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.log('❌ OCR Service Test FAILED:');
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);
    
    if (error.code === 'FailedOperation.UnOpenError') {
      console.log('\n🔧 SOLUTION:');
      console.log('1. Login ke Tencent Cloud Console');
      console.log('2. Pergi ke OCR Service');
      console.log('3. Aktifkan "RecognizeIndonesiaIDCardOCR"');
      console.log('4. Pilih region ap-jakarta');
      console.log('5. Tunggu beberapa menit untuk aktivasi');
    }
  }
}

// Run test
testOcrService(); 