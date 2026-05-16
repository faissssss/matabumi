# MataBumi Dashboard - Components & Layout Overview

## 🎨 Current Layout Architecture

The MataBumi dashboard uses a **modern, layered glassmorphism design** with a dark forest theme. The layout is fully responsive and features floating panels with backdrop blur effects.

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                        HEADER (64px)                         │
│  Logo | Navigation | Search | Theme | Language Toggle       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    KPI CARDS (Floating)                      │
│   Total Area | Total Alerts | Critical | Protected Zones    │
└─────────────────────────────────────────────────────────────┘
┌──────────────┬──────────────────────────┬──────────────────┐
│   SIDEBAR    │                          │  EVENT DETAIL    │
│  (Floating)  │      MAIN VIEW           │   (Slide-in)     │
│              │   (Map or Table)         │                  │
│  - Filters   │                          │  - Alert Info    │
│  - Province  │   Toggle: Map/Table      │  - Thumbnail     │
│  - Severity  │                          │  - NDVI Data     │
│  - Cause     │                          │  - Impact Calc   │
│  - Date      │                          │                  │
│              │                          │                  │
└──────────────┴──────────────────────────┴──────────────────┘
┌─────────────────────────────────────────────────────────────┐
│              ANALYTICS DRAWER (Slide-up)                     │
│         Trend Charts | Cause Distribution                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 All Components

### **Core Layout Components**

#### 1. **App.tsx** (Main Container)
- **Purpose**: Root component orchestrating the entire dashboard
- **State Management**: 
  - Filters, alerts, stats, trends
  - View mode (map/table)
  - Theme (dark/light)
  - Sidebar/drawer visibility
  - Selected alert
- **Key Features**:
  - Data fetching from API
  - Filter synchronization
  - View mode switching
  - Theme persistence

#### 2. **Header.tsx**
- **Location**: Top bar (64px height)
- **Elements**:
  - Logo and brand name
  - Navigation links (Dashboard, Data, Methodology, About)
  - Search button
  - Loading indicator
  - Theme toggle (Sun/Moon icon)
  - Language toggle
- **Styling**: Glass surface with backdrop blur

#### 3. **Sidebar.tsx** (Filters Panel)
- **Location**: Left side, floating (384px width)
- **State**: Collapsible with toggle button
- **Sections**:
  - **Province Filter**: Searchable dropdown
  - **Severity Filter**: Collapsible checkboxes (Critical, High, Moderate, Low)
  - **Cause Filter**: Collapsible checkboxes (Logging, Plantation, Mining, Fire, Unknown)
  - **Date Range**: Start/End date pickers
  - **Reset Button**: Clear all filters
- **Features**:
  - Real-time badge counts for each filter option
  - Smooth collapse/expand animations
  - Province search functionality
  - Scroll area for long lists

---

### **Data Visualization Components**

#### 4. **KPICards.tsx**
- **Location**: Top center, floating below header
- **Cards** (4 total):
  1. **Total Area**: Hectares deforested (Orange)
  2. **Total Alerts**: Number of incidents (Yellow)
  3. **Critical Alerts**: High-priority events (Orange)
  4. **Protected Zones**: Breaches in protected areas (Green)
- **Features**:
  - Animated entrance (stagger effect)
  - Hover scale effect
  - Icon indicators
  - Color-coded by severity

#### 5. **Map.tsx** (Interactive Map)
- **Library**: React Leaflet
- **Base Layers** (6 options):
  - Dark (default for dark theme)
  - Dark Satellite
  - Light (default for light theme)
  - Street
  - Terrain
- **Features**:
  - Color-coded markers by severity
  - Hover scale animation on markers
  - Click to view alert details
  - Province focus/zoom
  - Reset view button
  - Layer control
  - Popup previews
- **Marker Colors**:
  - Critical: `#EA580C` (Orange)
  - High: `#f2994a` (Orange-yellow)
  - Moderate: `#f2c94c` (Yellow)
  - Low: `#2f9e44` (Green)

#### 6. **DataTableView.tsx** (Alternative to Map)
- **Purpose**: Tabular view of all alerts
- **Features**:
  - Search by province or cause
  - Sortable columns (Date, Province, Area, Cause, Severity)
  - Export to CSV
  - Click row to view details
  - Responsive pagination
- **Columns**:
  - Date
  - Province
  - Area (ha)
  - Cause (badge)
  - Severity (color-coded badge)
  - Confidence (%)
  - Actions (View Details button)

