require('dotenv').config();
const express = require('express');
const cors = require('cors');
const tencentcloud = require("tencentcloud-sdk-nodejs-intl-en");
const TesseractOCRService = require('./tesseract_service');
const { testConnection, createEkycTable, saveEkycData, getEkycDataByUserId, updateEkycStatus } = require('./database');

const app = express();
const PORT = process.env.PORT || 8071;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for image uploads
app.use(express.static('public'));

// Import sesuai dokumentasi resmi
const FaceidClient = tencentcloud.faceid.v20180301.Client;
const OcrClient = tencentcloud.ocr.v20181119.Client;
const Credential = tencentcloud.common.Credential;

// Create client dengan cara yang benar sesuai dokumentasi lama
const cred = new Credential(
  process.env.TENCENT_SECRET_ID,
  process.env.TENCENT_SECRET_KEY
);

// Create clients dengan ap-jakarta
const faceidClient = new FaceidClient(cred, process.env.TENCENT_REGION || "ap-jakarta");
const ocrClient = new OcrClient(cred, process.env.TENCENT_REGION || "ap-jakarta");

// Initialize Tesseract OCR service
const tesseractOCRService = new TesseractOCRService();

// Debug: Log credential info (without exposing secrets)
console.log('🔐 Client Configuration:');
console.log(`   Secret ID: ${process.env.TENCENT_SECRET_ID?.substring(0, 8)}...`);
console.log(`   Secret Key: ${process.env.TENCENT_SECRET_KEY?.substring(0, 8)}...`);
console.log(`   Region: ${process.env.TENCENT_REGION || "ap-jakarta"}`);
console.log(`   FaceID Endpoint: ${faceidClient.endpoint}`);
console.log(`   OCR Endpoint: ${ocrClient.endpoint}`);

// Initialize database connection
async function initializeDatabase() {
  console.log('🔄 Initializing database connection...');
  
  const dbConnected = await testConnection();
  if (dbConnected) {
    const tableCreated = await createEkycTable();
    if (tableCreated) {
      console.log('✅ Database initialization completed successfully!');
    } else {
      console.log('⚠️ Database table creation failed, but server will continue...');
    }
  } else {
    console.log('⚠️ Database connection failed, but server will continue...');
  }
}

// Initialize database on startup
initializeDatabase();

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
    database: {
      host: '145.223.22.181',
      database: 'hubunk',
      prefix: 'lon56_',
      table: 'ekyc_ocr_data'
    },
    endpoints: {
      token: 'GET /api/ekyc/token?mode=ocr-selfie',
      tokenSelfieOnly: 'GET /api/ekyc/token?mode=selfie-only',
      result: 'POST /api/ekyc/result',
      ocrKtp: 'POST /api/ekyc/ocr-ktp',
      ocrKtpTesseract: 'POST /api/ekyc/ocr-ktp-tesseract',
      getUserData: 'GET /api/ekyc/user/:userId',
      verificationStatus: 'GET /api/ekyc/verification-status/:userId',
      saveOcrPreview: 'POST /api/ekyc/save-ocr-preview',
      updateStatus: 'PUT /api/ekyc/status/:sdkToken'
    },
    modes: {
      'ocr-selfie': 'OCR KTP + Selfie verification',
      'selfie-only': 'Selfie verification only'
    }
  });
});

