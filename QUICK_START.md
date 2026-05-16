# 🚀 Quick Start - 2 Steps to Deploy

## ✅ Code is Already Pushed!

Your backend is now on GitHub and ready to deploy.

---

## Step 1: Set Environment Variable (1 minute)

1. Go to: **https://vercel.com/dashboard**
2. Click your **MataBumi** project
3. **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   ```
   Name:  VITE_API_BASE_URL
   Value: /api
   ```
6. Check all environments (Production, Preview, Development)
7. Click **Save**

---

## Step 2: Redeploy (3-5 minutes)

1. Go to **Deployments** tab
2. Click **⋯** on latest deployment
3. Click **Redeploy**
4. Wait for build to complete

---

## Step 3: Test! (30 seconds)

Visit: **https://matabumi.vercel.app**

You should see:
- ✅ No "Mode Demo" message
- ✅ Dashboard loading
- ✅ No errors in console (F12)

---

## That's It! 🎉

Your MataBumi app is now live with:
- ✅ Frontend on Vercel
- ✅ Backend on Vercel
- ✅ Both on same domain
- ✅ $0 cost

---

## Quick Test

Open these URLs to verify backend is working:

```
https://matabumi.vercel.app/api/health
https://matabumi.vercel.app/api/stats
https://matabumi.vercel.app/api/alerts
```

Should return JSON (may be empty if no data).

---

## Need Help?

- **Detailed Guide**: `FINAL_DEPLOYMENT_STEPS.md`
- **Full Documentation**: `VERCEL_ONLY_DEPLOYMENT.md`
- **Troubleshooting**: `FINAL_DEPLOYMENT_STEPS.md` → Troubleshooting section

---

**TL;DR:**
1. Set `VITE_API_BASE_URL=/api` in Vercel
2. Redeploy
3. Done! ✅