#### 7. **TrendChart.tsx**
- **Library**: Recharts
- **Charts** (2):
  1. **Line Chart**: Monthly deforestation area trends
  2. **Bar Chart**: Deforestation by cause distribution
- **Styling**: Dark theme with custom tooltips

#### 8. **AnalyticsDrawer.tsx**
- **Location**: Bottom of screen, slide-up drawer
- **Height**: 400px when open
- **Contents**:
  - Trend charts
  - Export data button
  - Analytics summary
- **Interaction**: Toggle handle to show/hide

---

### **Detail & Interaction Components**

#### 9. **EventCard.tsx** (Alert Details)
- **Location**: Right side, slide-in panel (420px width)
- **Sections**:
  - **Header**: Province name, date, severity badge, close button
  - **Thumbnail**: Satellite imagery (if available)
  - **Key Metrics Grid**:
    - Area (hectares)
    - Confidence (%)
  - **Cause**: Badge with classification
  - **Coordinates**: Lat/Lng with map pin icon
  - **NDVI Analysis**: Before/After/Change values
  - **Protected Zone Badge**: If applicable
- **Features**:
  - Smooth slide-in animation
  - Color-coded severity badges
  - Gradient overlays on images

#### 10. **ImpactCalculator.tsx**
- **Location**: Below EventCard in detail panel
- **Purpose**: Calculate potential impact of prevention
- **Interactive Element**: Slider (0-100% reduction)
- **Calculated Metrics** (4):
  1. **Hectares Saved**: Based on reduction %
  2. **CO₂ Avoided**: Tons of carbon (150t/ha × 3.67)
  3. **Economic Value**: USD value ($15/ton CO₂)
  4. **Football Fields**: Visual comparison (1 field = 0.714 ha)
- **Formula**: 
  - CO₂ = hectares × 150 × 3.67
  - Value = CO₂ × $15

---

### **UI Utility Components** (Shadcn/UI)

Located in `frontend/src/components/ui/`:

#### 11. **badge.tsx**
- Severity indicators
- Cause labels
- Status tags

#### 12. **button.tsx**
- Primary actions
- Icon buttons
- Variants: default, outline, ghost

#### 13. **card.tsx**
- Container for grouped content
- Header, content, footer sections

#### 14. **checkbox.tsx**
- Filter selections
- Multi-select options

#### 15. **scroll-area.tsx**
- Sidebar scrolling
- Long lists

#### 16. **select.tsx**
- Province dropdown
- Filter options

#### 17. **separator.tsx**
- Visual dividers
- Section breaks

#### 18. **sheet.tsx**
- Slide-in panels
- Drawer components

#### 19. **slider.tsx**
- Impact calculator
- Range inputs

#### 20. **switch.tsx**
- Toggle controls
- Boolean settings

---

### **Supporting Components**

#### 21. **LanguageToggle.tsx**
- **Languages**: Indonesian (ID) / English (EN)
- **Style**: Segmented control
- **Location**: Header right side

---

## 🎨 Design System

### **Color Palette**

```css
/* Primary Colors */
--forest-dark: #0D1F15      /* Background */
--canopy-green: #1A4D2E     /* Primary actions */
--mist-white: #F0F4F1       /* Text */

/* Alert Colors */
--alert-orange: #EA580C     /* Critical severity */
--yellow-400: #f2c94c       /* Moderate severity */
--green-400: #2f9e44        /* Low severity */

/* Glass Effect */
--glass-surface: rgba(13, 31, 21, 0.8)  /* Backdrop */
--border: rgba(255, 255, 255, 0.1)      /* Borders */
```

### **Typography**
- **Font**: Geist Variable (sans-serif)
- **Sizes**: 
  - Headers: 2xl (24px), xl (20px), lg (18px)
  - Body: base (16px), sm (14px), xs (12px)
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### **Spacing**
- **Base unit**: 4px (0.25rem)
- **Common gaps**: 2, 3, 4, 6 (8px, 12px, 16px, 24px)

### **Effects**
- **Backdrop Blur**: `backdrop-blur-xl` (24px)
- **Shadows**: `shadow-lg`, `shadow-2xl`
- **Transitions**: 200-300ms ease-in-out
- **Border Radius**: 
  - Small: 8px (rounded-lg)
  - Large: 12px (rounded-xl)

---

## 🔄 View Modes

### **1. Map View** (Default)
- Interactive Leaflet map
- Color-coded markers
- Multiple base layers
- Province zoom
- Marker clustering (implicit)

