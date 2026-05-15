# MataBumi Deployment Guide

This guide covers deploying MataBumi to Vercel for production use.

## Prerequisites

- Vercel account (free tier works)
- Git repository with MataBumi code
- Database populated with alerts (run pipeline locally first)
- Thumbnails and hero images generated

## Pre-Deployment Checklist

### 1. Run Pipeline Locally

Before deploying, run the detection pipeline to populate the database:

```bash
# Run for all provinces (takes several hours)
python pipeline/run.py

# Or run for a subset for testing
python test_pipeline_checkpoint.py
```

This will:
- Fetch satellite imagery
- Detect deforestation
- Populate `backend/database/matabumi.db`
- Generate thumbnails in `outputs/thumbnails/`
- Generate hero images in `outputs/`

### 2. Verify Database

Check that the database has data:

```bash
python -c "from database.db import query_national_stats; print(query_national_stats())"
```

Should output statistics like:
```
{'total_area_ha': 62338.0, 'total_events': 3, ...}
```

### 3. Check .gitignore

Ensure the following are **NOT** in `.gitignore`:
- `backend/database/matabumi.db`
- `outputs/thumbnails/*.jpg`
- `outputs/matabumi_*.png`

These files need to be committed to Git for Vercel deployment.

### 4. Commit Database and Assets

```bash
git add backend/database/matabumi.db
git add outputs/thumbnails/
git add outputs/*.png
git commit -m "Add database and generated assets for deployment"
git push
```

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI:**

```bash
npm install -g vercel
```

2. **Login to Vercel:**

```bash
vercel login
```

3. **Deploy:**

```bash
vercel
```

Follow the prompts:
- Link to existing project or create new one
- Set project name: `matabumi-deforestation-monitoring`
- Select root directory: `./`
- Override settings: No (use vercel.json)

4. **Deploy to Production:**

```bash
vercel --prod
```

### Option 2: Deploy via Vercel Dashboard

1. **Connect Repository:**
   - Go to https://vercel.com/new
   - Import your Git repository
   - Select the repository

2. **Configure Project:**
   - Framework Preset: Other
   - Root Directory: `./`
   - Build Command: (leave default, uses vercel.json)
   - Output Directory: (leave default, uses vercel.json)

3. **Set Environment Variables:**

Add these in the Vercel dashboard under Settings → Environment Variables:

```
NDVI_CHANGE_THRESHOLD=0.2
MINIMUM_ALERT_AREA=50
CLOUD_COVER_MAX=15
CONFIDENCE_THRESHOLD=0.6
```

4. **Deploy:**

Click "Deploy" button.

## Post-Deployment

### 1. Verify Deployment

Once deployed, Vercel will provide a URL like `https://matabumi-deforestation-monitoring.vercel.app`

Test the API endpoints:

```bash
# Replace with your Vercel URL
VERCEL_URL="https://matabumi-deforestation-monitoring.vercel.app"

# Test stats endpoint
curl $VERCEL_URL/api/stats

# Test alerts endpoint
curl $VERCEL_URL/api/alerts?limit=5

# Test frontend
curl $VERCEL_URL
```

### 2. Test Frontend

Open the Vercel URL in your browser and verify:
- Map loads with alerts
- Filters work (province, severity, cause)
- Language toggle works (EN/ID)
- Impact calculator updates
- Thumbnails display correctly

### 3. Configure Custom Domain (Optional)

In Vercel dashboard:
1. Go to Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Updating the Deployment

### Update Code Only

If you only changed code (not database):

```bash
git add .
git commit -m "Update code"
git push
```

Vercel will automatically redeploy.

### Update Database

If you ran the pipeline and have new alerts:

```bash
# Commit updated database
git add backend/database/matabumi.db
git add outputs/thumbnails/*.jpg
git add outputs/*.png
git commit -m "Update database with new alerts"
git push
```

Vercel will redeploy with the new data.

## Troubleshooting

### Build Fails

**Error:** `Module not found`

**Solution:** Ensure all dependencies are in `requirements.txt` and `frontend/package.json`

### API Returns 500 Error

**Error:** API endpoints return Internal Server Error

**Solution:** 
1. Check Vercel function logs in dashboard
2. Verify database file is committed and accessible
3. Check environment variables are set correctly

### Frontend Can't Connect to Backend

**Error:** CORS errors in browser console

