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

async function testTencentOCRDetailed() {
  console.log('🔍 Detailed Tencent Cloud OCR Test...');
  console.log('📋 Configuration:');
  console.log(`   Secret ID: ${process.env.TENCENT_SECRET_ID?.substring(0, 8)}...`);
  console.log(`   Secret Key: ${process.env.TENCENT_SECRET_KEY?.substring(0, 8)}...`);
  console.log(`   Region: ${process.env.TENCENT_REGION || "ap-jakarta"}`);
  console.log(`   OCR Endpoint: ${ocrClient.endpoint}`);
  console.log('');

  // Test 1: Check client configuration
  console.log('🧪 Test 1: Client Configuration');
  try {
    console.log('✅ OCR Client created successfully');
    console.log(`   Endpoint: ${ocrClient.endpoint}`);
    console.log(`   Region: ${process.env.TENCENT_REGION || "ap-jakarta"}`);
    console.log(`   Credential: ${cred.secretId ? 'Set' : 'Not Set'}`);
  } catch (error) {
    console.log('❌ Client configuration failed:', error.message);
    return;
  }
  console.log('');

  // Test 2: Test with different image sizes
  const testImages = [
    {
      name: "1x1 Pixel (Minimal)",
      base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    },
    {
      name: "10x10 Pixel (Small)",
      base64: "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QjY0NjdGNjY4NjU0MTFFQ0E1NUNGRTY1M0E3OTc1NUMiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QjY0NjdGNjc4NjU0MTFFQ0E1NUNGRTY1M0E3OTc1NUMiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpCNjQ2N0Y2NDg2NTQxMUVDQTU1Q0ZFNjUzQTc5NzU1QyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpCNjQ2N0Y2NTg2NTQxMUVDQTU1Q0ZFNjUzQTc5NzU1QyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PgH//v38+/r5+Pf29fTz8vHw7+7t7Ovq6ejn5uXk4+Lh4N/e3dzb2tnY19bV1NPS0dDPzs3My8rJyMfGxcTDwsHAv769vLu6ubi3trW0s7KxsK+urayrqqmop6alpKOioaCfnp2cm5qZmJeWlZSTkpGQj46NjIuKiYiHhoWEg4KBgH9+fXx7enl4d3Z1dHNycXBvbm1sa2ppaGdmZWRjYmFgX15dXFtaWVhXVlVUU1JRUE9OTUxLSklIR0ZFRENCQUA/Pj08Ozo5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAPDg0MCwoJCAcGBQQDAgEAACH5BAEAAAAALAAAAAAoACgAAAIRhI+py+0Po5y02ouz3rz7D4biSJbmiabqyrbuCwAAOw=="
    }
  ];

  for (const testImage of testImages) {
    console.log(`🧪 Test 2: ${testImage.name}`);
    try {
      const params = {
        ImageBase64: testImage.base64
      };
      
      console.log(`📤 Image size: ${testImage.base64.length} characters`);
      const result = await callTencentAPI(ocrClient, 'RecognizeIndonesiaIDCardOCR', params);
      console.log('✅ SUCCESS!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.log('❌ FAILED:');
      console.log(`   Error Code: ${error.code}`);
      console.log(`   Error Message: ${error.message}`);
      console.log(`   Request ID: ${error.requestId}`);
      
      // Analyze error type
      if (error.code === 'FailedOperation.UnOpenError') {
        console.log('🔍 Analysis: Service not activated or billing issue');
        console.log('💡 Solution: Check Tencent Cloud Console > OCR > Service Activation');
      } else if (error.code === 'AuthFailure') {
        console.log('🔍 Analysis: Authentication failed');
        console.log('💡 Solution: Check Secret ID and Secret Key');
      } else if (error.code === 'InvalidParameter') {
        console.log('🔍 Analysis: Invalid parameter');
        console.log('💡 Solution: Check image format and size');
      } else {
        console.log('🔍 Analysis: Unknown error');
        console.log('💡 Solution: Check Tencent Cloud Console for details');
      }
    }
    console.log('');
  }

  // Test 3: Check available methods
  console.log('🧪 Test 3: Available OCR Methods');
  try {
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(ocrClient))
      .filter(name => typeof ocrClient[name] === 'function' && name !== 'constructor');
    
    console.log('✅ Available methods:');
    methods.forEach(method => {
      console.log(`   - ${method}`);
    });
  } catch (error) {
    console.log('❌ Failed to get methods:', error.message);
  }
  console.log('');

  // Test 4: Check service status
  console.log('🧪 Test 4: Service Status Check');
  console.log('📋 To check service status, please visit:');
  console.log('   https://console.cloud.tencent.com/ocr');
  console.log('   https://console.cloud.tencent.com/billing/usage');
  console.log('   https://console.cloud.tencent.com/cam/policy');
  console.log('');
}

// Run tests
testTencentOCRDetailed().catch(console.error); 