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

// Tencent Cloud FaceID Client (International Version)
const FaceidClient = tencentcloud.faceid.v20180301.Client;

// Create client with direct credential passing
const client = new FaceidClient({
  secretId: process.env.TENCENT_SECRET_ID,
  secretKey: process.env.TENCENT_SECRET_KEY,
  region: process.env.TENCENT_REGION || "ap-singapore",
  endpoint: "faceid.intl.tencentcloudapi.com"
});

// Debug: Log credential info (without exposing full values)
console.log('🔐 Client Configuration:');
console.log(`   Secret ID: ${process.env.TENCENT_SECRET_ID ? process.env.TENCENT_SECRET_ID.substring(0, 8) + '...' : 'Not set'}`);
console.log(`   Secret Key: ${process.env.TENCENT_SECRET_KEY ? process.env.TENCENT_SECRET_KEY.substring(0, 8) + '...' : 'Not set'}`);
console.log(`   Region: ${process.env.TENCENT_REGION || 'ap-singapore'}`);
console.log(`   Endpoint: faceid.intl.tencentcloudapi.com`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'eKYC Token Generator Server (International)',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check environment variables
app.get('/debug/env', (req, res) => {
  res.json({
    TENCENT_SECRET_ID: process.env.TENCENT_SECRET_ID ? 'Set' : 'Not set',
    TENCENT_SECRET_KEY: process.env.TENCENT_SECRET_KEY ? 'Set' : 'Not set',
    TENCENT_REGION: process.env.TENCENT_REGION || 'ap-singapore',
    TENCENT_APP_ID: process.env.TENCENT_APP_ID || 'Not set',
    TENCENT_SECURE_LEVEL: process.env.TENCENT_SECURE_LEVEL || '4',
    TENCENT_ID_CARD_TYPE: process.env.TENCENT_ID_CARD_TYPE || 'IDCARD',
    TENCENT_CHECK_MODE: process.env.TENCENT_CHECK_MODE || 'liveness',
    TENCENT_EXTRA: process.env.TENCENT_EXTRA || 'idxxxx',
    timestamp: new Date().toISOString()
  });
});

// Generate eKYC token endpoint
app.get('/api/ekyc/token', async (req, res) => {
  try {
    // Get userId from query parameter, use default if not provided
    const userId = req.query.userId || req.query.user_id || 'default_user';
    
    console.log('🔐 Generating eKYC Token (International SDK)...');
    console.log('📋 Using credentials:');
    console.log(`   Secret ID: ${process.env.TENCENT_SECRET_ID ? 'Set' : 'Not set'}`);
    console.log(`   Secret Key: ${process.env.TENCENT_SECRET_KEY ? 'Set' : 'Not set'}`);
    console.log(`   Region: ${process.env.TENCENT_REGION || 'ap-singapore'}`);
    console.log(`   App ID: ${process.env.TENCENT_APP_ID || 'Not set'}`);
    console.log(`   User ID: ${userId}`);

    let lastTencentError = null;

    // Method 1: GetFaceIdTokenIntl (International version - RECOMMENDED)
    console.log('\n🔄 Trying GetFaceIdTokenIntl method...');
    try {
      const params = {
        CheckMode: process.env.TENCENT_CHECK_MODE || "liveness",
        SecureLevel: process.env.TENCENT_SECURE_LEVEL || "4",
        Extra: `user_${userId}_${Date.now()}` // Use userId in Extra for tracking
      };
      
      console.log('📤 Sending request with params:', JSON.stringify(params, null, 2));
      
      // Use Promise-based approach instead of async/await
      const result = await new Promise((resolve, reject) => {
        client.GetFaceIdTokenIntl(params, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
      
      console.log('✅ GetFaceIdTokenIntl successful!');
      console.log('📥 Response:', JSON.stringify(result, null, 2));
      
      if (result && result.Response && result.Response.SdkToken) {
        console.log('🎯 Token generated successfully!');
        return res.json({
          success: true,
          token: result.Response.SdkToken,
          method: 'GetFaceIdTokenIntl',
          sdkVersion: 'international',
          userId: userId,
          extra: params.Extra,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('⚠️  No token in response');
        console.log('Response structure:', JSON.stringify(result, null, 2));
        return res.status(500).json({
          success: false,
          error: 'No token received from Tencent Cloud',
          response: result,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.log('⚠️  GetFaceIdTokenIntl failed:');
      console.log('   Error Code:', error.code);
      console.log('   Error Message:', error.message);
      console.log('   Request ID:', error.requestId);
      console.log('   Full Error:', JSON.stringify(error, null, 2));
      lastTencentError = {
        method: 'GetFaceIdTokenIntl',
        code: error.code,
        message: error.message,
        requestId: error.requestId,
        fullError: error
      };
    }

    // Method 2: ApplySdkVerificationToken (Alternative method for international)
    console.log('\n🔄 Trying ApplySdkVerificationToken method...');
    try {
      const params = {
        IdCardType: process.env.TENCENT_ID_CARD_TYPE || "IDCARD",
        NeedVerifyIdCard: false,
      };
      
      console.log('📤 Sending request with params:', JSON.stringify(params, null, 2));
      
      // Use Promise-based approach
      const result = await new Promise((resolve, reject) => {
        client.ApplySdkVerificationToken(params, (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        });
      });
      
      console.log('✅ ApplySdkVerificationToken successful!');
      console.log('📥 Response:', JSON.stringify(result, null, 2));
      
      if (result && result.Response && result.Response.SdkToken) {
        console.log('🎯 Token generated successfully!');
        return res.json({
          success: true,
          token: result.Response.SdkToken,
          method: 'ApplySdkVerificationToken',
          sdkVersion: 'international',
          userId: userId,
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      console.log('⚠️  ApplySdkVerificationToken failed:');
      console.log('   Error Code:', error.code);
      console.log('   Error Message:', error.message);
      console.log('   Request ID:', error.requestId);
      console.log('   Full Error:', JSON.stringify(error, null, 2));
      lastTencentError = {
        method: 'ApplySdkVerificationToken',
        code: error.code,
        message: error.message,
        requestId: error.requestId,
        fullError: error
      };
    }
    
    // If all methods fail
    console.log('\n❌ All token generation methods failed');
    return res.status(500).json({
      success: false,
      error: 'Failed to generate token. Please check your Tencent Cloud service activation.',
      details: 'All token generation methods failed. Make sure FaceID service is activated in Tencent Cloud Console.',
      tencentError: lastTencentError,
      sdkVersion: 'international',
      userId: userId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      sdkVersion: 'international',
      timestamp: new Date().toISOString()
    });
  }
});

// Get service status endpoint
app.get('/api/ekyc/status', async (req, res) => {
  try {
    const status = {
      service: 'eKYC Token Generator (International)',
      status: 'running',
      sdkVersion: 'tencentcloud-sdk-nodejs-intl-en',
      timestamp: new Date().toISOString(),
      config: {
        hasSecretId: !!process.env.TENCENT_SECRET_ID,
        hasSecretKey: !!process.env.TENCENT_SECRET_KEY,
        region: process.env.TENCENT_REGION || 'ap-singapore',
        appId: process.env.TENCENT_APP_ID,
        secureLevel: process.env.TENCENT_SECURE_LEVEL || '4',
        idCardType: process.env.TENCENT_ID_CARD_TYPE || 'IDCARD',
        checkMode: process.env.TENCENT_CHECK_MODE || 'liveness',
        extra: process.env.TENCENT_EXTRA || 'idxxxx'
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

// Get eKYC verification result endpoint
app.post('/api/ekyc/result', async (req, res) => {
  try {
    const { SdkToken } = req.body;
    
    if (!SdkToken) {
      return res.status(400).json({
        success: false,
        error: 'SdkToken is required',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('🔍 Getting eKYC verification result...');
    console.log('📋 SdkToken:', SdkToken);
    
    const params = {
      SdkToken: SdkToken
    };
    
    console.log('📤 Sending GetFaceIdResultIntl request with params:', JSON.stringify(params, null, 2));
    
    const result = await new Promise((resolve, reject) => {
      client.GetFaceIdResultIntl(params, (err, response) => {
        if (err) {
          reject(err);
        } else {
          resolve(response);
        }
      });
    });
    
    console.log('✅ GetFaceIdResultIntl successful!');
    console.log('📥 Response:', JSON.stringify(result, null, 2));
    
    if (result && result.Response) {
      return res.json({
        success: true,
        result: result.Response,
        method: 'GetFaceIdResultIntl',
        sdkVersion: 'international',
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'No result received from Tencent Cloud',
        response: result,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.log('❌ GetFaceIdResultIntl failed:');
    console.log('   Error Code:', error.code);
    console.log('   Error Message:', error.message);
    console.log('   Request ID:', error.requestId);
    console.log('   Full Error:', JSON.stringify(error, null, 2));
    
    return res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      requestId: error.requestId,
      sdkVersion: 'international',
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
    sdkVersion: 'international',
    timestamp: new Date().toISOString()
  });
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