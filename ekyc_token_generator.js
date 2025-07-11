require('dotenv').config({ path: '../.env' });
const tencentcloud = require("tencentcloud-sdk-nodejs");

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

async function generateEkycToken() {
  try {
    console.log('🔐 Generating eKYC Token...');
    console.log('📋 Using credentials:');
    console.log(`   Secret ID: ${process.env.TENCENT_SECRET_ID}`);
    console.log(`   Region: ${process.env.TENCENT_REGION}`);
    console.log(`   App ID: ${process.env.TENCENT_APP_ID}`);

    // Only use supported parameters
    const params = {
      CompareLib: "AUTHORITY",
      // Uncomment below if you want to set a redirect URL after verification
      // RedirectUrl: "https://your-callback-url.com"
    };

    const result = await client.GetFaceIdToken(params);
    console.log('📄 Response:', JSON.stringify(result, null, 2));
    if (result.Response && result.Response.FaceIdToken) {
      console.log('\n🎯 FaceIdToken for Flutter app:');
      console.log(result.Response.FaceIdToken);
      console.log('\n📱 Copy token ini ke aplikasi Flutter untuk testing eKYC');
      return result.Response.FaceIdToken;
    } else {
      console.error('❌ Failed to generate token');
      console.error('Response:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('❌ Error generating token:', error.message);
    if (error.code) {
      console.error('   Error Code:', error.code);
    }
    console.error('   Full error:', error);
  }
}

// Run the function
generateEkycToken(); 