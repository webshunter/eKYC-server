# Tencent Cloud SDK Implementation Guide (International Version)

## Overview
This guide explains how to properly use the Tencent Cloud International SDK for FaceID eKYC token generation.

## Installation
```bash
npm install tencentcloud-sdk-nodejs-intl-en
```

## Configuration

### 1. Environment Variables
Create a `.env` file in the backend directory with the following variables:

```env
# Tencent Cloud Configuration (International SDK)
TENCENT_SECRET_ID=your_secret_id_here
TENCENT_SECRET_KEY=your_secret_key_here
TENCENT_REGION=ap-singapore
TENCENT_APP_ID=your_app_id_here

# FaceID Configuration
TENCENT_SECURE_LEVEL=4
TENCENT_ID_CARD_TYPE=IDCARD
TENCENT_REDIRECT_URL=https://your-app.com/callback

# Server Configuration
PORT=8071
```

### 2. Valid Regions
Tencent Cloud International supports the following regions for FaceID:
- `ap-singapore` (Singapore) - **RECOMMENDED**
- `ap-hongkong` (Hong Kong)
- `ap-seoul` (Seoul)
- `ap-tokyo` (Tokyo)
- `ap-bangkok` (Bangkok)
- `na-siliconvalley` (Silicon Valley)
- `na-ashburn` (Virginia)
- `eu-frankfurt` (Frankfurt)

## API Usage

### Method 1: GetFaceIdTokenIntl (RECOMMENDED)
The `GetFaceIdTokenIntl` method is used to generate a token for FaceID verification.

#### Required Parameters:
- `SecureLevel`: Security level (string) - "1", "2", "3", or "4"

#### Optional Parameters:
- `IdCard`: ID card number (string)
- `Name`: User's name (string)
- `RedirectUrl`: Redirect URL after verification (string)
- `Extra`: Additional parameters (string)

#### Example Usage:
```javascript
const params = {
  SecureLevel: "4",
  // Optional parameters
  // IdCard: "123456789012345678",
  // Name: "John Doe",
  // RedirectUrl: "https://your-app.com/callback",
  // Extra: "additional_data"
};

const result = await client.GetFaceIdTokenIntl(params);
```

### Method 2: ApplySdkVerificationToken
The `ApplySdkVerificationToken` method is an alternative for SDK verification.

#### Required Parameters:
- `IdCardType`: ID card type (string) - "IDCARD", "PASSPORT", etc.
- `NeedVerifyIdCard`: Whether to verify ID card (boolean)

#### Example Usage:
```javascript
const params = {
  IdCardType: "IDCARD",
  NeedVerifyIdCard: false,
  // Optional parameters
  // RedirectUrl: "https://your-app.com/callback",
  // Extra: "additional_data"
};

const result = await client.ApplySdkVerificationToken(params);
```

### Method 3: ApplyWebVerificationBizTokenIntl
The `ApplyWebVerificationBizTokenIntl` method is for web-based verification.

#### Required Parameters:
- `RedirectURL`: Redirect URL after verification (string)
- `Config`: Configuration object
  - `CheckMode`: Liveness detection mode (number) - 1 for liveness detection
  - `IDCardType`: ID card type (string)

#### Example Usage:
```javascript
const params = {
  RedirectURL: "https://your-app.com/callback",
  Config: {
    CheckMode: 1,
    IDCardType: "IDCARD"
  }
};

const result = await client.ApplyWebVerificationBizTokenIntl(params);
```

## Error Handling

### Common Error Codes:
- `AuthFailure`: Authentication failed (check SecretId/SecretKey)
- `InvalidParameter`: Invalid parameter values
- `UnauthorizedOperation.Nonactivated`: Service not activated
- `ServiceUnavailable`: Service temporarily unavailable

### Error Response Format:
```javascript
{
  code: "AuthFailure",
  message: "Authentication failed",
  requestId: "request_id_here"
}
```

## Testing the Server

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Health Check
```bash
curl http://localhost:8071/health
```

### 3. Status Check
```bash
curl http://localhost:8071/api/ekyc/status
```

### 4. Generate Token
```bash
curl http://localhost:8071/api/ekyc/token
```

## Flutter Integration

### API Endpoint
```dart
const String baseUrl = 'http://localhost:8071';
const String tokenEndpoint = '$baseUrl/api/ekyc/token';

// Make HTTP request to generate token
final response = await http.get(Uri.parse(tokenEndpoint));
final data = json.decode(response.body);

if (data['success']) {
  final token = data['token'];
  final method = data['method'];
  final sdkVersion = data['sdkVersion'];
  // Use token for FaceID verification
} else {
  // Handle error
  print('Error: ${data['error']}');
}
```

## Troubleshooting

### 1. Authentication Issues
- Verify your SecretId and SecretKey are correct
- Ensure your Tencent Cloud account has FaceID service activated
- Check if your account has sufficient credits

### 2. SDK Version Issues
- **IMPORTANT**: Use `tencentcloud-sdk-nodejs-intl-en` for international services
- Do NOT use `tencentcloud-sdk-nodejs` (China version) for international services

### 3. Region Issues
- Use a valid region from the list above
- Ensure the region supports FaceID service
- Singapore (`ap-singapore`) is recommended for Southeast Asia

### 4. Service Activation
- Activate FaceID service in Tencent Cloud Console
- Ensure you have sufficient credits in your account
- Check service status in the console

## Security Best Practices

1. **Never commit credentials**: Keep your `.env` file in `.gitignore`
2. **Use environment variables**: Don't hardcode credentials in code
3. **Validate inputs**: Always validate parameters before sending to API
4. **Handle errors gracefully**: Implement proper error handling
5. **Log securely**: Don't log sensitive information

## Additional Resources

- [Tencent Cloud International SDK](https://github.com/TencentCloud/tencentcloud-sdk-nodejs-intl-en)
- [FaceID API Documentation](https://www.tencentcloud.com/document/product/1061)
- [Tencent Cloud Console](https://console.tencentcloud.com/) 