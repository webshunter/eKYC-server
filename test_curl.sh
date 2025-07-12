#!/bin/bash

BASE_URL="http://localhost:8071"

echo "🧪 Testing eKYC Backend Endpoints with curl..."
echo "================================================"

# Test 1: Health Check
echo ""
echo "1️⃣ Testing Health Check..."
curl -s "${BASE_URL}/health" | jq '.'

# Test 2: Debug Environment Variables
echo ""
echo "2️⃣ Testing Debug Environment Variables..."
curl -s "${BASE_URL}/debug/env" | jq '.'

# Test 3: Service Status
echo ""
echo "3️⃣ Testing Service Status..."
curl -s "${BASE_URL}/api/ekyc/status" | jq '.'

# Test 4: Generate Token
echo ""
echo "4️⃣ Testing Token Generation..."
TOKEN_RESPONSE=$(curl -s "${BASE_URL}/api/ekyc/token")
echo "$TOKEN_RESPONSE" | jq '.'

# Extract token if successful
TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token // empty')

if [ ! -z "$TOKEN" ]; then
    echo ""
    echo "5️⃣ Testing Get Result with token: $TOKEN"
    curl -s -X POST "${BASE_URL}/api/ekyc/result" \
        -H "Content-Type: application/json" \
        -d "{\"SdkToken\": \"$TOKEN\"}" | jq '.'
else
    echo ""
    echo "❌ No token generated, skipping result test"
fi

echo ""
echo "================================================"
echo "✅ Testing completed!" 