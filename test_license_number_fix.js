#!/usr/bin/env node

/**
 * 🔧 Test Script untuk License Number Fix
 * 
 * Script ini menguji apakah field LicenseNumber sekarang terpetakan dengan benar
 * ke field ktp_number di database.
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:8071';
const TEST_USER_ID = 'test_user_license_fix';

// Test data dengan LicenseNumber
const testOcrData = {
  "LicenseNumber": "3507210903970001",
  "FullName": "GUGUS DARMAYANTO",
  "Sex": "LAKI-LAKI",
  "Birthday": "MALANG, 09-03-1997",
  "FormattedAddress": "DSN. DARUNGAN",
  "Nationality": "WNI",
  "DueDate": "SEUMUR HIDUP",
  "IssuedDate": "07-04-2018"
};

async function testLicenseNumberFix() {
  console.log('🧪 Testing License Number Fix...\n');

  try {
    // Step 1: Save OCR preview data with LicenseNumber
    console.log('📝 Step 1: Saving OCR preview data with LicenseNumber...');
    
    const saveResponse = await axios.post(`${BASE_URL}/api/ekyc/save-ocr-preview`, {
      userId: TEST_USER_ID,
      ocrData: testOcrData,
      sdkToken: 'test_token_license_fix',
      requestId: 'test_request_license_fix'
    });

    if (saveResponse.data.success) {
      console.log('✅ OCR preview data saved successfully');
      console.log(`   Database ID: ${saveResponse.data.databaseId}`);
      console.log(`   Timestamp: ${saveResponse.data.timestamp}\n`);
    } else {
      throw new Error(`Failed to save OCR data: ${saveResponse.data.error}`);
    }

    // Step 2: Check verification status
    console.log('🔍 Step 2: Checking verification status...');
    
    const statusResponse = await axios.get(`${BASE_URL}/api/ekyc/verification-status/${TEST_USER_ID}`);
    
    if (statusResponse.data.success) {
      console.log('✅ Verification status retrieved successfully');
      
      const verificationDetails = statusResponse.data.verificationDetails;
      console.log('📋 Verification Details:');
      console.log(`   ktp_number: ${verificationDetails.ktp_number}`);
      console.log(`   name: ${verificationDetails.name}`);
      console.log(`   birth_place: ${verificationDetails.birth_place}`);
      console.log(`   birth_date: ${verificationDetails.birth_date}`);
      console.log(`   gender: ${verificationDetails.gender}`);
      console.log(`   address: ${verificationDetails.address}\n`);
      
      // Step 3: Verify the fix
      console.log('✅ Step 3: Verifying License Number Fix...');
      
      if (verificationDetails.ktp_number === testOcrData.LicenseNumber) {
        console.log('🎉 SUCCESS: LicenseNumber correctly mapped to ktp_number!');
        console.log(`   Expected: ${testOcrData.LicenseNumber}`);
        console.log(`   Actual: ${verificationDetails.ktp_number}`);
      } else {
        console.log('❌ FAILED: LicenseNumber not correctly mapped');
        console.log(`   Expected: ${testOcrData.LicenseNumber}`);
        console.log(`   Actual: ${verificationDetails.ktp_number}`);
        process.exit(1);
      }
      
      if (verificationDetails.name === testOcrData.FullName) {
        console.log('✅ FullName correctly mapped to name');
      } else {
        console.log('❌ FullName not correctly mapped');
        console.log(`   Expected: ${testOcrData.FullName}`);
        console.log(`   Actual: ${verificationDetails.name}`);
      }
      
      if (verificationDetails.gender === 'L') {
        console.log('✅ Sex correctly mapped to gender (L)');
      } else {
        console.log('❌ Sex not correctly mapped to gender');
        console.log(`   Expected: L`);
        console.log(`   Actual: ${verificationDetails.gender}`);
      }
      
    } else {
      throw new Error(`Failed to get verification status: ${statusResponse.data.error}`);
    }

    // Step 4: Get user data directly
    console.log('\n📊 Step 4: Getting user data directly...');
    
    const userDataResponse = await axios.get(`${BASE_URL}/api/ekyc/user/${TEST_USER_ID}`);
    
    if (userDataResponse.data.success) {
      console.log('✅ User data retrieved successfully');
      const userData = userDataResponse.data.data;
      console.log('📋 User Data:');
      console.log(`   ktp_number: ${userData.ktp_number}`);
      console.log(`   name: ${userData.name}`);
      console.log(`   verification_status: ${userData.verification_status}`);
      console.log(`   created_at: ${userData.created_at}`);
    } else {
      console.log('⚠️ No user data found (this might be normal for preview status)');
    }

    console.log('\n🎯 Test completed successfully!');
    console.log('✅ License Number Fix is working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testLicenseNumberFix();
}

module.exports = { testLicenseNumberFix }; 