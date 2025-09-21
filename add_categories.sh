#!/bin/bash

# Get fresh token
TOKEN=$(curl -s -X POST https://swp-backend-x36i.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "mscoffee@123"}' | \
  jq -r '.token')

echo "Token obtained: ${TOKEN:0:20}..."

# Delete old categories first
echo "Deleting old categories..."
curl -s -X DELETE https://swp-backend-x36i.onrender.com/categories/68d07054ff2e45936481b984 \
  -H "Authorization: Bearer $TOKEN" > /dev/null

# Add all new categories
echo "Adding new categories..."

curl -X POST https://swp-backend-x36i.onrender.com/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name_en": "Breakfast Plus", "name_ar": "الإفطار زائد"}'

curl -X POST https://swp-backend-x36i.onrender.com/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name_en": "International Plus", "name_ar": "الدولية بلس"}'

curl -X POST https://swp-backend-x36i.onrender.com/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name_en": "Oriental Plus", "name_ar": "اورينتال بلس"}'

curl -X POST https://swp-backend-x36i.onrender.com/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name_en": "Pasta Plus", "name_ar": "باستا بلس"}'

curl -X POST https://swp-backend-x36i.onrender.com/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name_en": "Meal Plus", "name_ar": "وجبة بلس"}'

curl -X POST https://swp-backend-x36i.onrender.com/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name_en": "Hot & Cold Drinks", "name_ar": "المشروبات الساخنة والباردة"}'

curl -X POST https://swp-backend-x36i.onrender.com/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name_en": "Pastry", "name_ar": "معجنات"}'

curl -X POST https://swp-backend-x36i.onrender.com/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name_en": "Sandwich", "name_ar": "شطيرة"}'

echo "Done! Checking categories..."
curl -s https://swp-backend-x36i.onrender.com/categories | jq '.categories[] | {name_en: .name_en, name_ar: .name_ar}'
