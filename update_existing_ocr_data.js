const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration - using same config as database.js
const dbConfig = {
  host: '145.223.22.181',
  user: 'hubunk',
  password: 'VdsAIOdoo$888$',
  database: 'hubunk',
  port: 3306,
  charset: 'utf8mb4',
  collation: 'utf8mb4_unicode_ci',
  prefix: 'lon56_',
  // Connection pool settings
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

async function updateExistingOcrData() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Prefix: ${dbConfig.prefix}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully!');
    
    // Get all records with raw_response but null OCR fields
    const selectSQL = `
      SELECT id, raw_response, ktp_number, name, birth_place, birth_date, gender, address, rt_rw, village, district, city, province, religion, marital_status, occupation, nationality, expiry_date, liveness_score, similarity_score
      FROM \`${dbConfig.prefix}ekyc_ocr_data\`
      WHERE raw_response IS NOT NULL 
      AND (ktp_number IS NULL OR name IS NULL)
      ORDER BY created_at DESC
    `;
    
    const [rows] = await connection.execute(selectSQL);
    console.log(`📋 Found ${rows.length} records to update`);
    
    if (rows.length === 0) {
      console.log('✅ No records need updating');
      return;
    }
    
    let updatedCount = 0;
    
    for (const row of rows) {
      try {
        const rawResponse = typeof row.raw_response === 'string' 
          ? JSON.parse(row.raw_response) 
          : row.raw_response;
        
        // Extract OCR data from CardVerifyResults
        let ocrData = null;
        if (rawResponse.CardVerifyResults && rawResponse.CardVerifyResults.length > 0) {
          const cardResult = rawResponse.CardVerifyResults[0];
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
                  birthDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
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
              ktp_number: indonesiaCard.NIK || null,
              name: indonesiaCard.FullName || null,
              birth_place: indonesiaCard.Birthday ? indonesiaCard.Birthday.split(',')[0] : null,
              birth_date: birthDate,
              gender: gender,
              address: indonesiaCard.Address || null,
              rt_rw: indonesiaCard.RTRW || null,
              village: indonesiaCard.Village || null,
              district: indonesiaCard.District || null,
              city: indonesiaCard.City || null,
              province: indonesiaCard.Province || null,
              religion: indonesiaCard.Religion || null,
              marital_status: indonesiaCard.MaritalStatus || null,
              occupation: indonesiaCard.Occupation || null,
              nationality: indonesiaCard.Nationality || null,
              expiry_date: expiryDate
            };
          }
        }
        
        // Extract liveness data from CompareResults
        let livenessScore = null;
        let similarityScore = null;
        if (rawResponse.CompareResults && rawResponse.CompareResults.length > 0) {
          const compareResult = rawResponse.CompareResults[0];
          if (compareResult.Sim !== undefined) {
            similarityScore = compareResult.Sim / 100; // Convert percentage to decimal
            livenessScore = compareResult.Sim / 100; // Convert percentage to decimal
          }
        }
        
        // Update the record
        if (ocrData) {
          const updateSQL = `
            UPDATE \`${dbConfig.prefix}ekyc_ocr_data\`
            SET 
              ocr_data = ?,
              ktp_number = ?,
              name = ?,
              birth_place = ?,
              birth_date = ?,
              gender = ?,
              address = ?,
              rt_rw = ?,
              village = ?,
              district = ?,
              city = ?,
              province = ?,
              religion = ?,
              marital_status = ?,
              occupation = ?,
              nationality = ?,
              expiry_date = ?,
              liveness_score = ?,
              similarity_score = ?
            WHERE id = ?
          `;
          
          const values = [
            JSON.stringify(ocrData),
            ocrData.ktp_number,
            ocrData.name,
            ocrData.birth_place,
            ocrData.birth_date,
            ocrData.gender,
            ocrData.address,
            ocrData.rt_rw,
            ocrData.village,
            ocrData.district,
            ocrData.city,
            ocrData.province,
            ocrData.religion,
            ocrData.marital_status,
            ocrData.occupation,
            ocrData.nationality,
            ocrData.expiry_date,
            livenessScore,
            similarityScore,
            row.id
          ];
          
          await connection.execute(updateSQL, values);
          updatedCount++;
          
          console.log(`✅ Updated record ID ${row.id}:`);
          console.log(`   NIK: ${ocrData.ktp_number}`);
          console.log(`   Name: ${ocrData.name}`);
          console.log(`   Address: ${ocrData.address}`);
          console.log(`   Liveness Score: ${livenessScore}`);
        } else {
          console.log(`⚠️ No OCR data found for record ID ${row.id}`);
        }
        
      } catch (error) {
        console.log(`❌ Error updating record ID ${row.id}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Update completed!`);
    console.log(`📊 Total records processed: ${rows.length}`);
    console.log(`✅ Successfully updated: ${updatedCount}`);
    console.log(`❌ Failed to update: ${rows.length - updatedCount}`);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the update
updateExistingOcrData().then(() => {
  console.log('🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 