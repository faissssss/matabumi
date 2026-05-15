# MataBumi Quick Start Guide

**Welcome to MataBumi!** 🌳

This guide will get you up and running in 5 minutes.

---

## What is MataBumi?

MataBumi is a **forest transparency dashboard** for Indonesia that:
- 🛰️ Detects deforestation using satellite imagery
- 📊 Visualizes forest loss across 38 provinces
- 🗺️ Shows alerts on an interactive map
- 📈 Tracks trends over time
- 🌍 Provides bilingual support (Indonesian/English)

---

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
pip install -r requirements.txt
```

### 2. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload
```
✅ Backend running at http://127.0.0.1:8000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
✅ Frontend running at http://127.0.0.1:5173

### 3. Open Dashboard

Open your browser and go to:
```
http://127.0.0.1:5173
```

🎉 **You're done!** The dashboard should now be running.

---

## Dashboard Overview

### Main Features

#### 1. **Interactive Map** 🗺️
- View deforestation alerts across Indonesia
- Click markers to see details
- Switch between map layers
- Zoom and pan to explore

#### 2. **Left Sidebar (Filters)** 🔍
- **Toggle:** Click the menu icon (☰) to open/close
- **Province:** Filter by specific province
- **Severity:** Filter by alert severity (critical/high/moderate/low)
- **Cause:** Filter by deforestation cause (logging/plantation/mining/fire)
- **Date Range:** Filter by detection date
- **Reset:** Clear all filters

#### 3. **Right Detail Panel** 📋
- **Opens:** When you click an alert marker
- **Shows:**
  - Satellite thumbnail
  - Province and date
  - Area lost (hectares)
  - Cause and confidence
  - NDVI analysis
  - Coordinates
- **Close:** Click the X button

#### 4. **KPI Cards** 📊
- **Total Area:** Total hectares lost
- **Total Alerts:** Number of deforestation events
- **Critical Alerts:** High-severity events
- **Protected Zones:** Alerts in protected areas

#### 5. **View Modes** 👁️
- **Map View:** Interactive map (default)
- **Data Table:** Tabular view of alerts

#### 6. **Theme Toggle** 🌓
- **Dark Mode:** Default (forest theme)
- **Light Mode:** Click sun/moon icon to switch

#### 7. **Language Toggle** 🌐
- **Indonesian (ID):** Default
- **English (EN):** Click flag to switch

---

## Using the Dashboard

### Scenario 1: Find Alerts in a Specific Province

1. Click the **menu icon (☰)** to open the sidebar
2. Click the **Province dropdown**
3. Select a province (e.g., "Aceh")
4. View filtered alerts on the map
5. Click a marker to see details

### Scenario 2: View Only Critical Alerts

1. Open the sidebar
2. Scroll to **Severity** section
3. Uncheck "low", "moderate", and "high"
4. Keep only "critical" checked
5. Map shows only critical alerts

### Scenario 3: Analyze Deforestation Trends

1. Click the **Analytics** button at the bottom
2. View trend charts
3. See monthly area lost
4. Compare provinces

### Scenario 4: Export Alert Data

1. Switch to **Data Table** view
2. View all alerts in tabular format
3. Copy data or take screenshots

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close detail panel |
| `Tab` | Navigate between elements |
| `Enter` | Activate focused element |
| `Space` | Toggle checkboxes |

---

## Understanding the Data

### Alert Severity

| Severity | Color | Criteria |
|----------|-------|----------|
| 🔴 **Critical** | Red | Score ≥ 80 or protected zone |
| 🟠 **High** | Orange | Score 60-79 |
| 🟡 **Moderate** | Yellow | Score 35-59 |
| 🟢 **Low** | Green | Score < 35 |

### Deforestation Causes

| Cause | Description |
|-------|-------------|
| 🪓 **Logging** | Timber extraction |
| 🌴 **Plantation** | Agricultural clearing (palm oil, etc.) |
| ⛏️ **Mining** | Mineral extraction |
| 🔥 **Fire** | Forest fires |
| ❓ **Unknown** | Cause not determined |

### NDVI (Vegetation Index)

- **Before:** Vegetation density before deforestation
- **After:** Vegetation density after deforestation
- **Change:** Difference (higher = more loss)

**Scale:**
- `+1.0` = Dense healthy forest
- `0.0` = Bare soil, cleared land
- `-1.0` = Water bodies

---

## Common Questions

### Q: Why are there only 9 alerts?

**A:** The system uses a minimum threshold of 10 hectares to reduce noise. Only significant deforestation events are shown. This is intentional to focus on quality over quantity.

### Q: Why do many alerts show "unknown" cause?

**A:** The classifier is rule-based and conservative. It only assigns a cause when confident. Improving the classifier is a priority for future updates.

### Q: How often is data updated?

**A:** The detection pipeline runs monthly. Satellite imagery is from Sentinel-2, which passes every 5 days.

### Q: Can I download the data?

**A:** Currently, you can view data in the table view and copy it. Export functionality is planned for a future update.

### Q: Is this real-time?

**A:** No, there's a delay of 0-30 days depending on when the pipeline last ran. Sentinel-2 imagery itself has a 5-day revisit time.

### Q: What's the accuracy?

**A:** NDVI change detection is >80% accurate. Cause classification is 60-85% confident (conservative estimates).

---

## Troubleshooting

### Dashboard won't load

