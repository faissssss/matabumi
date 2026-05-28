import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Menu, X, BarChart3, Table2, Sun, Moon, MapPin, ChevronUp, ChevronDown, Download } from 'lucide-react';
import { fetchAlerts, fetchProvinceStats, fetchStats, fetchTrends } from './api';
import EventCard from './components/EventCard';
import ImpactCalculator from './components/ImpactCalculator';
import LanguageToggle from './components/LanguageToggle';
import DeforestationMap from './components/Map';
import Sidebar from './components/Sidebar';
import TrendChart from './components/TrendChart';
import KPICards from './components/KPICards';
import Header from './components/Header';
import AnalyticsDrawer from './components/AnalyticsDrawer';
import DataTableView from './components/DataTableView';
import AboutPage from './components/AboutPage';
import DocumentationPage from './components/docs/DocumentationPage';
import EmptyState from './components/EmptyState';
import { translations } from './i18n';
import type { Alert, Cause, Filters, Language, NationalStats, ProvinceStats, Severity, TrendPoint } from './types';

const initialFilters: Filters = {
  province: '',
  severities: ['critical', 'high', 'moderate', 'low'] as Severity[],
  causes: ['logging', 'plantation', 'mining', 'fire', 'unknown'] as Cause[],
  startDate: '',
  endDate: '',
};

type ViewMode = 'map' | 'table' | 'analytics';
type Theme = 'dark' | 'light';
type PageView = 'dashboard' | 'about' | 'docs';

function getInitialPageView(): PageView {
  if (typeof window === 'undefined') return 'dashboard';
  if (window.location.pathname === '/about') return 'about';
  if (window.location.pathname === '/docs') return 'docs';
  return 'dashboard';
}

function getPathForView(view: PageView): string {
  if (view === 'about') return '/about';
  if (view === 'docs') return '/docs';
  return '/';
}