### **2. Table View**
- Sortable data table
- Search functionality
- CSV export
- Pagination
- Row selection

---

## 📱 Responsive Behavior

### **Desktop (>1024px)**
- Full layout with all panels
- Sidebar: 384px fixed width
- Detail panel: 420px fixed width
- Map/Table: Fluid center area

### **Tablet (768px - 1024px)**
- Sidebar collapses by default
- Detail panel overlays map
- KPI cards stack 2×2

### **Mobile (<768px)**
- Single column layout
- Sidebar becomes full-screen overlay
- KPI cards stack vertically
- Map controls simplified

---

## 🎭 Animations

### **Framer Motion Effects**

1. **KPI Cards**: Stagger entrance, hover scale
2. **Sidebar**: Slide in/out from left
3. **Detail Panel**: Slide in/out from right
4. **Analytics Drawer**: Slide up/down from bottom
5. **Filters**: Collapse/expand with height animation
6. **Map Markers**: Hover scale transform

---

## 🔌 Data Flow

```
API (FastAPI Backend)
    ↓
api.ts (Fetch functions)
    ↓
App.tsx (State management)
    ↓
├─→ Sidebar (Filters)
├─→ Map/Table (Display)
├─→ EventCard (Details)
├─→ KPICards (Stats)
└─→ TrendChart (Analytics)
```

---

## 🌐 Internationalization (i18n)

**Supported Languages**: Indonesian (ID), English (EN)

**Translation Keys** (in `i18n.ts`):
- UI labels (filters, buttons, headers)
- Severity levels
- Cause types
- Metric units
- Error messages

---

## 🎯 Key Features Summary

✅ **Interactive Map** with 6 base layers  
✅ **Data Table View** with search & export  
✅ **Advanced Filters** (Province, Severity, Cause, Date)  
✅ **Real-time KPIs** with animated cards  
✅ **Alert Details** with satellite imagery  
✅ **Impact Calculator** with CO₂ & economic estimates  
✅ **Trend Analytics** with charts  
✅ **Dark/Light Theme** toggle  
✅ **Bilingual Support** (ID/EN)  
✅ **Responsive Design** for all devices  
✅ **Smooth Animations** with Framer Motion  
✅ **Glassmorphism UI** with backdrop blur  

---

## 📊 Component Hierarchy

```
App
├── Header
│   ├── LanguageToggle
│   └── Theme Toggle
├── KPICards
├── Sidebar
│   ├── Province Filter (with Search)
│   ├── Severity Filter (Collapsible)
│   ├── Cause Filter (Collapsible)
│   ├── Date Range Filter
│   └── Reset Button
├── Main View (Conditional)
│   ├── Map (if viewMode === 'map')
│   │   ├── TileLayer (6 options)
│   │   ├── Markers
│   │   └── Popups
│   └── DataTableView (if viewMode === 'table')
│       ├── Search
│       ├── Sort Controls
│       └── Export Button
├── EventCard (Slide-in)
│   ├── Alert Details
│   ├── Satellite Thumbnail
│   ├── NDVI Analysis
│   └── ImpactCalculator
└── AnalyticsDrawer (Slide-up)
    └── TrendChart
        ├── Line Chart (Monthly trends)
        └── Bar Chart (Cause distribution)
```

---

## 🛠️ Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Custom theme
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **Maps**: React Leaflet + Leaflet
- **Charts**: Recharts
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **Icons**: Lucide React

---

## 📝 File Structure

```
frontend/src/
├── components/
│   ├── ui/              # Reusable UI primitives
│   ├── AnalyticsDrawer.tsx
│   ├── DataTableView.tsx
│   ├── EventCard.tsx
│   ├── Header.tsx
│   ├── ImpactCalculator.tsx
│   ├── KPICards.tsx
│   ├── LanguageToggle.tsx
│   ├── Map.tsx
│   ├── Sidebar.tsx
│   └── TrendChart.tsx
├── data/
│   └── provinces.ts     # Province list & coordinates
├── lib/
│   └── utils.ts         # Utility functions
├── api.ts               # API client
├── App.tsx              # Main component
├── i18n.ts              # Translations
├── types.ts             # TypeScript types
├── styles.css           # Global styles
└── main.tsx             # Entry point
```

---

**Last Updated**: May 15, 2026  
**Dashboard Version**: 0.1.0  
**Status**: ✅ Fully Functional