**Solution:** 
1. Check CORS configuration in `backend/api/main.py`
2. Add your Vercel domain to allowed origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-domain.vercel.app"  # Add this
    ],
    ...
)
```

### Thumbnails Don't Load

**Error:** 404 errors for thumbnail images

**Solution:**
1. Verify thumbnails are committed to Git
2. Check `vercel.json` routes configuration
3. Ensure thumbnail paths in database are correct

### Database is Empty

**Error:** API returns empty arrays

**Solution:**
1. Run pipeline locally to populate database
2. Commit database file to Git
3. Redeploy

## Performance Optimization

### 1. Enable Caching

Add caching headers in `backend/api/routes.py`:

```python
from fastapi.responses import JSONResponse

@app.get("/api/stats")
async def get_stats():
    stats = query_national_stats()
    return JSONResponse(
        content=stats,
        headers={"Cache-Control": "public, max-age=3600"}  # Cache for 1 hour
    )
```

### 2. Optimize Database Queries

Ensure indexes are created (already done in `database/db.py`):

```sql
CREATE INDEX idx_province ON deforestation_alerts(province);
CREATE INDEX idx_detected_at ON deforestation_alerts(detected_at);
CREATE INDEX idx_severity ON deforestation_alerts(severity);
```

### 3. Compress Images

Thumbnails are already compressed (JPEG quality=85), but you can further optimize:

```bash
# Install imagemagick
# Then compress all thumbnails
mogrify -quality 75 outputs/thumbnails/*.jpg
```

## Monitoring

### Vercel Analytics

Enable Vercel Analytics in dashboard:
1. Go to Analytics tab
2. Enable Web Analytics
3. View traffic and performance metrics

### Error Tracking

Check Vercel function logs:
1. Go to Deployments
2. Click on latest deployment
3. View Function Logs

### Custom Monitoring

Add logging to track API usage:

```python
import logging

logger = logging.getLogger(__name__)

@app.get("/api/alerts")
async def get_alerts(...):
    logger.info(f"Alerts requested with filters: {filters}")
    ...
```

## Security Considerations

### 1. Add Rate Limiting

For production, add rate limiting:

```bash
pip install slowapi
```

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/alerts")
@limiter.limit("100/minute")
async def get_alerts(...):
    ...
```

### 2. Add API Key Authentication

For sensitive deployments:

```python
from fastapi import Security, HTTPException
from fastapi.security import APIKeyHeader

API_KEY = os.getenv("API_KEY")
api_key_header = APIKeyHeader(name="X-API-Key")

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

@app.get("/api/alerts")
async def get_alerts(..., api_key: str = Depends(verify_api_key)):
    ...
```

### 3. Enable HTTPS Only

Vercel automatically provides HTTPS, but ensure you're not allowing HTTP:

```python
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

if os.getenv("ENVIRONMENT") == "production":
    app.add_middleware(HTTPSRedirectMiddleware)
```

## Cost Considerations

### Vercel Free Tier Limits

- 100 GB bandwidth per month
- 100 GB-hours serverless function execution
- 6,000 build minutes per month

For MataBumi:
- Static assets (thumbnails, frontend): ~100 MB
- Database: ~10 MB
- API calls: Minimal compute time

**Estimated usage:** Well within free tier for moderate traffic.

### Scaling Beyond Free Tier

If you exceed free tier:
1. Upgrade to Vercel Pro ($20/month)
2. Or migrate to alternative hosting:
   - AWS Lambda + S3 + CloudFront
   - Google Cloud Run + Cloud Storage
   - Azure Functions + Blob Storage

## Backup and Recovery

### Backup Database

Regularly backup the database:

```bash
# Local backup
cp backend/database/matabumi.db backend/database/matabumi_backup_$(date +%Y%m%d).db

# Upload to cloud storage
# Example with AWS S3
aws s3 cp backend/database/matabumi.db s3://your-bucket/backups/matabumi_$(date +%Y%m%d).db
```

### Restore from Backup

```bash
# Restore from backup
cp backend/database/matabumi_backup_20260515.db backend/database/matabumi.db

# Commit and redeploy
git add backend/database/matabumi.db
git commit -m "Restore database from backup"
git push
```

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys on every push to main branch.

### Preview Deployments

Vercel creates preview deployments for pull requests:
1. Create a feature branch
2. Push changes
3. Open pull request
4. Vercel creates preview URL
5. Test changes before merging

### Production Deployments

Only deploy to production when ready:

```bash
# Deploy to preview first
git push origin feature-branch

# After testing, merge to main
git checkout main
git merge feature-branch
git push origin main
```

## Support

For deployment issues:
- Check Vercel documentation: https://vercel.com/docs
- Review Vercel function logs
- Open an issue on GitHub

---

**Happy Deploying!** 🚀
