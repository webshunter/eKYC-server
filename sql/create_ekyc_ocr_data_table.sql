-- Tabel untuk menyimpan data hasil OCR eKYC KTP Indonesia
CREATE TABLE IF NOT EXISTS ekyc_ocr_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,           -- ID user yang diverifikasi
    verification_id VARCHAR(128),           -- ID unik proses verifikasi (SdkToken/RequestId)
    name VARCHAR(128),
    nik VARCHAR(32),
    place_of_birth VARCHAR(64),
    date_of_birth DATE,
    address TEXT,
    rt VARCHAR(8),
    rw VARCHAR(8),
    village VARCHAR(64),
    district VARCHAR(64),
    city VARCHAR(64),
    province VARCHAR(64),
    religion VARCHAR(32),
    marital_status VARCHAR(32),
    occupation VARCHAR(64),
    nationality VARCHAR(32),
    gender VARCHAR(16),
    valid_until VARCHAR(32),
    selfie_similarity FLOAT,                -- Nilai similarity selfie vs KTP
    liveness_code VARCHAR(16),              -- Kode liveness dari Tencent
    compare_code VARCHAR(16),               -- Kode compare dari Tencent
    raw_ocr_json JSON,                      -- Simpan raw JSON OCR (opsional)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX(user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4; 