**Check:**
1. Backend is running (http://127.0.0.1:8000)
2. Frontend is running (http://127.0.0.1:5173)
3. No firewall blocking ports
4. Browser console for errors (F12)

### Map is blank

**Check:**
1. Internet connection (map tiles load from internet)
2. Browser console for errors
3. Try refreshing the page (Ctrl+R)

### No alerts showing

**Check:**
1. Filters are not too restrictive
2. Click "Reset Filters" button
3. Check backend has data (http://127.0.0.1:8000/api/alerts)

### Sidebar won't open

**Check:**
1. Click the menu icon (☰) in top-left
2. Try refreshing the page
3. Check browser console for errors

---

## Next Steps

### For Users
1. ✅ Explore the dashboard
2. ✅ Try different filters
3. ✅ Switch between themes
4. ✅ View alerts in your province
5. ✅ Share insights with others

### For Developers
1. 📖 Read `DEVELOPER_GUIDE.md`
2. 🧪 Run tests: `npm run test`
3. 🏗️ Build: `npm run build`
4. 📚 Check `plans/matabumi_prd.md` for full specs
5. 🚀 Deploy to Vercel

### For Contributors
1. 🐛 Report bugs on GitHub
2. 💡 Suggest features
3. 🔧 Submit pull requests
4. 📝 Improve documentation
5. 🌍 Add translations

---

## Useful Links

### Documentation
- **PRD:** `plans/matabumi_prd.md`
- **Architecture:** `plans/matabumi_architecture.md`
- **Developer Guide:** `DEVELOPER_GUIDE.md`
- **UI Redesign:** `UI_REDESIGN_COMPLETE.md`

### API Endpoints
- **Alerts:** http://127.0.0.1:8000/api/alerts
- **Stats:** http://127.0.0.1:8000/api/stats
- **Provinces:** http://127.0.0.1:8000/api/provinces
- **Trends:** http://127.0.0.1:8000/api/trends
- **API Docs:** http://127.0.0.1:8000/docs

### External Resources
- [Sentinel-2 Imagery](https://planetarycomputer.microsoft.com)
- [Global Forest Watch](https://www.globalforestwatch.org)
- [Indonesia Forest Data](https://www.mongabay.co.id)

---

## Tips & Tricks

### 💡 Pro Tips

1. **Collapsible Sidebar**
   - Close the sidebar to see more of the map
   - Useful when exploring specific regions

2. **Color-Coded Markers**
   - Red = Critical (immediate attention)
   - Orange = High (important)
   - Yellow = Moderate (monitor)
   - Green = Low (informational)

3. **NDVI Analysis**
   - Green "Before" value = healthy forest
   - Red "After" value = cleared land
   - Orange "Change" = amount of loss

4. **Protected Zones**
   - Alerts with 🛡️ badge are in protected areas
   - These are automatically marked as critical

5. **Theme Switching**
   - Dark mode = better for night viewing
   - Light mode = better for presentations

6. **Language Toggle**
   - Switch to English for international audiences
   - Indonesian is default for local users

---

## Getting Help

### Need Support?

1. **Check Documentation**
   - Read this guide
   - Check `DEVELOPER_GUIDE.md`
   - Review `UI_REDESIGN_COMPLETE.md`

2. **Search Issues**
   - Check GitHub issues
   - Look for similar problems

3. **Ask Questions**
   - Create a GitHub issue
   - Provide details:
     - What you tried
     - What happened
     - What you expected
     - Screenshots (if applicable)

4. **Report Bugs**
   - Use GitHub issue template
   - Include:
     - Steps to reproduce
     - Browser and OS
     - Console errors
     - Screenshots

---

## Feedback

We'd love to hear from you!

### What's Working Well?
- Tell us what you like
- Share success stories
- Suggest improvements

### What Could Be Better?
- Report bugs
- Request features
- Suggest UI improvements

### How to Provide Feedback
1. GitHub Issues (preferred)
2. Email (if provided)
3. Pull Requests (for code changes)

---

## What's Next?

### Upcoming Features (Roadmap)

#### Phase 2 (Q3 2026)
- 📱 Mobile optimization
- 📊 Enhanced analytics
- 📥 Data export (CSV, JSON)
- 🔔 Email alerts
- 🎯 Predictive analytics

#### Phase 3 (Q4 2026)
- 🤖 Machine learning classifier
- 🛰️ Higher resolution imagery
- ⚡ Real-time alerts
- 🌐 API for third parties
- 📈 Historical comparison

#### Phase 4 (2027)
- 🌍 Regional expansion
- 🤝 NGO integrations
- 💰 Carbon credit marketplace
- 📱 Mobile app
- 🔗 Blockchain verification

---

## Success Stories

### Example Use Cases

1. **NGO Monitoring**
   - Track deforestation in target areas
   - Generate reports for donors
   - Plan intervention strategies

2. **Journalism**
   - Investigate illegal logging
   - Report on environmental issues
   - Provide data-driven stories

3. **Government**
   - Monitor protected areas
   - Enforce regulations
   - Plan conservation efforts

4. **Research**
   - Study deforestation patterns
   - Analyze causes and trends
   - Publish findings

5. **Education**
   - Teach about deforestation
   - Show real-world data
   - Engage students

---

## Thank You! 🙏

Thank you for using MataBumi! Together, we can make Indonesia's forests more transparent and accountable.

**Remember:** You cannot hold anyone accountable for something the public cannot see. MataBumi makes deforestation visible to everyone.

---

**Questions?** Check `DEVELOPER_GUIDE.md` or create a GitHub issue.

**Want to contribute?** Read `DEVELOPER_GUIDE.md` and submit a PR.

**Found a bug?** Report it on GitHub with details.

---

**Last Updated:** May 15, 2026  
**Version:** 2.0  
**Status:** ✅ Production Ready

**Happy Exploring! 🌳🗺️📊**