// Generate eKYC Token endpoint
app.get('/api/ekyc/token', async (req, res) => {
  try {
    const userId = req.query.userId || '12345';
    const timestamp = Date.now();
    const extra = `user_${userId}_${timestamp}`;
    const mode = req.query.mode || 'ocr-selfie'; // ocr-selfie atau selfie-only

    if (mode === 'ocr-selfie') {
      // Try OCR + Selfie first
      try {
        // Parameters untuk ApplySdkVerificationToken (OCR + Liveness)
        // Berdasarkan dokumentasi Tencent Cloud eKYC
        const params = {
          IdCardType: "IndonesiaIDCard",  // KTP Indonesia
          NeedVerifyIdCard: false,        // Tidak perlu verifikasi ID card tambahan
          Extra: extra
        };

        console.log('🔄 Calling ApplySdkVerificationToken (OCR + Selfie)...');
        console.log('📤 Request params:', JSON.stringify(params, null, 2));

        // Call API menggunakan Promise
        const result = await callTencentAPI(faceidClient, 'ApplySdkVerificationToken', params);

        console.log('✅ ApplySdkVerificationToken SUCCESS!');
        console.log('📋 Response:', JSON.stringify(result, null, 2));

        res.json({
          success: true,
          mode: 'ocr-selfie',
          sdkToken: result.SdkToken,
          requestId: result.RequestId,
          extra: extra,
          timestamp: new Date().toISOString()
        });

      } catch (ocrError) {
        console.log('❌ ApplySdkVerificationToken failed, falling back to selfie-only...');
        console.log(`   Error: ${ocrError.message}`);
        
        // Fallback to selfie-only
        const selfieParams = {
          CheckMode: "liveness",
          SecureLevel: "4",
          Extra: extra
        };

        console.log('🔄 Calling GetFaceIdTokenIntl (Selfie-only)...');
        const selfieResult = await callTencentAPI(faceidClient, 'GetFaceIdTokenIntl', selfieParams);

        console.log('✅ GetFaceIdTokenIntl SUCCESS!');
        res.json({
          success: true,
          mode: 'selfie-only',
          sdkToken: selfieResult.SdkToken,
          requestId: selfieResult.RequestId,
          extra: extra,
          timestamp: new Date().toISOString(),
          fallback: true,
          fallbackReason: ocrError.message
        });
      }
    } else {
      // Selfie-only mode
      const params = {
        CheckMode: "liveness",
        SecureLevel: "4",
        Extra: extra
      };

      console.log('🔄 Calling GetFaceIdTokenIntl (Selfie-only)...');
      console.log('📤 Request params:', JSON.stringify(params, null, 2));

      const result = await callTencentAPI(faceidClient, 'GetFaceIdTokenIntl', params);

      console.log('✅ GetFaceIdTokenIntl SUCCESS!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));

      res.json({
        success: true,
        mode: 'selfie-only',
        sdkToken: result.SdkToken,
        requestId: result.RequestId,
        extra: extra,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.log('❌ Token generation failed:');
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);

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
    const { SdkToken, mode, userId } = req.body;
    if (!SdkToken) {
      return res.status(400).json({
        success: false,
        error: "SdkToken is required"
      });
    }

    if (mode === 'ocr-selfie') {
      // Try GetSdkVerificationResult first (OCR + Selfie)
      try {
        const params = {
          SdkToken: SdkToken
        };
        
        console.log('🔄 Calling GetSdkVerificationResult (OCR + Selfie)...');
        console.log('📤 Request params:', JSON.stringify(params, null, 2));
        
        const result = await callTencentAPI(faceidClient, 'GetSdkVerificationResult', params);
        
        console.log('✅ GetSdkVerificationResult SUCCESS!');
        console.log('📋 Response:', JSON.stringify(result, null, 2));
        
        // Parse result untuk OCR + Liveness
        const response = {
          success: true,
          mode: 'ocr-selfie',
          result: result.Result,
          description: result.Description,
          requestId: result.RequestId,
          timestamp: new Date().toISOString()
        };

        // Extract OCR data from CardVerifyResults if available
        let ocrData = null;
        if (result.CardVerifyResults && result.CardVerifyResults.length > 0) {
          const cardResult = result.CardVerifyResults[0];
          if (cardResult.NormalCardInfo && cardResult.NormalCardInfo.IndonesiaIDCard) {
            const indonesiaCard = cardResult.NormalCardInfo.IndonesiaIDCard;
            
            // Convert date format from DD-MM-YYYY to YYYY-MM-DD
            let birthDate = null;
            if (indonesiaCard.Birthday) {
              const birthdayParts = indonesiaCard.Birthday.split(', ');
              if (birthdayParts.length > 1) {
                const datePart = birthdayParts[1]; // "09-03-1997"
                const dateParts = datePart.split('-');
                if (dateParts.length === 3) {
                  birthDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // "1997-03-09"
                }
              }
            }

            // Map gender
            let gender = null;
            if (indonesiaCard.Sex) {
              if (indonesiaCard.Sex.toUpperCase().includes('LAKI')) gender = 'L';
              else if (indonesiaCard.Sex.toUpperCase().includes('PEREMPUAN')) gender = 'P';
            }

            // Handle expiry date: only save if format is DD-MM-YYYY, else null
            let expiryDate = null;
            if (indonesiaCard.ExpiryDate) {
              const exp = indonesiaCard.ExpiryDate.trim();
              const expParts = exp.split('-');
              if (expParts.length === 3 && expParts[0].length === 2 && expParts[1].length === 2 && expParts[2].length === 4) {
                // Looks like DD-MM-YYYY
                expiryDate = `${expParts[2]}-${expParts[1]}-${expParts[0]}`;
              } else {
                expiryDate = null;
              }
            }

            ocrData = {
              name: indonesiaCard.FullName || null,
              nik: indonesiaCard.NIK || null,
              placeOfBirth: indonesiaCard.Birthday ? indonesiaCard.Birthday.split(',')[0] : null,
              dateOfBirth: birthDate,
              address: indonesiaCard.Address || null,
              rtRw: indonesiaCard.RTRW || null,
              village: indonesiaCard.Village || null,
              district: indonesiaCard.District || null,
              city: indonesiaCard.City || null,
              province: indonesiaCard.Province || null,
              religion: indonesiaCard.Religion || null,
              maritalStatus: indonesiaCard.MaritalStatus || null,
              occupation: indonesiaCard.Occupation || null,
              nationality: indonesiaCard.Nationality || null,
              gender: gender,
              expiryDate: expiryDate,
              issuedDate: indonesiaCard.IssuedDate || null
            };
            response.ocrData = ocrData;
          }
        }

        // Extract liveness data from CompareResults if available
        if (result.CompareResults && result.CompareResults.length > 0) {
          const compareResult = result.CompareResults[0];
          if (compareResult.Sim !== undefined) response.similarity = compareResult.Sim;
          if (compareResult.LiveErrorCode !== undefined) response.livenessCode = compareResult.LiveErrorCode;
          if (compareResult.CompareErrorCode !== undefined) response.compareCode = compareResult.CompareErrorCode;
        }
        
        // Save data to database
        if (userId) {
          try {
            // Enhanced KTP Number mapping - check multiple possible locations
            let ktpNumber = null;
            
            // Check in ocrData first
            if (ocrData && ocrData.IndonesiaIDCard) {
              ktpNumber = ocrData.IndonesiaIDCard.LicenseNumber || ocrData.IndonesiaIDCard.licenseNumber;
            }
            
            // Check in result.CardVerifyResults[0].NormalCardInfo.IndonesiaIDCard
            if (!ktpNumber && result.CardVerifyResults && result.CardVerifyResults.length > 0) {
              const cardVerifyResult = result.CardVerifyResults[0];
              if (cardVerifyResult.NormalCardInfo && cardVerifyResult.NormalCardInfo.IndonesiaIDCard) {
                ktpNumber = cardVerifyResult.NormalCardInfo.IndonesiaIDCard.LicenseNumber || 
                           cardVerifyResult.NormalCardInfo.IndonesiaIDCard.licenseNumber;
              }
            }
            
            // Check in result.NormalCardInfo.IndonesiaIDCard (fallback)
            if (!ktpNumber && result.NormalCardInfo && result.NormalCardInfo.IndonesiaIDCard) {
              ktpNumber = result.NormalCardInfo.IndonesiaIDCard.LicenseNumber || 
                         result.NormalCardInfo.IndonesiaIDCard.licenseNumber;
            }
            
            // Debug logging
            console.log('🔍 KTP Number Mapping Debug:');
            console.log('   ocrData.IndonesiaIDCard:', ocrData?.IndonesiaIDCard);
            console.log('   result.CardVerifyResults[0].NormalCardInfo.IndonesiaIDCard:', 
                       result.CardVerifyResults?.[0]?.NormalCardInfo?.IndonesiaIDCard);
            console.log('   result.NormalCardInfo.IndonesiaIDCard:', result.NormalCardInfo?.IndonesiaIDCard);
            console.log('   ✅ Final KTP Number:', ktpNumber);

            // Enhanced name mapping - check multiple possible locations
            let name = null;
            
            // Check in ocrData first
            if (ocrData) {
              name = ocrData.name || ocrData.nama || ocrData.full_name || ocrData.fullName || 
                     ocrData.nama_lengkap || ocrData.namaLengkap || ocrData.FullName;
            }
            
            // Check in result.CardVerifyResults[0].NormalCardInfo.IndonesiaIDCard
            if (!name && result.CardVerifyResults && result.CardVerifyResults.length > 0) {
              const cardVerifyResult = result.CardVerifyResults[0];
              if (cardVerifyResult.NormalCardInfo && cardVerifyResult.NormalCardInfo.IndonesiaIDCard) {
                name = cardVerifyResult.NormalCardInfo.IndonesiaIDCard.FullName;
              }
            }
            
            // Enhanced gender mapping - check multiple possible locations
            let gender = null;
            
            // Check in ocrData first
            if (ocrData) {
              gender = ocrData.gender || ocrData.jenis_kelamin || ocrData.jenisKelamin || 
                       ocrData.sex || ocrData.jk || 
                       (ocrData.Sex === 'LAKI-LAKI' ? 'L' : ocrData.Sex === 'PEREMPUAN' ? 'P' : null);
            }
            
            // Check in result.CardVerifyResults[0].NormalCardInfo.IndonesiaIDCard
            if (!gender && result.CardVerifyResults && result.CardVerifyResults.length > 0) {
              const cardVerifyResult = result.CardVerifyResults[0];
              if (cardVerifyResult.NormalCardInfo && cardVerifyResult.NormalCardInfo.IndonesiaIDCard) {
                const sexValue = cardVerifyResult.NormalCardInfo.IndonesiaIDCard.Sex;
                gender = sexValue === 'LAKI-LAKI' ? 'L' : sexValue === 'PEREMPUAN' ? 'P' : null;
              }
            }

                            // Enhanced date parsing
            const parseBirthDate = (dateStr) => {
              if (!dateStr) return null;
              
              // Handle format "MALANG, 09-03-1997"
              if (dateStr.includes(',')) {
                const parts = dateStr.split(',');
                if (parts.length >= 2) {
                  const datePart = parts[1].trim();
                  // Extract date from "09-03-1997"
                  const dateMatch = datePart.match(/(\d{2})-(\d{2})-(\d{4})/);
                  if (dateMatch) {
                    const [, day, month, year] = dateMatch;
                    return `${year}-${month}-${day}`;
                  }
                }
              }
              
              // Handle other formats
              return dateStr;
            };



    // Enhanced expiry date parsing
    const parseExpiryDate = (dateStr) => {
      if (!dateStr) return null;
      
      // Handle "SEUMUR HIDUP" (lifetime)
      if (dateStr === 'SEUMUR HIDUP' || dateStr === 'LIFETIME') {
        return null; // Set to null for lifetime
      }
      
      // Handle other date formats
      return dateStr;
    };

            // Enhanced field mapping - extract from CardVerifyResults if available
            let birthPlace = null;
            let birthDate = null;
            let address = null;
            let rtRw = null;
            let village = null;
            let district = null;
            let city = null;
            let province = null;
            let religion = null;
            let maritalStatus = null;
            let occupation = null;
            let nationality = null;
            let expiryDate = null;
            
            // Check in result.CardVerifyResults[0].NormalCardInfo.IndonesiaIDCard
            if (result.CardVerifyResults && result.CardVerifyResults.length > 0) {
              const cardVerifyResult = result.CardVerifyResults[0];
              if (cardVerifyResult.NormalCardInfo && cardVerifyResult.NormalCardInfo.IndonesiaIDCard) {
                const indonesiaCard = cardVerifyResult.NormalCardInfo.IndonesiaIDCard;
                
                // Extract birth place and date from Birthday field
                if (indonesiaCard.Birthday) {
                  const birthdayParts = indonesiaCard.Birthday.split(',');
                  if (birthdayParts.length >= 2) {
                    birthPlace = birthdayParts[0].trim();
                    birthDate = parseBirthDate(indonesiaCard.Birthday);
                  }
                }
                
                address = indonesiaCard.FormattedAddress;
                rtRw = indonesiaCard.Street;
                village = indonesiaCard.Village;
                district = indonesiaCard.Area;
                city = indonesiaCard.City;
                province = indonesiaCard.Province;
                religion = indonesiaCard.Religion;
                maritalStatus = indonesiaCard.MaritalStatus;
                occupation = indonesiaCard.Occupation;
                nationality = indonesiaCard.Nationality;
                expiryDate = parseExpiryDate(indonesiaCard.DueDate);
              }
            }
            
            // Fallback to ocrData if not found in CardVerifyResults
            if (!birthPlace) birthPlace = ocrData?.placeOfBirth || ocrData?.birth_place || ocrData?.tempat_lahir || ocrData?.tempatLahir;
            if (!birthDate) birthDate = parseBirthDate(ocrData?.dateOfBirth || ocrData?.birth_date || ocrData?.tanggal_lahir || ocrData?.tanggalLahir || ocrData?.Birthday);
            if (!address) address = ocrData?.address || ocrData?.alamat || ocrData?.alamat_lengkap || ocrData?.alamatLengkap || ocrData?.FormattedAddress;
            if (!rtRw) rtRw = ocrData?.rtRw || ocrData?.rt_rw || ocrData?.rt || ocrData?.rw;
            if (!village) village = ocrData?.village || ocrData?.desa || ocrData?.kelurahan || ocrData?.desa_kelurahan || ocrData?.desaKelurahan;
            if (!district) district = ocrData?.district || ocrData?.kecamatan || ocrData?.camat;
            if (!city) city = ocrData?.city || ocrData?.kota || ocrData?.kabupaten || ocrData?.kota_kabupaten || ocrData?.kotaKabupaten;
            if (!province) province = ocrData?.province || ocrData?.provinsi;
            if (!religion) religion = ocrData?.religion || ocrData?.agama;
            if (!maritalStatus) maritalStatus = ocrData?.maritalStatus || ocrData?.status_perkawinan || ocrData?.statusPerkawinan || ocrData?.perkawinan || ocrData?.status;
            if (!occupation) occupation = ocrData?.occupation || ocrData?.pekerjaan || ocrData?.job || ocrData?.work;
            if (!nationality) nationality = ocrData?.nationality || ocrData?.kewarganegaraan || ocrData?.warga_negara || ocrData?.wargaNegara || ocrData?.Nationality || 'WNI';
            if (!expiryDate) expiryDate = parseExpiryDate(ocrData?.expiryDate || ocrData?.berlaku_hingga || ocrData?.berlakuHingga || ocrData?.valid_until || ocrData?.validUntil || ocrData?.berlaku || ocrData?.DueDate);

            const dbData = {
              user_id: userId,
              sdk_token: SdkToken,
              request_id: result.RequestId,
              verification_status: result.Result === '0' ? 'success' : 'failed',
              ocr_data: ocrData,
              liveness_score: response.similarity ? response.similarity / 100 : null, // Convert percentage to decimal
              similarity_score: response.similarity ? response.similarity / 100 : null, // Convert percentage to decimal
              ktp_number: ktpNumber,
              name: name,
              birth_place: birthPlace,
              birth_date: birthDate,
              gender: gender,
              address: address,
              rt_rw: rtRw,
              village: village,
              district: district,
              city: city,
              province: province,
              religion: religion,
              marital_status: maritalStatus,
              occupation: occupation,
              nationality: nationality,
              expiry_date: expiryDate,
              raw_response: result,
              error_message: null
            };
            
            console.log('📝 Akan menyimpan data eKYC ke database:');
            console.log('   userId:', userId);
            console.log('   dbData:', JSON.stringify(dbData, null, 2));
            
            const saveResult = await saveEkycData(dbData);
            if (saveResult.success) {
              console.log(`✅ eKYC data saved to database with ID: ${saveResult.insertId}`);
              response.databaseId = saveResult.insertId;
            } else {
              console.log(`⚠️ Failed to save eKYC data to database: ${saveResult.error}`);
            }
          } catch (dbError) {
            console.log(`⚠️ Database save error: ${dbError.message}`);
          }
        }
        
        res.json(response);

      } catch (ocrError) {
        console.log('❌ GetSdkVerificationResult failed, trying GetFaceIdResultIntl...');
        console.log(`   Error: ${ocrError.message}`);
        
        // Fallback to GetFaceIdResultIntl
        const selfieParams = {
          SdkToken: SdkToken
        };
        
        const selfieResult = await callTencentAPI(faceidClient, 'GetFaceIdResultIntl', selfieParams);
        
        console.log('✅ GetFaceIdResultIntl SUCCESS!');
        
        const fallbackResponse = {
          success: true,
          mode: 'selfie-only',
          result: selfieResult.Result,
          description: selfieResult.Description,
          requestId: selfieResult.RequestId,
          timestamp: new Date().toISOString(),
          fallback: true,
          fallbackReason: ocrError.message
        };

        // Save data to database for fallback
        if (userId) {
          try {
            const dbData = {
              user_id: userId,
              sdk_token: SdkToken,
              request_id: selfieResult.RequestId,
              verification_status: selfieResult.Result === '0' ? 'success' : 'failed',
              ocr_data: null,
              liveness_score: selfieResult.LivenessCode === '0' ? 1.0 : 0.0,
              similarity_score: selfieResult.Similarity ? parseFloat(selfieResult.Similarity) : null,
              ktp_number: null,
              name: null,
              birth_place: null,
              birth_date: null,
              gender: null,
              address: null,
              rt_rw: null,
              village: null,
              district: null,
              city: null,
              province: null,
              religion: null,
              marital_status: null,
              occupation: null,
              nationality: null,
              expiry_date: null,
              raw_response: selfieResult,
              error_message: ocrError.message
            };
            
            const saveResult = await saveEkycData(dbData);
            if (saveResult.success) {
              console.log(`✅ eKYC fallback data saved to database with ID: ${saveResult.insertId}`);
              fallbackResponse.databaseId = saveResult.insertId;
            } else {
              console.log(`⚠️ Failed to save eKYC fallback data to database: ${saveResult.error}`);
            }
          } catch (dbError) {
            console.log(`⚠️ Database save error for fallback: ${dbError.message}`);
          }
        }

        res.json(fallbackResponse);
      }
    } else {
      // Selfie-only mode
      const params = {
        SdkToken: SdkToken
      };
      
      console.log('🔄 Calling GetFaceIdResultIntl (Selfie-only)...');
      console.log('📤 Request params:', JSON.stringify(params, null, 2));
      
      const result = await callTencentAPI(faceidClient, 'GetFaceIdResultIntl', params);
      
      console.log('✅ GetFaceIdResultIntl SUCCESS!');
      console.log('📋 Response:', JSON.stringify(result, null, 2));
      
      const selfieResponse = {
        success: true,
        mode: 'selfie-only',
        result: result.Result,
        description: result.Description,
        requestId: result.RequestId,
        timestamp: new Date().toISOString()
      };

      // Save data to database for selfie-only
      if (userId) {
        try {
          const dbData = {
            user_id: userId,
            sdk_token: SdkToken,
            request_id: result.RequestId,
            verification_status: result.Result === '0' ? 'success' : 'failed',
            ocr_data: null,
            liveness_score: result.LivenessCode === '0' ? 1.0 : 0.0,
            similarity_score: result.Similarity ? parseFloat(result.Similarity) : null,
            ktp_number: null,
            name: null,
            birth_place: null,
            birth_date: null,
            gender: null,
            address: null,
            rt_rw: null,
            village: null,
            district: null,
            city: null,
            province: null,
            religion: null,
            marital_status: null,
            occupation: null,
            nationality: null,
            expiry_date: null,
            raw_response: result,
            error_message: null
          };
          
          const saveResult = await saveEkycData(dbData);
          if (saveResult.success) {
            console.log(`✅ eKYC selfie-only data saved to database with ID: ${saveResult.insertId}`);
            selfieResponse.databaseId = saveResult.insertId;
          } else {
            console.log(`⚠️ Failed to save eKYC selfie-only data to database: ${saveResult.error}`);
          }
        } catch (dbError) {
          console.log(`⚠️ Database save error for selfie-only: ${dbError.message}`);
        }
      }

      res.json(selfieResponse);
    }

  } catch (error) {
    console.log('❌ Result check failed:');
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

// OCR KTP Indonesia endpoint (Tencent Cloud)
app.post('/api/ekyc/ocr-ktp', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Image base64 is required"
      });
    }

    console.log('🔍 Processing KTP OCR (Tencent Cloud)...');
    console.log(`📋 Image size: ${imageBase64.length} characters`);

    // Parameters untuk RecognizeIndonesiaIDCardOCR
    const params = {
      ImageBase64: imageBase64
    };

    console.log('🔄 Calling RecognizeIndonesiaIDCardOCR...');
    console.log('📤 Request params: ImageBase64 provided');

    // Call API menggunakan Promise
    const result = await callTencentAPI(ocrClient, 'RecognizeIndonesiaIDCardOCR', params);

    console.log('✅ RecognizeIndonesiaIDCardOCR SUCCESS!');
    console.log('📋 Response:', JSON.stringify(result, null, 2));

    // Parse result
    const response = {
      success: true,
      requestId: result.RequestId,
      timestamp: new Date().toISOString(),
      ocrData: {
        name: result.IdCardInfo?.Name || '',
        nik: result.IdCardInfo?.NIK || '',
        placeOfBirth: result.IdCardInfo?.PlaceOfBirth || '',
        dateOfBirth: result.IdCardInfo?.DateOfBirth || '',
        address: result.IdCardInfo?.Address || '',
        rt: result.IdCardInfo?.RT || '',
        rw: result.IdCardInfo?.RW || '',
        village: result.IdCardInfo?.Village || '',
        district: result.IdCardInfo?.District || '',
        city: result.IdCardInfo?.City || '',
        province: result.IdCardInfo?.Province || '',
        religion: result.IdCardInfo?.Religion || '',
        maritalStatus: result.IdCardInfo?.MaritalStatus || '',
        occupation: result.IdCardInfo?.Occupation || '',
        nationality: result.IdCardInfo?.Nationality || '',
        gender: result.IdCardInfo?.Gender || '',
        validUntil: result.IdCardInfo?.ValidUntil || ''
      }
    };

    res.json(response);

  } catch (error) {
    console.log('❌ RecognizeIndonesiaIDCardOCR failed:');
    console.log(`   Error Code: ${error.code}`);
    console.log(`   Error Message: ${error.message}`);
    console.log(`   Request ID: ${error.requestId}`);

    res.status(500).json({
      success: false,
      error: "Failed to process KTP OCR",
      tencentError: {
        code: error.code,
        message: error.message,
        requestId: error.requestId
      }
    });
  }
});

// OCR KTP Indonesia endpoint (Tesseract - Free Alternative)
app.post('/api/ekyc/ocr-ktp-tesseract', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Image base64 is required"
      });
    }

    console.log('🔍 Processing KTP OCR (Tesseract)...');
    console.log(`📋 Image size: ${imageBase64.length} characters`);

    // Check Tesseract availability first
    const tesseractStatus = await tesseractOCRService.checkTesseractAvailability();
    if (!tesseractStatus.available) {
      return res.status(500).json({
        success: false,
        error: "Tesseract OCR is not available on this system",
        tesseractError: tesseractStatus.error,
        installation: "Please install Tesseract OCR: sudo apt-get install tesseract-ocr tesseract-ocr-ind"
      });
    }

    // Use Tesseract OCR service
    const result = await tesseractOCRService.processKTPImage(imageBase64);

    console.log('✅ Tesseract OCR SUCCESS!');
    console.log('📋 Response:', JSON.stringify(result, null, 2));

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: "Failed to process KTP OCR with Tesseract",
        tesseractError: result.error
      });
    }

    // Parse result
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      service: 'Tesseract OCR',
      ocrData: result.ktpData,
      rawText: result.rawText
    };

    res.json(response);

  } catch (error) {
    console.log('❌ Tesseract OCR failed:');
    console.log(`   Error: ${error.message}`);

    res.status(500).json({
      success: false,
      error: "Failed to process KTP OCR with Tesseract",
      tesseractError: error.message
    });
  }
});

