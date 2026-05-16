# 🚀 Deploy MataBumi to Vercel (Frontend + Backend Together)

## What's Changed

✅ **Backend converted to Vercel Serverless Functions**
- Python FastAPI backend now runs as serverless functions
- No need for separate backend hosting (Railway, Render, etc.)
- Everything deploys together on Vercel

## Architecture

```
Vercel Deployment
├── Frontend (React/Vite)
│   └── https://matabumi.vercel.app/
│
└── Backend (Python Serverless Functions)
    ├── https://matabumi.vercel.app/api/alerts
    ├── https://matabumi.vercel.app/api/stats
    ├── https://matabumi.vercel.app/api/provinces
    ├── https://matabumi.vercel.app/api/trends
    └── https://matabumi.vercel.app/api/thumbnails/*
```

## Files Created/Modified

### New Files:
- ✅ `api/index.py` - Main serverless function entry point
- ✅ `api/_db_init.py` - Database initialization for serverless
- ✅ `api/thumbnails/[filename].py` - Thumbnail serving function

### Modified Files:
- ✅ `vercel.json` - Added serverless function configuration
- ✅ `requirements.txt` - Added `mangum` for FastAPI adapter
- ✅ `frontend/src/api.ts` - Fixed API paths for serverless
- ✅ `frontend/.env.production` - Set to use `/api` path

## Deployment Steps

### 1️⃣ Push Changes to GitHub

```bash
git add .
git commit -m "Convert backend to Vercel serverless functions"
git push origin main
```

### 2️⃣ Deploy to Vercel

**Option A: Automatic (if already connected)**
- Vercel will auto-deploy when you push to GitHub
- Wait ~3-5 minutes for build

**Option B: Manual Deploy**
1. Go to https://vercel.com/dashboard
2. Click your MataBumi project
3. Go to **Deployments** tab
4. Click **Redeploy** on latest deployment

### 3️⃣ Set Environment Variables (Optional)

Go to Vercel Dashboard → Settings → Environment Variables:

**Required:**
```
VITE_API_BASE_URL=/api
```

**Optional (for data pipeline):**
```
PLANETARY_COMPUTER_API_KEY=your_key_here
DATABASE_PATH=/tmp/matabumi.db
```

### 4️⃣ Test Deployment

1. Visit: https://matabumi.vercel.app
2. Open browser console (F12)
3. Check for API calls to `/api/stats`, `/api/alerts`, etc.
4. Should see data loading (or empty states if no data in database)

## How It Works

### Serverless Functions

Vercel automatically detects Python files in the `api/` directory and creates serverless functions:

- `api/index.py` → `/api/*` (all API routes)
- `api/thumbnails/[filename].py` → `/api/thumbnails/{filename}`

### Database Handling

**Important:** Vercel serverless functions have **ephemeral storage**.

- Database is copied to `/tmp/` on cold start
- `/tmp/` is cleared when function scales down
- **Data is NOT persistent between deployments**

### For Production with Persistent Data:

You have 3 options:

#### Option 1: Use Vercel Postgres (Recommended)
```bash
# Install Vercel Postgres
vercel postgres create

# Update database/db.py to use PostgreSQL instead of SQLite
```

#### Option 2: Use External Database
- Connect to external PostgreSQL (Supabase, Neon, etc.)
- Update `DATABASE_PATH` env var to connection string

#### Option 3: Keep SQLite (Demo Only)
- Current setup works for demo/testing
- Data resets on each deployment
- Good for showcasing UI/UX

## Vercel Configuration Explained

### vercel.json

```json
{
  "functions": {
    "api/**/*.py": {
      "runtime": "python3.9",      // Python version
      "memory": 1024,               // 1GB RAM per function
      "maxDuration": 10             // 10 second timeout
    }
  },
  "routes": [
    {
      "src": "/api/(.*)",           // Match /api/*
      "dest": "/api/index.py"       // Route to main function
    }
  ]
}
```

### API Routes

The backend routes are defined in `backend/api/routes.py`:

- `/api/alerts` - Get deforestation alerts
- `/api/provinces` - Get province statistics
- `/api/stats` - Get national statistics
- `/api/trends` - Get time-series data
- `/api/forecast` - Get forecast (placeholder)

