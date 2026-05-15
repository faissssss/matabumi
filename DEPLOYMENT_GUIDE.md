# MataBumi Deployment Guide

## ✅ Repository Status
- **GitHub Repository**: https://github.com/faissssss/matabumi.git
- **Latest Commit**: feat: Add About page with unified navbar and amber theme
- **Status**: Ready for deployment

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
   - **Build Command**: `npm run vercel-build` (in frontend directory)
   - **Output Directory**: `frontend/dist`

4. **Environment Variables**
   Add these environment variables in Vercel dashboard:
   ```
   NDVI_CHANGE_THRESHOLD=0.2
   MINIMUM_ALERT_AREA=50
   CLOUD_COVER_MAX=15
   CONFIDENCE_THRESHOLD=0.6
   ```

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
✅ `vercel.json` configured
✅ Frontend build script configured
✅ Environment variables documented
✅ All components using theme variables
✅ AboutPage component added
✅ Unified navbar implemented
✅ Light/Dark theme working

## 🎨 Features Deployed

- **Unified Navigation**: Single navbar for Dashboard and About pages
- **About Page**: Comprehensive landing page with mission, features, methodology, and impact stats
- **Amber Theme**: Consistent amber/orange (#f59e0b) primary color
- **Light/Dark Mode**: Full theme support across all components
- **Bilingual**: English and Indonesian language support
- **Responsive Design**: Mobile-friendly layout
- **Event Markers**: Improved visibility with clear severity colors
- **Dynamic Copyright**: Automatically shows current year (2026)

## 🔧 Post-Deployment

After deployment:

1. **Test the deployment**:
   - Visit your Vercel URL
   - Test Dashboard view
   - Test About page navigation
   - Toggle light/dark theme
   - Toggle language (EN/ID)
   - Test map interactions

2. **Custom Domain** (Optional):
   - Go to Vercel Dashboard → Your Project → Settings → Domains
   - Add your custom domain (e.g., matabumi.org)

3. **Monitor**:
   - Check Vercel Analytics for performance
   - Monitor error logs in Vercel dashboard

## 📝 Notes

- The backend API is configured to run as serverless functions on Vercel
- Static assets (thumbnails, images) are served from the `/outputs` directory
- Database is SQLite (consider upgrading to PostgreSQL for production)
- Build time: ~2-3 minutes
- Cold start time: ~1-2 seconds for API

## 🆘 Troubleshooting

**Build fails?**
- Check Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify TypeScript compilation succeeds locally

**API not working?**
- Check environment variables are set
- Verify `vercel.json` routes configuration
- Check function logs in Vercel dashboard

**Theme not applying?**
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Check browser console for errors

## 🔗 Useful Links

- **GitHub Repo**: https://github.com/faissssss/matabumi
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs**: https://vercel.com/docs
