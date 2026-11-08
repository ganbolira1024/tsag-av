@echo off
REM Double-click this file: installs the extra packages (first time only) and starts Expo.
cd /d "%~dp0"
if not exist node_modules\@supabase\supabase-js (
  echo Installing packages, please wait 1-3 minutes...
  call npx expo install @supabase/supabase-js react-native-url-polyfill expo-secure-store expo-image-picker @expo/vector-icons
)
echo.
echo Scan the QR code below with Expo Go on your phone (same Wi-Fi as this PC).
echo If it does not connect, close this window and run:  npx expo start -c --tunnel
echo.
call npx expo start -c
pause
