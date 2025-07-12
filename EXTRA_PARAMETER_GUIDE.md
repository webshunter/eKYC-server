# Extra Parameter Guide for Tencent FaceID

## Overview
Parameter `Extra` dalam Tencent FaceID API digunakan untuk menyimpan data tambahan yang akan dikembalikan dalam hasil verifikasi. Ini sangat berguna untuk tracking user dan identifikasi.

## Cara Penggunaan

### 1. Melalui Query Parameter
```bash
# Generate token dengan userId
curl "http://localhost:8071/api/ekyc/token?userId=12345"

# Atau dengan user_id
curl "http://localhost:8071/api/ekyc/token?user_id=67890"
```

### 2. Format Extra Parameter
Server akan otomatis membuat format Extra seperti ini:
```
user_{userId}_{timestamp}
```

Contoh:
- `user_12345_1703123456789`
- `user_67890_1703123456790`

### 3. Response yang Dikembalikan
```json
{
  "success": true,
  "token": "sdk_token_here",
  "method": "GetFaceIdTokenIntl",
  "sdkVersion": "international",
  "userId": "12345",
  "extra": "user_12345_1703123456789",
  "timestamp": "2023-12-21T10:30:56.789Z"
}
```

## Manfaat Extra Parameter

### 1. User Tracking
- Identifikasi user yang melakukan verifikasi
- Tracking multiple verifikasi dari user yang sama
- Audit trail untuk compliance

### 2. Database Integration
```javascript
// Contoh penggunaan di database
const verificationRecord = {
  userId: "12345",
  sdkToken: "token_from_response",
  extra: "user_12345_1703123456789",
  timestamp: new Date(),
  status: "pending"
};
```

### 3. Result Retrieval
Ketika mengambil hasil verifikasi, Extra parameter akan dikembalikan:
```json
{
  "success": true,
  "result": {
    "SdkToken": "token_here",
    "Extra": "user_12345_1703123456789",
    "Result": "PASS",
    "Description": "Verification successful"
  }
}
```

## Contoh Implementasi di Flutter

### 1. Generate Token dengan User ID
```dart
Future<String?> generateEkycToken(String userId) async {
  try {
    final response = await http.get(
      Uri.parse('http://localhost:8071/api/ekyc/token?userId=$userId'),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success']) {
        print('User ID: ${data['userId']}');
        print('Extra: ${data['extra']}');
        return data['token'];
      }
    }
  } catch (e) {
    print('Error: $e');
  }
  return null;
}
```

### 2. Simpan ke Database
```dart
Future<void> saveVerificationRecord(String userId, String token, String extra) async {
  final record = {
    'userId': userId,
    'sdkToken': token,
    'extra': extra,
    'timestamp': DateTime.now().toIso8601String(),
    'status': 'pending'
  };
  
  // Simpan ke database lokal atau remote
  await database.insert('verifications', record);
}
```

### 3. Ambil Hasil Verifikasi
```dart
Future<Map<String, dynamic>?> getVerificationResult(String sdkToken) async {
  try {
    final response = await http.post(
      Uri.parse('http://localhost:8071/api/ekyc/result'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'SdkToken': sdkToken}),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success']) {
        final extra = data['result']['Extra'];
        final userId = extra.split('_')[1]; // Extract userId from extra
        
        // Update database dengan hasil
        await updateVerificationStatus(userId, data['result']['Result']);
        
        return data['result'];
      }
    }
  } catch (e) {
    print('Error: $e');
  }
  return null;
}
```

## Best Practices

### 1. User ID Format
- Gunakan format yang konsisten (numeric, UUID, dll)
- Hindari karakter khusus yang bisa menyebabkan masalah
- Panjang maksimal 50 karakter

### 2. Error Handling
```dart
// Handle kasus ketika userId tidak disediakan
String userId = user?.id ?? 'anonymous_${DateTime.now().millisecondsSinceEpoch}';
```

### 3. Logging dan Monitoring
```dart
// Log setiap request untuk tracking
print('eKYC Request - User: $userId, Time: ${DateTime.now()}');
```

### 4. Security
- Jangan simpan informasi sensitif di Extra parameter
- Gunakan hanya untuk tracking dan identifikasi
- Enkripsi userId jika diperlukan

## Testing

### Test dengan User ID Berbeda
```bash
# Test user 1
curl "http://localhost:8071/api/ekyc/token?userId=user001"

# Test user 2
curl "http://localhost:8071/api/ekyc/token?userId=user002"

# Test tanpa user ID (akan menggunakan default)
curl "http://localhost:8071/api/ekyc/token"
```

### Verifikasi Extra Parameter
```bash
# Ambil hasil verifikasi
curl -X POST "http://localhost:8071/api/ekyc/result" \
  -H "Content-Type: application/json" \
  -d '{"SdkToken": "token_from_previous_request"}'
```

## Kesimpulan
Parameter `Extra` sangat berguna untuk:
1. **User Tracking**: Identifikasi user yang melakukan verifikasi
2. **Audit Trail**: Mencatat semua aktivitas verifikasi
3. **Database Integration**: Menghubungkan token dengan user
4. **Compliance**: Memenuhi persyaratan audit dan compliance

Dengan implementasi ini, Anda bisa melacak setiap verifikasi eKYC dengan mudah dan mengintegrasikannya dengan sistem database Anda. 