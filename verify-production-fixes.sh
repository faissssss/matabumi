#!/bin/bash

# MataBumi Production Fixes Verification Script
# Run this before deploying to ensure all fixes are in place

echo "🔍 MataBumi Production Fixes Verification"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to check if a file contains a string
check_file_contains() {
    local file=$1
    local search=$2
    local description=$3
    
    if grep -q "$search" "$file" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        ((FAILED++))
        return 1
    fi
}

# Function to check if a file exists
check_file_exists() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        ((FAILED++))
        return 1
    fi
}

echo "1. Theme Initialization Fixes"
echo "------------------------------"
check_file_contains "frontend/index.html" "localStorage.getItem('matabumi-theme')" "Inline theme script in index.html"
check_file_contains "frontend/index.html" "document.documentElement.classList.add(theme)" "Theme class added before render"
check_file_contains "frontend/src/main.tsx" "ErrorBoundary" "Error boundary implemented"
echo ""

echo "2. Loading States"
echo "-----------------"
check_file_contains "frontend/index.html" "app-loading" "Loading indicator in HTML"
check_file_contains "frontend/index.html" "app-loading-spinner" "Loading spinner styles"
check_file_contains "frontend/index.html" "Loading MataBumi" "Loading text present"
echo ""

echo "3. Error Handling"
echo "-----------------"
check_file_contains "frontend/index.html" "app-error" "Error styles in HTML"
check_file_contains "frontend/src/main.tsx" "class ErrorBoundary" "ErrorBoundary class defined"
check_file_contains "frontend/src/main.tsx" "getDerivedStateFromError" "Error boundary lifecycle"
check_file_contains "frontend/src/api.ts" "timeout: 10000" "API timeout increased"
echo ""

echo "4. Empty States"
echo "---------------"
check_file_exists "frontend/src/components/EmptyState.tsx" "EmptyState component exists"
check_file_contains "frontend/src/App.tsx" "EmptyState" "EmptyState imported in App"
check_file_contains "frontend/src/App.tsx" "hasBackend" "Backend detection implemented"
echo ""

echo "5. Production Configuration"
echo "---------------------------"
check_file_contains "vercel.json" "npm ci" "Using npm ci for builds"
check_file_contains "vercel.json" "X-Frame-Options" "Security headers configured"
check_file_contains "vercel.json" "Cache-Control" "Asset caching configured"
check_file_exists "frontend/.env.production.example" "Production env example exists"
echo ""

echo "6. Build Verification"
echo "---------------------"
if [ -d "frontend/dist" ]; then
    echo -e "${GREEN}✓${NC} Build directory exists"
    ((PASSED++))
    
    if [ -f "frontend/dist/index.html" ]; then
        echo -e "${GREEN}✓${NC} Built index.html exists"
        ((PASSED++))
        
        # Check built HTML has our fixes
        if grep -q "localStorage.getItem('matabumi-theme')" "frontend/dist/index.html"; then
            echo -e "${GREEN}✓${NC} Built HTML has theme script"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} Built HTML missing theme script"
            ((FAILED++))
        fi
        
        if grep -q "app-loading" "frontend/dist/index.html"; then
            echo -e "${GREEN}✓${NC} Built HTML has loading indicator"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} Built HTML missing loading indicator"
            ((FAILED++))
        fi
    else
        echo -e "${RED}✗${NC} Built index.html missing"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠${NC} Build directory not found (run 'npm run build' in frontend/)"
    echo -e "${YELLOW}⚠${NC} Built index.html not checked"
    echo -e "${YELLOW}⚠${NC} Built HTML theme script not checked"
    echo -e "${YELLOW}⚠${NC} Built HTML loading indicator not checked"
fi
echo ""

echo "7. Documentation"
echo "----------------"
check_file_exists "DEPLOYMENT_GUIDE.md" "Deployment guide exists"
check_file_exists "PRODUCTION_FIXES_COMPLETE.md" "Production fixes doc exists"
check_file_contains "DEPLOYMENT_GUIDE.md" "Theme Initialization" "Deployment guide updated"
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready for production deployment.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the issues above.${NC}"
    exit 1
fi
