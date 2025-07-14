require('dotenv').config();
const express = require('express');
const cors = require('cors');
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");

const app = express();
const PORT = process.env.PORT || 8071;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import sesuai dokumentasi resmi
const FaceidClient = tencentcloud.faceid.v20180301.Client;
const Credential = tencentcloud.common.Credential;

// Create client dengan cara yang benar sesuai dokumentasi
const cred = new Credential(
  process.env.TENCENT_SECRET_ID,
  process.env.TENCENT_SECRET_KEY
);

// Create client dengan ap-jakarta
const client = new FaceidClient(cred, process.env.TENCENT_REGION || "ap-jakarta");

// Debug: Log credential info (without exposing secrets)
console.log('🔐 Client Configuration:');
console.log(`   Secret ID: ${process.env.TENCENT_SECRET_ID?.substring(0, 8)}...`);
console.log(`   Secret Key: ${process.env.TENCENT_SECRET_KEY?.substring(0, 8)}...`);
console.log(`   Region: ${process.env.TENCENT_REGION || "ap-jakarta"}`);
console.log(`   Endpoint: ${client.endpoint}`);

// Helper function untuk Promise-based API calls
function callTencentAPI(method, params) {
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'eKYC Token Generator Server is running',
    timestamp: new Date().toISOString(),
    region: process.env.TENCENT_REGION || "ap-jakarta"
  });
});

// Debug environment endpoint
app.get('/debug/env', (req, res) => {
  res.json({
    region: process.env.TENCENT_REGION,
    appId: process.env.TENCENT_APP_ID,
    secureLevel: process.env.TENCENT_SECURE_LEVEL,
    checkMode: process.env.TENCENT_CHECK_MODE,
    idCardType: process.env.TENCENT_ID_CARD_TYPE,
    port: process.env.PORT
  });
});

// Status endpoint
app.get('/api/ekyc/status', (req, res) => {
  res.json({
    status: 'active',
    service: 'Tencent Cloud FaceID',
    region: process.env.TENCENT_REGION || "ap-jakarta",
    endpoints: {
      token: 'GET /api/ekyc/token',
      result: 'POST /api/ekyc/result'
    }
  });
});

// Generate eKYC Token endpoint
app.get('/api/ekyc/token', async (req, res) => {
  try {
    const userId = req.query.userId || '12345';
    const timestamp = Date.now();
    const extra = `user_${userId}_${timestamp}`;

    console.log('🔐 Generating eKYC Token (International SDK)...');
    console.log('📋 Using credentials:');
    console.log(`   Secret ID: Set`);
    console.log(`   Secret Key: Set`);
    console.log(`   Region: ${process.env.TENCENT_REGION || "ap-jakarta"}`);
    console.log(`   App ID: ${process.env.TENCENT_APP_ID}`);
    console.log(`   User ID: ${userId}`);

    // Parameters untuk GetFaceIdTokenIntl
    const params = {
      CheckMode: process.env.TENCENT_CHECK_MODE || "liveness",
      SecureLevel: process.env.TENCENT_SECURE_LEVEL || "4",
      Extra: extra
    };

    console.log('🔄 Calling GetFaceIdTokenIntl...');
    console.log('📤 Request params:', JSON.stringify(params, null, 2));

    // Call API menggunakan Promise
    const result = await callTencentAPI('GetFaceIdTokenIntl', params);

    console.log('✅ GetFaceIdTokenIntl SUCCESS!');
    console.log('📋 Response:', JSON.stringify(result, null, 2));

    res.json({
      success: true,
      sdkToken: result.SdkToken,
      requestId: result.RequestId,
      extra: extra,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.log('❌ GetFaceIdTokenIntl failed:');
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);
    console.log(`   Full Error:`, JSON.stringify(error, null, 2));

    res.status(500).json({
      success: false,
      error: "Failed to generate token. Please check your Tencent Cloud service activation.",
      tencentError: {
        code: error.code,
        message: error.message,
        requestId: error.requestId
      }
    });
  }
});

// Get eKYC Result endpoint
app.post('/api/ekyc/result', async (req, res) => {
  try {
    const { SdkToken } = req.body;

    if (!SdkToken) {
      return res.status(400).json({
        success: false,
        error: "SdkToken is required"
      });
    }

    console.log('🔍 Getting eKYC Result...');
    console.log(`📋 SdkToken: ${SdkToken}`);

    // Parameters untuk GetFaceIdResultIntl
    const params = {
      SdkToken: SdkToken
    };

    console.log('🔄 Calling GetFaceIdResultIntl...');
    console.log('📤 Request params:', JSON.stringify(params, null, 2));

    // Call API menggunakan Promise
    const result = await callTencentAPI('GetFaceIdResultIntl', params);

    console.log('✅ GetFaceIdResultIntl SUCCESS!');
    console.log('📋 Response:', JSON.stringify(result, null, 2));

    // Parse result
    const response = {
      success: true,
      result: result.Result,
      description: result.Description,
      bestFrame: result.BestFrame,
      video: result.Video,
      similarity: result.Similarity,
      extra: result.Extra,
      requestId: result.RequestId,
      timestamp: new Date().toISOString()
    };

    // Add additional fields if available
    if (result.LivenessCode !== undefined) response.livenessCode = result.LivenessCode;
    if (result.CompareCode !== undefined) response.compareCode = result.CompareCode;
    if (result.Sim !== undefined) response.sim = result.Sim;

    res.json(response);

  } catch (error) {
    console.log('❌ GetFaceIdResultIntl failed:');
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);

    res.status(500).json({
      success: false,
      error: "Failed to get verification result",
      tencentError: {
        code: error.code,
        message: error.message,
        requestId: error.requestId
      }
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 eKYC Token Generator Server (International) running on port ${PORT}`);
  console.log(`📱 Flutter can access: http://localhost:${PORT}/api/ekyc/token`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Status check: http://localhost:${PORT}/api/ekyc/status`);
  console.log(`🔍 Debug env: http://localhost:${PORT}/debug/env`);
  console.log(`📋 Get result: POST http://localhost:${PORT}/api/ekyc/result`);
});

module.exports = app; 