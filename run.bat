@echo off
echo 🕌 Kitabu - Start ho raha hai...

if not exist "backend\data\quran_ar.json" (
  echo Data download ho raha hai...
  cd backend\data
  python download.py
  python convert.py
  cd ..\..
)

echo Dependencies install...
pip install -r requirements.txt

echo Backend chal raha hai: http://localhost:8000
cd backend
python -m uvicorn main:app --reload
