# Region Update: ap-jakarta

## 📍 Perubahan Region

Backend telah diupdate untuk menggunakan region **`ap-jakarta`** sebagai default region untuk Tencent Cloud FaceID API.

## 🔧 Konfigurasi yang Diupdate

### 1. Environment Variables (`env.example`)
```bash
# Sebelum
TENCENT_REGION=ap-singapore

# Sesudah
TENCENT_REGION=ap-jakarta
```

### 2. Server Configuration (`server.js`)
- Default region diubah dari `ap-singapore` ke `ap-jakarta`
- Semua endpoint dan logging menggunakan region baru

## 🌏 Region yang Didukung

### Tencent Cloud FaceID International SDK
- ✅ `ap-jakarta` - Asia Pacific (Jakarta)
- ✅ `ap-singapore` - Asia Pacific (Singapore)
- ✅ `ap-hongkong` - Asia Pacific (Hong Kong)
- ✅ `ap-tokyo` - Asia Pacific (Tokyo)
- ✅ `ap-seoul` - Asia Pacific (Seoul)
- ✅ `ap-mumbai` - Asia Pacific (Mumbai)
- ✅ `ap-bangkok` - Asia Pacific (Bangkok)

## 🚀 Cara Menggunakan

### 1. Setup Environment Variables
```bash
# Copy env.example ke .env
cp env.example .env

# Edit .env dengan credentials Anda
TENCENT_SECRET_ID=your_secret_id_here
TENCENT_SECRET_KEY=your_secret_key_here
TENCENT_REGION=ap-jakarta
TENCENT_APP_ID=your_app_id_here
```

### 2. Aktifkan FaceID Service
1. Login ke [Tencent Cloud Console](https://console.cloud.tencent.com/)
2. Pilih region **`ap-jakarta`**
3. Aktifkan FaceID service di region tersebut
4. Pastikan App ID sudah terdaftar

### 3. Test API
```bash
# Test token generation
curl "http://localhost:8071/api/ekyc/token?userId=test123"

# Check server status
curl "http://localhost:8071/api/ekyc/status"

# Debug environment
curl "http://localhost:8071/debug/env"
```

## ⚠️ Catatan Penting

1. **Service Activation**: FaceID service harus diaktifkan di region `ap-jakarta` di Tencent Cloud Console
2. **App ID**: Pastikan App ID sudah terdaftar di region yang benar
3. **Latency**: Region `ap-jakarta` memberikan latency yang lebih rendah untuk pengguna di Indonesia
4. **Compliance**: Sesuai dengan regulasi data lokal Indonesia

## 🔍 Troubleshooting

### Error: "UnsupportedRegion"
Jika masih mendapat error "UnsupportedRegion":
1. Pastikan FaceID service sudah diaktifkan di region `ap-jakarta`
2. Cek App ID sudah terdaftar di region yang benar
3. Verifikasi credentials (Secret ID & Secret Key) valid

### Error: "ServiceNotActivated"
Jika mendapat error "ServiceNotActivated":
1. Login ke Tencent Cloud Console
2. Pilih region `ap-jakarta`
3. Aktifkan FaceID service
4. Tunggu beberapa menit untuk aktivasi selesai

## 📊 Monitoring

Setelah update region, monitor:
- Response time API
- Success rate token generation
- Error rate dan jenis error
- Latency untuk pengguna Indonesia

## 🔄 Rollback

Jika perlu kembali ke region sebelumnya:
```bash
# Edit .env
TENCENT_REGION=ap-singapore

# Restart server
npm start
``` 