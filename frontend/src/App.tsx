import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Menu, X, BarChart3, Table2, Sun, Moon } from 'lucide-react';
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
import { translations } from './i18n';
import type { Alert, Cause, Filters, Language, NationalStats, ProvinceStats, Severity, TrendPoint } from './types';

const initialFilters: Filters = {
  province: '',
  severities: ['critical', 'high', 'moderate', 'low'] as Severity[],
  causes: ['logging', 'plantation', 'mining', 'fire', 'unknown'] as Cause[],
  startDate: '',
  endDate: '',
};

type ViewMode = 'map' | 'table';
type Theme = 'dark' | 'light';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('matabumi-theme');
    return (saved as Theme) || 'dark';
  });
  
  const t = translations[language];

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(theme);
    localStorage.setItem('matabumi-theme', theme);
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
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
          if (selectedAlert && !alertData.some((alert) => alert.id === selectedAlert.id)) {
            setSelectedAlert(null);
          }
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const filteredAlerts = useMemo(
    () =>
      alerts.filter(
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
    <div className="relative h-screen w-screen overflow-hidden bg-forest-dark">
      {/* Header */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        theme={theme}
        onThemeToggle={toggleTheme}
        loading={loading}
      />

      {/* Error Banner */}
      {error && (
        <div className="absolute left-1/2 top-20 z-50 flex max-w-md -translate-x-1/2 items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 backdrop-blur-xl">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* KPI Cards - Floating at top center */}
      <KPICards stats={stats} language={language} />

      {/* Main Content Area */}
      <div className="relative h-[calc(100vh-64px)]">
        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute left-4 top-4 z-40 rounded-lg bg-glass-surface p-2 text-mist-white backdrop-blur-xl transition-all hover:bg-glass-surface/80"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* View Mode Toggle */}
        <div className="absolute right-4 top-4 z-40 flex gap-1 rounded-lg bg-glass-surface p-1 backdrop-blur-xl">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all ${
              viewMode === 'map'
                ? 'bg-canopy-green text-white'
                : 'text-mist-white/70 hover:text-mist-white'
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Map View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all ${
              viewMode === 'table'
                ? 'bg-canopy-green text-white'
                : 'text-mist-white/70 hover:text-mist-white'
            }`}
          >
            <Table2 size={16} />
            Data Table
          </button>
        </div>

        {/* Floating Sidebar */}
        <div
          className={`absolute left-4 top-16 z-30 h-[calc(100vh-144px)] w-80 transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)]'
          }`}
        >
          <div className="h-full overflow-hidden rounded-xl bg-glass-surface backdrop-blur-xl">
            <Sidebar
              filters={filters}
              language={language}
              stats={stats}
              provinceStats={provinceStats}
              onFilterChange={setFilters}
            />
          </div>
        </div>

        {/* Main View - Map or Table */}
        {viewMode === 'map' ? (
          <div className="h-full w-full">
            <DeforestationMap
              alerts={filteredAlerts}
              selectedProvince={filters.province}
              language={language}
              onSelectAlert={setSelectedAlert}
              theme={theme}
            />
          </div>
        ) : (
          <DataTableView
            alerts={filteredAlerts}
            language={language}
            onSelectAlert={setSelectedAlert}
          />
        )}

        {/* Right Detail Drawer - Slides in when alert selected */}
        <div
          className={`absolute right-0 top-0 z-30 h-full w-96 transform transition-transform duration-300 ${
            selectedAlert ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="h-full overflow-y-auto bg-glass-surface p-6 backdrop-blur-xl">
            <EventCard
              alert={selectedAlert}
              language={language}
              onClose={() => setSelectedAlert(null)}
            />
            {selectedAlert && (
              <div className="mt-6">
                <ImpactCalculator
                  totalArea={stats?.total_area_ha ?? 0}
                  language={language}
                />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Analytics Drawer */}
        <AnalyticsDrawer
          isOpen={analyticsOpen}
          onToggle={() => setAnalyticsOpen(!analyticsOpen)}
          trends={trends}
          stats={stats}
          alerts={filteredAlerts}
          language={language}
        />
      </div>
    </div>
  );
}
