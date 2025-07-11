require('dotenv').config();
const express = require('express');
const cors = require('cors');
const tencentcloud = require("tencentcloud-sdk-nodejs");

const app = express();
const PORT = process.env.PORT || 8071;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Tencent Cloud FaceID Client
const FaceidClient = tencentcloud.faceid.v20180301.Client;

const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID,
    secretKey: process.env.TENCENT_SECRET_KEY,
  },
  region: process.env.TENCENT_REGION || "ap-jakarta",
  profile: {
    httpProfile: {
      endpoint: "faceid.tencentcloudapi.com",
    },
  },
};

const client = new FaceidClient(clientConfig);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'eKYC Token Generator Server',
    timestamp: new Date().toISOString()
  });
});

// Generate eKYC token endpoint
app.get('/api/ekyc/token', async (req, res) => {
  try {
    console.log('🔐 Generating eKYC Token...');
    console.log('📋 Using credentials:');
    console.log(`   Secret ID: ${process.env.TENCENT_SECRET_ID}`);
    console.log(`   Region: ${process.env.TENCENT_REGION}`);
    console.log(`   App ID: ${process.env.TENCENT_APP_ID}`);

    let lastTencentError = null;

    // Method: GetFaceIdToken (Correct method available in SDK)
    console.log('\n🔄 Trying GetFaceIdToken method...');
    try {
      const params = {
        RuleId: "test_rule_123",
        CompareLib: "AUTHORITY"
      };
      
      console.log('📤 Sending request with params:', JSON.stringify(params, null, 2));
      const result = await client.GetFaceIdToken(params);
      console.log('✅ GetFaceIdToken successful!');
      console.log('📥 Response:', JSON.stringify(result, null, 2));
      
      if (result.Response && result.Response.FaceIdToken) {
        console.log('🎯 Token generated successfully!');
        return res.json({
          success: true,
          token: result.Response.FaceIdToken,
          method: 'GetFaceIdToken',
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.log('⚠️  GetFaceIdToken failed:');
      console.log('   Error Code:', error.code);
      console.log('   Error Message:', error.message);
      console.log('   Request ID:', error.requestId);
      console.log('   Full Error:', JSON.stringify(error, null, 2));
      lastTencentError = {
        method: 'GetFaceIdToken',
        code: error.code,
        message: error.message,
        requestId: error.requestId,
        fullError: error
      };
    }
    
    // If method fails
    console.log('\n❌ GetFaceIdToken method failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate token. Please check your Tencent Cloud service activation.',
      details: 'GetFaceIdToken method failed. Make sure FaceID service is activated in Tencent Cloud Console.',
      tencentError: lastTencentError,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get service status endpoint
app.get('/api/ekyc/status', async (req, res) => {
  try {
    const status = {
      service: 'eKYC Token Generator',
      status: 'running',
      timestamp: new Date().toISOString(),
      config: {
        hasSecretId: !!process.env.TENCENT_SECRET_ID,
        hasSecretKey: !!process.env.TENCENT_SECRET_KEY,
        region: process.env.TENCENT_REGION || 'ap-jakarta',
        appId: process.env.TENCENT_APP_ID
      }
    };
    
    res.json(status);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 eKYC Token Generator Server running on port ${PORT}`);
  console.log(`📱 Flutter can access: http://localhost:${PORT}/api/ekyc/token`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 Status check: http://localhost:${PORT}/api/ekyc/status`);
});

module.exports = app; 