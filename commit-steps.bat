@echo off
REM Run this ONCE from inside the tsag-av folder, after copying all files in.
REM It saves the work as 9 separate, logical commits (one per feature) and pushes.

cd /d "%~dp0"
if not exist .git (git init)
git config user.name >nul 2>nul || git config user.name "ganbolira1024"
git config user.email >nul 2>nul || git config user.email "ganbolira1024@users.noreply.github.com"
findstr /x ".env" .gitignore >nul || echo .env>> .gitignore
findstr /x ".claude/" .gitignore >nul || echo .claude/>> .gitignore

git add package.json package-lock.json app.json tsconfig.json assets scripts AGENTS.md LICENSE .vscode
git commit -m "chore: init Expo project (create-expo-app)"

git add .gitignore .env.example src/lib/supabase.ts
git commit -m "chore: Supabase client with SecureStore session, env example" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

git add supabase
git commit -m "feat(db): 9 tables, 1:N and N:M relations, RLS policies, triggers, seed data" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

git add src/lib/theme.ts src/lib/types.ts src/lib/format.ts src/components
git commit -m "feat(ui): theme, types and shared components" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

git add -A src/app/_layout.tsx src/lib/auth.tsx "src/app/(auth)"
git commit -m "feat(auth): auth context, login, register, password reset" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

git add "src/app/(tabs)/_layout.tsx" "src/app/(tabs)/index.tsx" "src/app/business"
git commit -m "feat: home list with search, category filter, sort, infinite scroll, pull-to-refresh" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

git add "src/app/book" "src/app/booking" "src/app/(tabs)/bookings.tsx"
git commit -m "feat(booking): time slot booking, my bookings, edit/cancel/delete with confirm" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

git add src/lib/upload.ts "src/app/(tabs)/profile.tsx"
git commit -m "feat(profile): edit profile, avatar from camera/gallery with compression + preview" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

git add "src/app/(tabs)/admin.tsx" "src/app/admin"
git commit -m "feat(admin): stats dashboard, business/service/staff CRUD" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

git add -A
git commit -m "docs: README with ERD and run instructions" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"

git remote remove origin 2>nul
git remote add origin https://github.com/ganbolira1024/tsag-av.git
git branch -M main
git push -u origin main
echo.
echo Done! Check your repo on GitHub.
pause