export default function App() {
  const [language, setLanguage] = useState<Language>('id');
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<NationalStats | null>(null);
  const [provinceStats, setProvinceStats] = useState<ProvinceStats[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasBackend, setHasBackend] = useState(false); // Default to false to avoid issues
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [currentView, setCurrentView] = useState<PageView>(getInitialPageView);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('matabumi-theme');
      return (saved as Theme) || 'dark';
    } catch {
      return 'dark';
    }
  });
  
  const t = translations[language];

  // Apply theme to document
  useEffect(() => {
    try {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
      localStorage.setItem('matabumi-theme', theme);
    } catch (e) {
      console.warn('Failed to apply theme:', e);
    }
  }, [theme]);

  useEffect(() => {
    const onPopState = () => setCurrentView(getInitialPageView());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const handleViewChange = (view: PageView) => {
    setCurrentView(view);
    const path = getPathForView(view);
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (currentView !== 'dashboard') {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [alertData, statData, provinceData, trendData] = await Promise.all([
          fetchAlerts(filters),
          fetchStats(),
          fetchProvinceStats(),
          fetchTrends(filters.province),
        ]);
        if (!cancelled) {
          setAlerts(alertData);
          setStats(statData);
          setProvinceStats(provinceData);
          setTrends(trendData);
          
          // Check if we have backend data
          const hasData = alertData.length > 0 || statData.total_events > 0 || provinceData.length > 0;
          setHasBackend(hasData);
          
          if (selectedAlert && !alertData.some((alert) => alert.id === selectedAlert.id)) {
            setSelectedAlert(null);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error('Failed to load dashboard data:', loadError);
          setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data');
          setHasBackend(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filters, currentView]);

  const filteredAlerts = useMemo(
    () =>
      (Array.isArray(alerts) ? alerts : []).filter(
        (alert) =>
          filters.severities.includes(alert.severity) &&
          filters.causes.includes(alert.cause),
      ),
    [alerts, filters.causes, filters.severities],
  );

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* Header - Always visible */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeToggle={toggleTheme}
        loading={loading}
        currentView={currentView}
        onViewChange={handleViewChange}
      />

      {/* Conditional Content - Dashboard, About, or Docs Page */}
      {currentView === 'about' ? (
        <AboutPage language={language} />
      ) : currentView === 'docs' ? (
        <DocumentationPage
          language={language}
          theme={theme}
          onBackToDashboard={() => handleViewChange('dashboard')}
        />
      ) : (
        <>
          {/* Error Banner */}
          {error && (
            <div className="absolute left-1/2 top-20 z-50 flex max-w-md -translate-x-1/2 items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive backdrop-blur-xl">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          {/* Main Content Grid */}
          <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left Sidebar - Filters */}
        <div className="w-80 flex-shrink-0">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl backdrop-blur-xl">
            <Sidebar
              filters={filters}
              language={language}
              stats={stats}
              provinceStats={provinceStats}
              onFilterChange={setFilters}
            />
          </div>
        </div>

        {/* Center - Map or Table or Analytics with KPI Cards */}
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          {/* View Mode Toggle - 3 tabs - CENTERED */}
          <div className="flex items-center justify-center">
            <div className="flex gap-1 rounded-lg border border-border bg-card p-1 shadow-lg backdrop-blur-xl">
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  viewMode === 'map'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {t.mapView}
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Table2 size={16} />
                {t.dataTable}
              </button>
              <button
                onClick={() => setViewMode('analytics')}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  viewMode === 'analytics'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <BarChart3 size={16} />
                {t.analytics}
              </button>
            </div>
          </div>

          {/* Main View - Map, Table, or Analytics */}
          <div className="flex-1 overflow-hidden rounded-xl border border-border shadow-2xl">
            {/* Map is always mounted to prevent Leaflet re-init issues; hidden via CSS when not active */}
            <div className={viewMode === 'map' ? 'h-full' : 'hidden'}>
              {filteredAlerts.length > 0 ? (
                <DeforestationMap
                  alerts={filteredAlerts}
                  selectedProvince={filters.province}
                  language={language}
                  onSelectAlert={setSelectedAlert}
                  theme={theme}
                  isVisible={viewMode === 'map'}
                />
              ) : (
                <EmptyState
                  language={language}
                  type={hasBackend ? 'no-data' : 'no-backend'}
                />
              )}
            </div>
            {viewMode === 'table' && (
              <>
                {filteredAlerts.length > 0 ? (
                  <DataTableView
                    alerts={filteredAlerts}
                    language={language}
                    onSelectAlert={setSelectedAlert}
                  />
                ) : (
                  <EmptyState 
                    language={language} 
                    type={hasBackend ? 'no-data' : 'no-backend'}
                  />
                )}
              </>
            )}
            {viewMode === 'analytics' && (
              <div className="flex h-full flex-col gap-4 overflow-auto bg-background p-6">
                {/* KPI Cards Row - Inside Analytics View */}
                <div className="flex-shrink-0">
                  <KPICards stats={stats} language={language} />
                </div>
                {filteredAlerts.length > 0 || trends.length > 0 ? (
                  <TrendChart
                    trends={trends}
                    stats={stats}
                    alerts={filteredAlerts}
                    language={language}
                  />
                ) : (
                  <EmptyState 
                    language={language} 
                    type={hasBackend ? 'no-data' : 'no-backend'}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Event Detail */}
        <div className="w-96 flex-shrink-0">
          <div className="h-full overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl backdrop-blur-xl">
            {selectedAlert ? (
              <>
                <EventCard
                  alert={selectedAlert}
                  language={language}
                  onClose={() => setSelectedAlert(null)}
                />
                <div className="mt-6">
                  <ImpactCalculator
                    totalArea={stats?.total_area_ha ?? 0}
                    language={language}
                  />
                </div>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MapPin className="mb-4 text-muted-foreground/20" size={64} />
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {t.noEvent || 'No Event Selected'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Click on a marker on the map to view details
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
