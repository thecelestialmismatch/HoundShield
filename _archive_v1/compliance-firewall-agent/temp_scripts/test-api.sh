#!/bin/bash
# Test script for Compliance Firewall Agent
# Run: bash test-api.sh

BASE="http://localhost:3000"
API_KEY="test-key-123"

echo "============================================"
echo "TEST 1: Safe prompt (should be ALLOWED)"
echo "============================================"
curl -s -X POST "$BASE/api/gateway/intercept" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "x-user-id: test-user" \
  -H "x-destination-url: https://api.openai.com/v1/chat/completions" \
  -d '{
    "messages": [
      {"role": "user", "content": "What is the capital of France?"}
    ]
  }' | python3 -m json.tool
echo ""

echo "============================================"
echo "TEST 2: Prompt with SSN (should be BLOCKED)"
echo "============================================"
curl -s -X POST "$BASE/api/gateway/intercept" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "x-user-id: test-user" \
  -H "x-destination-url: https://api.openai.com/v1/chat/completions" \
  -d '{
    "messages": [
      {"role": "user", "content": "Summarize this employee record: John Smith, SSN 123-45-6789, salary $150,000"}
    ]
  }' | python3 -m json.tool
echo ""

echo "============================================"
echo "TEST 3: Prompt with email (should be QUARANTINED)"
echo "============================================"
curl -s -X POST "$BASE/api/gateway/intercept" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "x-user-id: test-user" \
  -H "x-destination-url: https://api.anthropic.com/v1/messages" \
  -d '{
    "messages": [
      {"role": "user", "content": "Draft an email to john.doe@company.com about the meeting"}
    ]
  }' | python3 -m json.tool
echo ""

echo "============================================"
echo "TEST 4: Prompt with API key (should be BLOCKED)"
echo "============================================"
curl -s -X POST "$BASE/api/gateway/intercept" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "x-user-id: test-user" \
  -H "x-destination-url: https://api.openai.com/v1/chat/completions" \
  -d '{
    "messages": [
      {"role": "user", "content": "Debug this code: api_key = sk-1234567890abcdefghijklmnop"}
    ]
  }' | python3 -m json.tool
echo ""

echo "============================================"
echo "TEST 5: M&A strategic data (should be BLOCKED)"
echo "============================================"
curl -s -X POST "$BASE/api/gateway/intercept" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "x-user-id: cfo-user" \
  -H "x-destination-url: https://api.openai.com/v1/chat/completions" \
  -d '{
    "messages": [
      {"role": "user", "content": "Help me draft a letter of intent for the acquisition of TechCorp. Our due diligence found revenue = $5M ARR"}
    ]
  }' | python3 -m json.tool
echo ""

echo "============================================"
echo "TEST 6: Fetch compliance events"
echo "============================================"
curl -s "$BASE/api/compliance/events?limit=5" | python3 -m json.tool
echo ""

echo "============================================"
echo "TEST 7: Fetch quarantine queue"
echo "============================================"
curl -s "$BASE/api/quarantine/review" | python3 -m json.tool
echo ""

echo "============================================"
echo "ALL TESTS COMPLETE"
echo "============================================"
echo "Now open http://localhost:3000/dashboard to see results"