All routes are automatically handled by the serverless function.

## Testing Locally

### Test Frontend + Backend Together

```bash
# Install Vercel CLI
npm i -g vercel

# Run local development server
vercel dev

# Visit http://localhost:3000
```

This runs both frontend and backend locally, simulating Vercel's environment.

### Test Frontend Only

```bash
cd frontend
npm run dev
```

### Test Backend Only

```bash
# Install dependencies
pip install -r requirements.txt

# Run FastAPI directly
uvicorn backend.api.main:app --reload
```

## Troubleshooting

### Backend returns 500 error

**Check Vercel Function Logs:**
1. Vercel Dashboard → Your Project
2. Click on deployment
3. Go to **Functions** tab
4. Click on `/api/index` function
5. View logs for errors

**Common issues:**
- Missing dependencies in `requirements.txt`
- Import errors (check Python paths)
- Database initialization errors

### Frontend shows "Mode Demo"

**Check:**
1. Vercel env var `VITE_API_BASE_URL=/api` is set
2. Frontend was redeployed after setting env var
3. Hard refresh browser (Ctrl+Shift+R)

### API calls return 404

**Check:**
1. `vercel.json` routes configuration is correct
2. `api/index.py` exists and has `handler` function
3. Deployment logs show functions were created

### Database errors

**Check:**
1. `/tmp/` directory is writable (it should be on Vercel)
2. Database schema is created correctly in `api/_db_init.py`
3. Function has enough memory (increase in `vercel.json`)

## Performance

### Cold Start
- First request after idle: ~2-3 seconds
- Subsequent requests: ~100-300ms

### Limits (Free Tier)
- **Bandwidth**: 100GB/month
- **Function Executions**: 100GB-hours/month
- **Function Duration**: 10 seconds max
- **Deployments**: Unlimited

### Optimization Tips
1. Keep functions small and focused
2. Use caching for static data
3. Optimize database queries
4. Consider upgrading to Pro for better performance

## Cost

### Free Tier (Hobby)
- ✅ Unlimited personal projects
- ✅ 100GB bandwidth/month
- ✅ Serverless functions included
- ✅ Automatic HTTPS
- ✅ Global CDN

### Pro Tier ($20/month)
- Faster builds
- More bandwidth
- Longer function duration
- Team collaboration

**For MataBumi:** Free tier is sufficient! 🎉

## Next Steps

### 1. Add Persistent Database

Convert to PostgreSQL for production:

```bash
# Create Vercel Postgres
vercel postgres create

# Update database/db.py
# Replace sqlite3 with psycopg2
# Use DATABASE_URL from Vercel
```

### 2. Add Data Pipeline

Deploy data pipeline as cron job:

```json
// vercel.json
{
  "crons": [{
    "path": "/api/pipeline",
    "schedule": "0 0 * * *"  // Daily at midnight
  }]
}
```

### 3. Add Monitoring

Enable Vercel Analytics:
- Dashboard → Your Project → Analytics
- Track performance, errors, and usage

### 4. Custom Domain

Add custom domain:
- Dashboard → Your Project → Settings → Domains
- Add `matabumi.org` or your domain

## Summary

✅ **What You Get:**
- Frontend + Backend on Vercel
- Single deployment command
- Automatic HTTPS
- Global CDN
- Serverless scaling
- $0 cost (free tier)

✅ **What Changed:**
- Backend now runs as serverless functions
- Database uses `/tmp/` (ephemeral)
- API calls use relative `/api` path
- Everything deploys together

✅ **What to Do:**
1. Push changes to GitHub
2. Vercel auto-deploys
3. Set `VITE_API_BASE_URL=/api` in Vercel
4. Test at https://matabumi.vercel.app

🎉 **You're done!** Both frontend and backend are now on Vercel!

---

## Quick Reference

| What | URL |
|------|-----|
| Frontend | https://matabumi.vercel.app |
| Backend API | https://matabumi.vercel.app/api/* |
| API Docs | https://matabumi.vercel.app/api/docs |
| Vercel Dashboard | https://vercel.com/dashboard |
| Function Logs | Dashboard → Project → Functions |

---

Need help? Check the Vercel docs: https://vercel.com/docs/functions/serverless-functions/runtimes/python
