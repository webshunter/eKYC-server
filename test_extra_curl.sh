#!/bin/bash

echo "🧪 Testing Extra Parameter with cURL Commands"
echo "=============================================="

BASE_URL="http://localhost:8071"

# Test 1: Generate token with specific user ID
echo -e "\n1️⃣  Testing with User ID: user123"
echo "Request: GET $BASE_URL/api/ekyc/token?userId=user123"
curl -s "$BASE_URL/api/ekyc/token?userId=user123" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/ekyc/token?userId=user123"

# Test 2: Generate token with numeric user ID
echo -e "\n\n2️⃣  Testing with Numeric User ID: 45678"
echo "Request: GET $BASE_URL/api/ekyc/token?userId=45678"
curl -s "$BASE_URL/api/ekyc/token?userId=45678" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/ekyc/token?userId=45678"

# Test 3: Generate token without user ID (should use default)
echo -e "\n\n3️⃣  Testing without User ID (default)"
echo "Request: GET $BASE_URL/api/ekyc/token"
curl -s "$BASE_URL/api/ekyc/token" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/ekyc/token"

# Test 4: Generate token with user_id parameter (alternative)
echo -e "\n\n4️⃣  Testing with user_id parameter: admin001"
echo "Request: GET $BASE_URL/api/ekyc/token?user_id=admin001"
curl -s "$BASE_URL/api/ekyc/token?user_id=admin001" | jq '.' 2>/dev/null || curl -s "$BASE_URL/api/ekyc/token?user_id=admin001"

echo -e "\n\n📋 Expected Extra Parameter Format:"
echo "   user_{userId}_{timestamp}"
echo ""
echo "📊 Example Extra values:"
echo "   user_user123_1703123456789"
echo "   user_45678_1703123456790"
echo "   user_default_user_1703123456791"
echo "   user_admin001_1703123456792"

echo -e "\n\n🔍 To test result retrieval (after getting a valid token):"
echo "curl -X POST \"$BASE_URL/api/ekyc/result\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"SdkToken\": \"your_token_here\"}'"

echo -e "\n\n💡 Note: If you see 'UnsupportedRegion' errors,"
echo "   it means FaceID service needs to be activated in Tencent Cloud Console"
echo "   for the region: ap-singapore" 