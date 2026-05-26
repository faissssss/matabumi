# MataBumi Deployment Guide

## ✅ Repository Status
- **GitHub Repository**: https://github.com/faissssss/matabumi.git
- **Latest Commit**: Production fixes - Theme initialization, error boundaries, empty states
- **Status**: Ready for deployment with robust error handling

## 🚀 Deploy to Vercel

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with your GitHub account

2. **Import Repository**
   - Click "Import Project"
   - Select "Import Git Repository"
   - Choose: `faissssss/matabumi`

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `cd frontend && npm ci && npm run build`
   - **Output Directory**: `frontend/dist`

4. **Environment Variables**
   
   **Option A: Frontend Only (Demo Mode)**
   ```
   VITE_API_BASE_URL=/api
   ```
   - App will run without backend
   - Shows empty states with helpful messages
   - Perfect for showcasing UI/UX
   
   **Option B: With Backend API**
   ```
   VITE_API_BASE_URL=https://your-backend-api.com
   ```
   - Replace with your actual backend URL
   - Full functionality with real-time data

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at: `https://matabumi-[random].vercel.app`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## 📋 Pre-Deployment Checklist

✅ Code pushed to GitHub
✅ `.gitignore` updated to exclude temporary files
✅ `vercel.json` configured with security headers
✅ Frontend build script configured
✅ Environment variables documented
✅ Error boundaries implemented
✅ Empty states for missing data
✅ Theme initialization fixed
✅ Loading indicators added
✅ API error handling improved
✅ Production-ready fallbacks

## 🎨 Features Deployed