// Get eKYC data by user ID endpoint
app.get('/api/ekyc/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    console.log(`🔍 Getting eKYC data for user: ${userId}`);
    
    const result = await getEkycDataByUserId(userId);
    
    if (result.success) {
      console.log(`✅ eKYC data found for user: ${userId}`);
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`⚠️ No eKYC data found for user: ${userId}`);
      res.json({
        success: false,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.log('❌ Failed to get eKYC data:');
    console.log(`   Error: ${error.message}`);

    res.status(500).json({
      success: false,
      error: "Failed to get eKYC data",
      databaseError: error.message
    });
  }
});

// Check verification status endpoint
app.get('/api/ekyc/verification-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required"
      });
    }

    console.log(`🔍 Checking verification status for user: ${userId}`);

    // Get the latest eKYC record for this user (most recent first)
    const selectSQL = `
      SELECT 
        id,
        user_id,
        verification_status,
        ktp_number,
        name,
        birth_place,
        birth_date,
        gender,
        address,
        rt_rw,
        village,
        district,
        city,
        province,
        religion,
        marital_status,
        occupation,
        nationality,
        expiry_date,
        liveness_score,
        similarity_score,
        created_at,
        raw_response
      FROM lon56_ekyc_ocr_data 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;

    const { testConnection } = require('./database');
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      return res.status(500).json({
        success: false,
        error: "Database connection failed"
      });
    }

    const mysql = require('mysql2/promise');
    const dbConfig = {
      host: '145.223.22.181',
      user: 'hubunk',
      password: 'VdsAIOdoo$888$',
      database: 'hubunk',
      port: 3306
    };

    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(selectSQL, [userId]);
    await connection.end();

    if (rows.length === 0) {
      console.log(`❌ No eKYC records found for user: ${userId}`);
      return res.json({
        success: true,
        isVerified: false,
        hasRecords: false,
        message: "No eKYC verification records found",
        data: null
      });
    }

    const latestRecord = rows[0];
    console.log(`✅ Found latest eKYC record for user: ${userId}`);
    console.log(`   Record ID: ${latestRecord.id}`);
    console.log(`   Status: ${latestRecord.verification_status}`);
    console.log(`   Created: ${latestRecord.created_at}`);

    // Check if user is verified (success status and has OCR data)
    const isVerified = latestRecord.verification_status === 'success' && 
                      (latestRecord.ktp_number || latestRecord.name) ? true : false;

    const response = {
      success: true,
      isVerified: isVerified,
      hasRecords: true,
      message: isVerified ? "User is verified" : "User is not verified",
      verificationDetails: {
        id: latestRecord.id,
        verification_status: latestRecord.verification_status,
        ktp_number: latestRecord.ktp_number,
        name: latestRecord.name,
        birth_place: latestRecord.birth_place,
        birth_date: latestRecord.birth_date,
        gender: latestRecord.gender,
        address: latestRecord.address,
        rt_rw: latestRecord.rt_rw,
        village: latestRecord.village,
        district: latestRecord.district,
        city: latestRecord.city,
        province: latestRecord.province,
        religion: latestRecord.religion,
        marital_status: latestRecord.marital_status,
        occupation: latestRecord.occupation,
        nationality: latestRecord.nationality,
        expiry_date: latestRecord.expiry_date,
        liveness_score: latestRecord.liveness_score,
        similarity_score: latestRecord.similarity_score,
        created_at: latestRecord.created_at
      },
      data: {
        id: latestRecord.id,
        verification_status: latestRecord.verification_status,
        ktp_number: latestRecord.ktp_number,
        name: latestRecord.name,
        birth_place: latestRecord.birth_place,
        birth_date: latestRecord.birth_date,
        gender: latestRecord.gender,
        address: latestRecord.address,
        rt_rw: latestRecord.rt_rw,
        village: latestRecord.village,
        district: latestRecord.district,
        city: latestRecord.city,
        province: latestRecord.province,
        religion: latestRecord.religion,
        marital_status: latestRecord.marital_status,
        occupation: latestRecord.occupation,
        nationality: latestRecord.nationality,
        expiry_date: latestRecord.expiry_date,
        liveness_score: latestRecord.liveness_score,
        similarity_score: latestRecord.similarity_score,
        created_at: latestRecord.created_at
      }
    };

    console.log(`📊 Verification status response:`, response);
    res.json(response);

  } catch (error) {
    console.log(`❌ Error checking verification status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: "Failed to check verification status",
      details: error.message
    });
  }
});

