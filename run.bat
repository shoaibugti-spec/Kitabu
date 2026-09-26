@echo off
echo 🕌 Kitabu - Client-side mode

if not exist "frontend\data\quran_ar.json" (
  echo.
  echo ⚠️  Data file nahi mili!
  echo Pehle ye chalayen:
  echo   cd backend\data
  echo   pip install httpx
  echo   python download.py
  echo   python convert.py
  echo   copy quran_ar.json ..\..\frontend\data\
  echo.
  pause
  exit /b
)

echo Starting local server at http://localhost:5500
cd frontend
python -m http.server 5500
