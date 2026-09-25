#!/bin/bash
set -e
echo "🕌 Kitabu — شروع ہو رہا ہے..."

# ڈیٹا چیک
if [ ! -f "backend/data/quran_ar.json" ]; then
  echo "📥 ڈیٹا ڈاؤن لوڈ ہو رہا ہے..."
  cd backend/data
  python3 download.py
  python3 convert.py
  cd ../..
fi

# Dependencies
echo "📦 Dependencies انسٹال..."
pip install -r requirements.txt

# بیک اینڈ چلائیں
echo "🚀 بیک اینڈ چل رہا ہے: http://localhost:8000"
cd backend
python3 -m uvicorn main:app --reload
