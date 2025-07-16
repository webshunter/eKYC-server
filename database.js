const mysql = require('mysql2/promise');

// Database configuration
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

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful!');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   Prefix: ${dbConfig.prefix}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Create eKYC OCR data table if not exists
async function createEkycTable() {
  try {
    const connection = await pool.getConnection();
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`${dbConfig.prefix}ekyc_ocr_data\` (
        \`id\` int(11) NOT NULL AUTO_INCREMENT,
        \`user_id\` varchar(50) NOT NULL COMMENT 'User ID dari aplikasi',
        \`sdk_token\` varchar(255) NOT NULL COMMENT 'SDK Token dari Tencent Cloud',
        \`request_id\` varchar(255) DEFAULT NULL COMMENT 'Request ID dari Tencent Cloud',
        \`verification_status\` enum('pending','success','failed') DEFAULT 'pending' COMMENT 'Status verifikasi',
        \`ocr_data\` text COMMENT 'Data OCR dalam format JSON',
        \`liveness_score\` decimal(5,4) DEFAULT NULL COMMENT 'Skor liveness detection (0.0000-1.0000)',
        \`similarity_score\` decimal(5,4) DEFAULT NULL COMMENT 'Skor similarity (0.0000-1.0000)',
        \`ktp_number\` varchar(50) DEFAULT NULL COMMENT 'Nomor KTP',
        \`name\` varchar(255) DEFAULT NULL COMMENT 'Nama lengkap',
        \`birth_place\` varchar(100) DEFAULT NULL COMMENT 'Tempat lahir',
        \`birth_date\` date DEFAULT NULL COMMENT 'Tanggal lahir',
        \`gender\` enum('L','P') DEFAULT NULL COMMENT 'Jenis kelamin',
        \`address\` text DEFAULT NULL COMMENT 'Alamat lengkap',
        \`rt_rw\` varchar(10) DEFAULT NULL COMMENT 'RT/RW',
        \`village\` varchar(100) DEFAULT NULL COMMENT 'Desa/Kelurahan',
        \`district\` varchar(100) DEFAULT NULL COMMENT 'Kecamatan',
        \`city\` varchar(100) DEFAULT NULL COMMENT 'Kota/Kabupaten',
        \`province\` varchar(100) DEFAULT NULL COMMENT 'Provinsi',
        \`religion\` varchar(50) DEFAULT NULL COMMENT 'Agama',
        \`marital_status\` varchar(50) DEFAULT NULL COMMENT 'Status perkawinan',
        \`occupation\` varchar(100) DEFAULT NULL COMMENT 'Pekerjaan',
        \`nationality\` varchar(50) DEFAULT 'WNI' COMMENT 'Kewarganegaraan',
        \`expiry_date\` date DEFAULT NULL COMMENT 'Tanggal berlaku',
        \`raw_response\` text COMMENT 'Response mentah dari Tencent Cloud',
        \`error_message\` text COMMENT 'Pesan error jika ada',
        \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu pembuatan record',
        \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Waktu update terakhir',
        PRIMARY KEY (\`id\`),
        KEY \`idx_user_id\` (\`user_id\`),
        KEY \`idx_sdk_token\` (\`sdk_token\`),
        KEY \`idx_verification_status\` (\`verification_status\`),
        KEY \`idx_created_at\` (\`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tabel untuk menyimpan data eKYC OCR dari Tencent Cloud';
    `;
    
    await connection.execute(createTableSQL);
    console.log('✅ eKYC OCR data table created/verified successfully!');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Failed to create eKYC table:', error.message);
    return false;
  }
}

// Save eKYC OCR data
async function saveEkycData(data) {
  try {
    const connection = await pool.getConnection();
    
    const insertSQL = `
      INSERT INTO \`${dbConfig.prefix}ekyc_ocr_data\` (
        user_id, sdk_token, request_id, verification_status, ocr_data,
        liveness_score, similarity_score, ktp_number, name, birth_place,
        birth_date, gender, address, rt_rw, village, district, city,
        province, religion, marital_status, occupation, nationality,
        expiry_date, raw_response, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.user_id,
      data.sdk_token,
      data.request_id,
      data.verification_status,
      data.ocr_data ? JSON.stringify(data.ocr_data) : null,
      data.liveness_score,
      data.similarity_score,
      data.ktp_number,
      data.name,
      data.birth_place,
      data.birth_date,
      data.gender,
      data.address,
      data.rt_rw,
      data.village,
      data.district,
      data.city,
      data.province,
      data.religion,
      data.marital_status,
      data.occupation,
      data.nationality,
      data.expiry_date,
      data.raw_response ? JSON.stringify(data.raw_response) : null,
      data.error_message
    ];
    
    const [result] = await connection.execute(insertSQL, values);
    console.log(`✅ eKYC data saved with ID: ${result.insertId}`);
    
    connection.release();
    return {
      success: true,
      insertId: result.insertId
    };
  } catch (error) {
    console.error('❌ Failed to save eKYC data:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Get eKYC data by user ID
async function getEkycDataByUserId(userId) {
  try {
    const connection = await pool.getConnection();
    
    const selectSQL = `
      SELECT * FROM \`${dbConfig.prefix}ekyc_ocr_data\`
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const [rows] = await connection.execute(selectSQL, [userId]);
    
    connection.release();
    
    if (rows.length > 0) {
      const row = rows[0];
      // Parse JSON fields
      if (row.ocr_data) {
        row.ocr_data = JSON.parse(row.ocr_data);
      }
      if (row.raw_response) {
        row.raw_response = JSON.parse(row.raw_response);
      }
      return {
        success: true,
        data: row
      };
    } else {
      return {
        success: false,
        message: 'No eKYC data found for this user'
      };
    }
  } catch (error) {
    console.error('❌ Failed to get eKYC data:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Update eKYC verification status
async function updateEkycStatus(sdkToken, status, resultData) {
  try {
    const connection = await pool.getConnection();
    
    const updateSQL = `
      UPDATE \`${dbConfig.prefix}ekyc_ocr_data\`
      SET verification_status = ?, 
          liveness_score = ?,
          similarity_score = ?,
          raw_response = ?,
          error_message = ?
      WHERE sdk_token = ?
    `;
    
    const values = [
      status,
      resultData.liveness_score || null,
      resultData.similarity_score || null,
      resultData.raw_response ? JSON.stringify(resultData.raw_response) : null,
      resultData.error_message || null,
      sdkToken
    ];
    
    const [result] = await connection.execute(updateSQL, values);
    
    connection.release();
    
    if (result.affectedRows > 0) {
      console.log(`✅ eKYC status updated for token: ${sdkToken}`);
      return {
        success: true,
        affectedRows: result.affectedRows
      };
    } else {
      return {
        success: false,
        message: 'No record found with this SDK token'
      };
    }
  } catch (error) {
    console.error('❌ Failed to update eKYC status:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  pool,
  testConnection,
  createEkycTable,
  saveEkycData,
  getEkycDataByUserId,
  updateEkycStatus
}; 