### Core Features
- **Unified Navigation**: Single navbar for Dashboard and About pages
- **About Page**: Comprehensive landing page with mission, features, methodology
- **Amber Theme**: Consistent amber/orange (#f59e0b) primary color
- **Light/Dark Mode**: Full theme support across all components
- **Bilingual**: English and Indonesian language support
- **Responsive Design**: Mobile-friendly layout

### Production Enhancements (NEW)
- **Error Boundaries**: Catches React errors gracefully
- **Loading States**: Visual feedback during data loading
- **Empty States**: Clear messaging when no data available
- **Demo Mode**: Works without backend API
- **Improved Error Handling**: Better API timeout and fallback logic
- **Theme Fix**: No more flash or dark screen issues
- **Security Headers**: X-Frame-Options, CSP, etc.

## 🔧 Post-Deployment

After deployment:

1. **Test the deployment**:
   - Visit your Vercel URL
   - Verify theme loads correctly (no dark screen!)
   - Test Dashboard view
   - Test About page navigation
   - Toggle light/dark theme
   - Toggle language (EN/ID)
   - Check empty states if no backend
   - Test map interactions (if data available)

2. **Check Browser Console**:
   - Should see "Running in demo mode" if no backend
   - No critical errors should appear
   - Theme should initialize immediately

3. **Custom Domain** (Optional):
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add your custom domain (e.g., matabumi.org)

4. **Monitor**:
   - Check Vercel Analytics for performance
   - Monitor error logs in Vercel dashboard
   - Review function logs if using serverless backend

## � Backend Integration (Optional)

If you want to deploy with a backend:

### Option 1: Deploy Backend Separately
1. Deploy your Python backend to a service (Railway, Render, Fly.io)
2. Get the backend URL (e.g., `https://matabumi-api.railway.app`)
3. Update Vercel environment variable:
   ```
   VITE_API_BASE_URL=https://matabumi-api.railway.app
   ```
4. Redeploy frontend

### Option 2: Use Vercel Serverless Functions
1. Convert Python backend to Node.js serverless functions
2. Place in `/api` directory
3. Update `vercel.json` to include API routes
4. Deploy together

### Option 3: Use Vercel Rewrites (Current Setup)
1. Edit `vercel.json` rewrites section:
   ```json
   "rewrites": [
     {
       "source": "/api/:path*",
       "destination": "https://your-backend-url.com/api/:path*"
     }
   ]
   ```
2. Redeploy

## 📝 Notes

### Current Setup
- Frontend-only deployment (demo mode)
- No backend required to run
- Shows empty states with helpful messages
- Perfect for UI/UX showcase

### With Backend
- Full functionality with real-time data
- Database integration (SQLite or PostgreSQL)
- Satellite imagery processing
- Alert generation and tracking

### Performance
- Build time: ~2-3 minutes
- Cold start time: <1 second (static site)
- Theme loads instantly (no flash)
- Error boundaries prevent crashes

## 📦 Supabase Storage Setup (For Thumbnail Images)

**Required for production deployment** - Thumbnail images need persistent cloud storage to work in Vercel's serverless environment.

### Step 1: Create Supabase Storage Bucket

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to Storage**: Click "Storage" in the left sidebar
3. **Create New Bucket**:
   - Click "New Bucket" button
   - **Name**: `thumbnails`
   - **Public**: ✅ Enable (check "Public bucket")
   - **File size limit**: Leave default (no limit)
   - Click "Create Bucket"

### Step 2: Configure Vercel Environment Variables

Add these environment variables in Vercel Dashboard → Your Project → Settings → Environment Variables:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
```

**Where to find these values:**
- **SUPABASE_URL**: Supabase Dashboard → Settings → API → Project URL
- **SUPABASE_SERVICE_KEY**: Supabase Dashboard → Settings → API → service_role key (⚠️ SECRET - never commit to Git!)

**Apply to**: Production environment

### Step 3: Upload Existing Thumbnails

After deploying the code changes, upload your existing thumbnails:

```bash
# Set environment variables locally (or add to .env file)
export SUPABASE_URL=https://your-project-id.supabase.co
export SUPABASE_SERVICE_KEY=your-service-role-key-here

# Run upload script
python pipeline/upload_thumbnails.py
```

**Expected output:**
```
✓ Uploaded Aceh_2026-05-15_0.jpg
✓ Uploaded Bali_2026-03-15_0.jpg
...
✓ Uploaded 15 thumbnails successfully
```

### Step 4: Verify Thumbnail URLs

Test that thumbnails are accessible via public URLs:

```
https://your-project-id.supabase.co/storage/v1/object/public/thumbnails/Aceh_2026-05-15_0.jpg
```

**Bucket URL Format:**
```
https://{project-id}.supabase.co/storage/v1/object/public/thumbnails/{filename}
```

### Step 5: Redeploy to Vercel

After configuring environment variables:

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for build to complete

### Verification Checklist

- [ ] Supabase Storage bucket "thumbnails" created and set to public
- [ ] Environment variables added to Vercel (SUPABASE_URL, SUPABASE_SERVICE_KEY)
- [ ] Existing thumbnails uploaded to Supabase Storage (15 files)
- [ ] Thumbnail URLs accessible (test one URL in browser)
- [ ] Application redeployed to Vercel
- [ ] Thumbnails display correctly in production (no broken images)
- [ ] Browser console shows no 404 errors for thumbnail requests

### Troubleshooting Supabase Storage

**Thumbnails still showing 404:**
- Check environment variables are set correctly in Vercel
- Verify bucket is set to "Public" in Supabase Dashboard
- Confirm thumbnails were uploaded successfully (check Supabase Storage UI)
- Hard refresh browser (Ctrl+Shift+R) to clear cache

**Upload script fails:**
- Verify SUPABASE_URL and SUPABASE_SERVICE_KEY are set correctly
- Check service role key has storage permissions
- Ensure `supabase` Python package is installed: `pip install supabase>=2.0.0`

**Bucket not found error:**
- Verify bucket name is exactly "thumbnails" (case-sensitive)
- Check bucket was created in the correct Supabase project

## 🆘 Troubleshooting

### Dark Screen Issue (FIXED)
**Problem**: Screen stays dark after deployment
**Solution**: 
- ✅ Theme now initializes in inline script (before React)
- ✅ Loading indicator shows during app initialization
- ✅ Error boundaries catch and display errors
- ✅ Empty states show when no data available

### Build Fails
**Check**:
- Vercel build logs for errors
- Ensure all dependencies in `package.json`
- Verify TypeScript compilation succeeds locally
- Run `npm ci && npm run build` locally first

### API Not Working
**Check**:
- Environment variables are set correctly
- Backend URL is accessible from Vercel
- CORS is configured on backend
- Check Vercel function logs
- Verify `vercel.json` rewrites configuration

### Theme Not Applying
**Check**:
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache and localStorage
- Check browser console for errors
- Verify CSS files loaded in Network tab

### Empty States Showing
**Expected Behavior**:
- If no backend: Shows "Demo Mode" message
- If backend but no data: Shows "No Data Available"
- This is correct behavior, not an error!

## 🔗 Useful Links

- **GitHub Repo**: https://github.com/faissssss/matabumi
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
- **Vite Docs**: https://vitejs.dev/guide/

## 🎯 Quick Deployment Commands

```bash
# Local testing before deployment
cd frontend
npm ci
npm run build
npm run preview

# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs [deployment-url]
```

## ✨ What's Fixed

1. **Theme Initialization**: Inline script prevents dark screen
2. **Error Boundaries**: React errors don't crash the app
3. **Loading States**: Users see feedback during loading
4. **Empty States**: Clear messaging when no data
5. **API Handling**: Graceful fallbacks for missing backend
6. **Security Headers**: Production-ready security configuration
7. **Build Optimization**: Uses `npm ci` for faster, reliable builds

Your app is now production-ready and will work reliably on Vercel! 🚀
