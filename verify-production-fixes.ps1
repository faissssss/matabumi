# MataBumi Production Fixes Verification Script (PowerShell)
# Run this before deploying to ensure all fixes are in place

Write-Host "🔍 MataBumi Production Fixes Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

$PASSED = 0
$FAILED = 0

# Function to check if a file contains a string
function Test-FileContains {
    param(
        [string]$File,
        [string]$Search,
        [string]$Description
    )
    
    if (Test-Path $File) {
        $content = Get-Content $File -Raw -ErrorAction SilentlyContinue
        if ($content -match [regex]::Escape($Search)) {
            Write-Host "✓ $Description" -ForegroundColor Green
            $script:PASSED++
            return $true
        }
    }
    Write-Host "✗ $Description" -ForegroundColor Red
    $script:FAILED++
    return $false
}

# Function to check if a file exists
function Test-FileExistsCheck {
    param(
        [string]$File,
        [string]$Description
    )
    
    if (Test-Path $File) {
        Write-Host "✓ $Description" -ForegroundColor Green
        $script:PASSED++
        return $true
    }
    Write-Host "✗ $Description" -ForegroundColor Red
    $script:FAILED++
    return $false
}

Write-Host "1. Theme Initialization Fixes"
Write-Host "------------------------------"
Test-FileContains "frontend/index.html" "localStorage.getItem('matabumi-theme')" "Inline theme script in index.html"
Test-FileContains "frontend/index.html" "document.documentElement.classList.add(theme)" "Theme class added before render"
Test-FileContains "frontend/src/main.tsx" "ErrorBoundary" "Error boundary implemented"
Write-Host ""

Write-Host "2. Loading States"
Write-Host "-----------------"
Test-FileContains "frontend/index.html" "app-loading" "Loading indicator in HTML"
Test-FileContains "frontend/index.html" "app-loading-spinner" "Loading spinner styles"
Test-FileContains "frontend/index.html" "Loading MataBumi" "Loading text present"
Write-Host ""

Write-Host "3. Error Handling"
Write-Host "-----------------"
Test-FileContains "frontend/index.html" "app-error" "Error styles in HTML"
Test-FileContains "frontend/src/main.tsx" "class ErrorBoundary" "ErrorBoundary class defined"
Test-FileContains "frontend/src/main.tsx" "getDerivedStateFromError" "Error boundary lifecycle"
Test-FileContains "frontend/src/api.ts" "timeout: 10000" "API timeout increased"
Write-Host ""

Write-Host "4. Empty States"
Write-Host "---------------"
Test-FileExistsCheck "frontend/src/components/EmptyState.tsx" "EmptyState component exists"
Test-FileContains "frontend/src/App.tsx" "EmptyState" "EmptyState imported in App"
Test-FileContains "frontend/src/App.tsx" "hasBackend" "Backend detection implemented"
Write-Host ""

Write-Host "5. Production Configuration"
Write-Host "---------------------------"
Test-FileContains "vercel.json" "npm ci" "Using npm ci for builds"
Test-FileContains "vercel.json" "X-Frame-Options" "Security headers configured"
Test-FileContains "vercel.json" "Cache-Control" "Asset caching configured"
Test-FileExistsCheck "frontend/.env.production.example" "Production env example exists"
Write-Host ""

Write-Host "6. Build Verification"
Write-Host "---------------------"
if (Test-Path "frontend/dist") {
    Write-Host "✓ Build directory exists" -ForegroundColor Green
    $script:PASSED++
    
    if (Test-Path "frontend/dist/index.html") {
        Write-Host "✓ Built index.html exists" -ForegroundColor Green
        $script:PASSED++
        
        $builtHtml = Get-Content "frontend/dist/index.html" -Raw
        if ($builtHtml -match "localStorage\.getItem\('matabumi-theme'\)") {
            Write-Host "✓ Built HTML has theme script" -ForegroundColor Green
            $script:PASSED++
        } else {
            Write-Host "✗ Built HTML missing theme script" -ForegroundColor Red
            $script:FAILED++
        }
        
        if ($builtHtml -match "app-loading") {
            Write-Host "✓ Built HTML has loading indicator" -ForegroundColor Green
            $script:PASSED++
        } else {
            Write-Host "✗ Built HTML missing loading indicator" -ForegroundColor Red
            $script:FAILED++
        }
    } else {
        Write-Host "✗ Built index.html missing" -ForegroundColor Red
        $script:FAILED++
    }
} else {
    Write-Host "⚠ Build directory not found (run 'npm run build' in frontend/)" -ForegroundColor Yellow
    Write-Host "⚠ Skipping build verification checks" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "7. Documentation"
Write-Host "----------------"
Test-FileExistsCheck "DEPLOYMENT_GUIDE.md" "Deployment guide exists"
Test-FileExistsCheck "PRODUCTION_FIXES_COMPLETE.md" "Production fixes doc exists"
Test-FileContains "DEPLOYMENT_GUIDE.md" "Theme Initialization" "Deployment guide updated"
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Passed: $PASSED" -ForegroundColor Green
Write-Host "Failed: $FAILED" -ForegroundColor Red
Write-Host ""

if ($FAILED -eq 0) {
    Write-Host "✅ All checks passed! Ready for production deployment." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some checks failed. Please review the issues above." -ForegroundColor Red
    exit 1
}
