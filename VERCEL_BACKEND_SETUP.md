# MataBumi Backend Deployment & Vercel Connection Guide

## Current Situation
- ✅ Frontend deployed on Vercel: https://matabumi.vercel.app
- ❌ Backend NOT deployed (Python FastAPI - only runs locally)
- ❌ Frontend can't reach backend → Falls back to demo mode

## Solution: Deploy Backend + Connect to Vercel

### Step 1: Deploy Backend to Railway (Easiest & Free)

#### 1.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (free $5/month credit)

#### 1.2 Deploy Backend
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `matabumi` repository
4. Railway will auto-detect Python

#### 1.3 Configure Railway
Add these settings in Railway dashboard:

**Root Directory**: Leave empty (uses root)

**Start Command**:
```bash
uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT
```

**Environment Variables**:
```
PLANETARY_COMPUTER_API_KEY=your_actual_key_here
DATABASE_PATH=backend/database/matabumi.db
FRONTEND_ORIGIN=https://matabumi.vercel.app
```

**Add `requirements.txt` to root** (if not exists):
```
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
python-dotenv==1.0.0
```

#### 1.4 Get Backend URL
After deployment, Railway gives you a URL like:
```
https://matabumi-production-xxxx.up.railway.app
```

Copy this URL - you'll need it for Vercel!

---

### Step 2: Connect Backend to Vercel Frontend

#### 2.1 Update Vercel Environment Variable

Go to Vercel Dashboard:
1. Open your MataBumi project
2. Go to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://matabumi-production-xxxx.up.railway.app` (your Railway URL)
   - **Environment**: Production, Preview, Development (select all)
4. Click **Save**

#### 2.2 Update vercel.json (Optional - for cleaner URLs)

If you want to keep `/api` paths in frontend code, update `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://matabumi-production-xxxx.up.railway.app/api/:path*"
    }
  ]
}
```

Then keep `VITE_API_BASE_URL=/api` in Vercel env vars.

#### 2.3 Redeploy Frontend

In Vercel Dashboard:
1. Go to **Deployments** tab
2. Click the three dots on latest deployment
3. Click **Redeploy**
4. Wait for build to complete (~2 minutes)

---

### Step 3: Verify Connection

After redeployment:

1. Visit https://matabumi.vercel.app
2. Open browser DevTools (F12) → Console
3. You should see:
   - ✅ No "Backend API tidak tersedia" message
   - ✅ No "Running in demo mode" logs
   - ✅ Data loading from backend

4. Check Network tab:
   - Should see successful API calls to `/api/stats`, `/api/alerts`, etc.

---

## Alternative: Other Backend Hosting Options

### Option 2: Render.com (Free Tier)
1. Go to https://render.com
2. Create "New Web Service"
3. Connect GitHub repo
4. Settings:
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.api.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway)
6. Copy the Render URL and add to Vercel

### Option 3: Fly.io (Free Tier)
1. Install Fly CLI: https://fly.io/docs/hands-on/install-flyctl/
2. Run: `fly launch` in your project directory
3. Follow prompts to deploy
4. Copy the Fly.io URL and add to Vercel

---

## Quick Reference: What Goes Where

### Railway/Render/Fly (Backend)
- **Code**: Python FastAPI backend
- **Environment Variables**:
  - `PLANETARY_COMPUTER_API_KEY`
  - `DATABASE_PATH`
  - `FRONTEND_ORIGIN=https://matabumi.vercel.app`

### Vercel (Frontend)
- **Code**: React/Vite frontend
- **Environment Variables**:
  - `VITE_API_BASE_URL=https://your-backend-url.com`

---

## Troubleshooting

### Backend deploys but frontend still shows demo mode
- Check Vercel env var is set correctly
- Redeploy frontend after adding env var
- Check browser console for CORS errors

### CORS Error
Add to Railway environment variables:
```
FRONTEND_ORIGIN=https://matabumi.vercel.app
```

The backend already has CORS middleware that reads this variable.

### Database Issues
Railway/Render use ephemeral storage. For production:
- Use PostgreSQL (Railway offers free PostgreSQL)
- Or use persistent volume storage
- Current SQLite will reset on each deploy

---

## Cost Breakdown

### Free Tier Limits
- **Railway**: $5/month credit (enough for small apps)
- **Render**: 750 hours/month free
- **Fly.io**: 3 shared VMs free
- **Vercel**: Unlimited for personal projects

All options are FREE for your use case! 🎉

---

## Next Steps

1. ✅ Choose a backend hosting service (Railway recommended)
2. ✅ Deploy backend with environment variables
3. ✅ Copy backend URL
4. ✅ Add `VITE_API_BASE_URL` to Vercel
5. ✅ Redeploy frontend
6. ✅ Test the connection

Your MataBumi app will be fully live with backend! 🚀
