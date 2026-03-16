#!/bin/bash
# Production Deployment Checklist

echo "🚀 Pre-Deployment Production Checklist"
echo "========================================"
echo ""

# Check 1: .env files not in git
echo "[1] Checking .gitignore..."
if grep -q ".env" .gitignore; then
    echo "✅ .env files protected in .gitignore"
else
    echo "❌ CRITICAL: .env files may be exposed!"
fi

# Check 2: Requirements.txt
echo ""
echo "[2] Checking requirements.txt..."
if [ -f "dleva/requirements.txt" ]; then
    echo "✅ requirements.txt exists"
    echo "   Dependencies:"
    head -5 dleva/requirements.txt
else
    echo "❌ requirements.txt missing"
fi

# Check 3: Package.json
echo ""
echo "[3] Checking package.json..."
if [ -f "dleva-frontend/package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json missing"
fi

# Check 4: Environment examples
echo ""
echo "[4] Checking .env.example files..."
if [ -f "dleva/.env.example" ]; then
    echo "✅ Backend .env.example exists"
else
    echo "❌ Backend .env.example missing"
fi

if [ -f "dleva-frontend/.env.example" ]; then
    echo "✅ Frontend .env.example exists"
else
    echo "❌ Frontend .env.example missing"
fi

# Check 5: Production files
echo ""
echo "[5] Checking production configuration files..."
if [ -f "Procfile" ]; then
    echo "✅ Procfile exists"
else
    echo "❌ Procfile missing"
fi

if [ -f "runtime.txt" ]; then
    echo "✅ runtime.txt exists"
else
    echo "❌ runtime.txt missing"
fi

echo ""
echo "========================================"
echo "Ready for GitHub push? Review the checklist above."
echo ""
echo "Before pushing:"
echo "1. git status | grep .env (should be empty)"
echo "2. Generate new SECRET_KEY"
echo "3. Review PRODUCTION_DEPLOYMENT_GUIDE.md"
echo "4. Update Paystack keys to LIVE"
