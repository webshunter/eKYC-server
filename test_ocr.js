require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Test OCR KTP functionality
async function testOcrKtp() {
  try {
    console.log('🧪 Testing OCR KTP functionality...');
    
    // Check if test image exists
    const testImagePath = path.join(__dirname, 'test_ktp.jpg');
    if (!fs.existsSync(testImagePath)) {
      console.log('⚠️  Test image not found. Please place a KTP image as "test_ktp.jpg" in the backend directory.');
      console.log('📋 You can test with any KTP image for OCR functionality.');
      return;
    }

    // Read and encode image
    const imageBuffer = fs.readFileSync(testImagePath);
    const base64Image = imageBuffer.toString('base64');
    
    console.log(`📋 Image loaded: ${imageBuffer.length} bytes`);
    console.log(`📋 Base64 length: ${base64Image.length} characters`);

    // Test OCR API call
    const response = await fetch('http://localhost:8071/api/ekyc/ocr-ktp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: base64Image
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ OCR Test SUCCESS!');
      console.log('📋 Extracted Data:');
      console.log(`   Name: ${result.ocrData.name}`);
      console.log(`   NIK: ${result.ocrData.nik}`);
      console.log(`   Birth Place: ${result.ocrData.placeOfBirth}`);
      console.log(`   Birth Date: ${result.ocrData.dateOfBirth}`);
      console.log(`   Address: ${result.ocrData.address}`);
      console.log(`   Gender: ${result.ocrData.gender}`);
      console.log(`   Religion: ${result.ocrData.religion}`);
      console.log(`   Marital Status: ${result.ocrData.maritalStatus}`);
      console.log(`   Occupation: ${result.ocrData.occupation}`);
      console.log(`   Nationality: ${result.ocrData.nationality}`);
    } else {
      console.log('❌ OCR Test FAILED!');
      console.log(`   Error: ${result.error}`);
      if (result.tencentError) {
        console.log(`   Tencent Error: ${result.tencentError.message}`);
        console.log(`   Error Code: ${result.tencentError.code}`);
      }
    }

  } catch (error) {
    console.log('❌ Test Error:', error.message);
  }
}

// Run test
testOcrKtp(); 