// Update eKYC verification status endpoint
app.put('/api/ekyc/status/:sdkToken', async (req, res) => {
  try {
    const { sdkToken } = req.params;
    const { status, resultData } = req.body;
    
    if (!sdkToken || !status) {
      return res.status(400).json({
        success: false,
        error: "SDK Token and status are required"
      });
    }

    console.log(`🔄 Updating eKYC status for token: ${sdkToken}`);
    console.log(`📋 New status: ${status}`);
    
    const result = await updateEkycStatus(sdkToken, status, resultData || {});
    
    if (result.success) {
      console.log(`✅ eKYC status updated successfully for token: ${sdkToken}`);
      res.json({
        success: true,
        message: 'eKYC status updated successfully',
        affectedRows: result.affectedRows,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`⚠️ Failed to update eKYC status: ${result.message}`);
      res.json({
        success: false,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.log('❌ Failed to update eKYC status:');
    console.log(`   Error: ${error.message}`);

    res.status(500).json({
      success: false,
      error: "Failed to update eKYC status",
      databaseError: error.message
    });
  }
});

// Save OCR preview data endpoint
app.post('/api/ekyc/save-ocr-preview', async (req, res) => {
  try {
    const { userId, ocrData, sdkToken, requestId } = req.body;
    
    if (!userId || !ocrData) {
      return res.status(400).json({
        success: false,
        error: "userId and ocrData are required"
      });
    }

    console.log('📝 Saving OCR preview data to database:');
    console.log('   userId:', userId);
    console.log('   ocrData:', JSON.stringify(ocrData, null, 2));
    console.log('   ocrData keys:', Object.keys(ocrData));
    console.log('   ocrData.nik:', ocrData.nik);
    console.log('   ocrData.LicenseNumber:', ocrData.LicenseNumber);
    console.log('   ocrData.licenseNumber:', ocrData.licenseNumber);

    // KTP Number hanya dari IndonesiaIDCard dan NormalCardInfo.IndonesiaIDCard
    const ktpNumber = (ocrData.IndonesiaIDCard && (ocrData.IndonesiaIDCard.LicenseNumber || ocrData.IndonesiaIDCard.licenseNumber)) ||
                     (ocrData.NormalCardInfo && ocrData.NormalCardInfo.IndonesiaIDCard && (ocrData.NormalCardInfo.IndonesiaIDCard.LicenseNumber || ocrData.NormalCardInfo.IndonesiaIDCard.licenseNumber)) ||
                     null;

    // Enhanced name mapping
    const name = ocrData.name || 
                ocrData.nama || 
                ocrData.full_name || 
                ocrData.fullName || 
                ocrData.nama_lengkap || 
                ocrData.namaLengkap || 
                ocrData.FullName || 
                null;

    // Enhanced gender mapping
    const gender = ocrData.gender || 
                  ocrData.jenis_kelamin || 
                  ocrData.jenisKelamin || 
                  ocrData.sex || 
                  ocrData.jk || 
                  (ocrData.Sex === 'LAKI-LAKI' ? 'L' : ocrData.Sex === 'PEREMPUAN' ? 'P' : null) || 
                  null;

    // Enhanced date parsing
    const parseBirthDate = (dateStr) => {
      if (!dateStr) return null;
      
      // Handle format "MALANG, 09-03-1997"
      if (dateStr.includes(',')) {
        const parts = dateStr.split(',');
        if (parts.length >= 2) {
          const datePart = parts[1].trim();
          // Extract date from "09-03-1997"
          const dateMatch = datePart.match(/(\d{2})-(\d{2})-(\d{4})/);
          if (dateMatch) {
            const [, day, month, year] = dateMatch;
            return `${year}-${month}-${day}`;
          }
        }
      }
      
      // Handle other formats
      return dateStr;
    };

    // Enhanced expiry date parsing
    const parseExpiryDate = (dateStr) => {
      if (!dateStr) return null;
      
      // Handle "SEUMUR HIDUP" (lifetime)
      if (dateStr === 'SEUMUR HIDUP' || dateStr === 'LIFETIME') {
        return null; // Set to null for lifetime
      }
      
      // Handle other date formats
      return dateStr;
    };

    const dbData = {
      user_id: userId,
      sdk_token: sdkToken || 'preview_token',
      request_id: requestId || 'preview_request',
      verification_status: 'preview', // Status khusus untuk preview
      ocr_data: ocrData,
      liveness_score: null, // Belum ada liveness check
      similarity_score: null, // Belum ada similarity check
      ktp_number: ktpNumber,
      name: name,
      birth_place: ocrData.placeOfBirth || ocrData.birth_place || ocrData.tempat_lahir || ocrData.tempatLahir || null,
      birth_date: parseBirthDate(ocrData.dateOfBirth || ocrData.birth_date || ocrData.tanggal_lahir || ocrData.tanggalLahir || ocrData.Birthday),
      gender: gender,
      address: ocrData.address || ocrData.alamat || ocrData.alamat_lengkap || ocrData.alamatLengkap || ocrData.FormattedAddress || null,
      rt_rw: ocrData.rtRw || ocrData.rt_rw || ocrData.rt || ocrData.rw || null,
      village: ocrData.village || ocrData.desa || ocrData.kelurahan || ocrData.desa_kelurahan || ocrData.desaKelurahan || null,
      district: ocrData.district || ocrData.kecamatan || ocrData.camat || null,
      city: ocrData.city || ocrData.kota || ocrData.kabupaten || ocrData.kota_kabupaten || ocrData.kotaKabupaten || null,
      province: ocrData.province || ocrData.provinsi || null,
      religion: ocrData.religion || ocrData.agama || null,
      marital_status: ocrData.maritalStatus || ocrData.status_perkawinan || ocrData.statusPerkawinan || ocrData.perkawinan || ocrData.status || null,
      occupation: ocrData.occupation || ocrData.pekerjaan || ocrData.job || ocrData.work || null,
      nationality: ocrData.nationality || ocrData.kewarganegaraan || ocrData.warga_negara || ocrData.wargaNegara || ocrData.Nationality || 'WNI',
      expiry_date: parseExpiryDate(ocrData.expiryDate || ocrData.berlaku_hingga || ocrData.berlakuHingga || ocrData.valid_until || ocrData.validUntil || ocrData.berlaku || ocrData.DueDate),
      raw_response: JSON.stringify(ocrData),
      error_message: null,
      created_at: new Date()
    };

    console.log('📋 Database data to be saved:');
    console.log('   ktp_number:', dbData.ktp_number);
    console.log('   name:', dbData.name);
    console.log('   birth_place:', dbData.birth_place);
    console.log('   birth_date:', dbData.birth_date);
    console.log('   gender:', dbData.gender);
    console.log('   address:', dbData.address);

    const saveResult = await saveEkycData(dbData);
    
    if (saveResult.success) {
      console.log(`✅ OCR preview data saved to database with ID: ${saveResult.insertId}`);
      res.json({
        success: true,
        message: 'OCR preview data saved successfully',
        databaseId: saveResult.insertId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log(`⚠️ Failed to save OCR preview data: ${saveResult.error}`);
      res.status(500).json({
        success: false,
        error: saveResult.error
      });
    }
  } catch (error) {
    console.log(`❌ Error saving OCR preview data: ${error.message}`);
    res.status(500).json({
      success: false,
      error: error.message
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
  console.log(`👤 Get user data: GET http://localhost:${PORT}/api/ekyc/user/:userId`);
  console.log(`✅ Check verification: GET http://localhost:${PORT}/api/ekyc/verification-status/:userId`);
  console.log(`🔄 Update status: PUT http://localhost:${PORT}/api/ekyc/status/:sdkToken`);
  console.log(`📝 Save OCR preview: POST http://localhost:${PORT}/api/ekyc/save-ocr-preview`);
});

module.exports = app;