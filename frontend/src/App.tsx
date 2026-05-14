import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { fetchAlerts, fetchProvinceStats, fetchStats, fetchTrends } from './api';
import EventCard from './components/EventCard';
import ImpactCalculator from './components/ImpactCalculator';
import LanguageToggle from './components/LanguageToggle';
import DeforestationMap from './components/Map';
import Sidebar from './components/Sidebar';
import TrendChart from './components/TrendChart';
import { translations } from './i18n';
import type { Alert, Cause, Filters, Language, NationalStats, ProvinceStats, Severity, TrendPoint } from './types';

const initialFilters: Filters = {
  province: '',
  severities: ['critical', 'high', 'moderate', 'low'] as Severity[],
  causes: ['logging', 'plantation', 'mining', 'fire', 'unknown'] as Cause[],
  startDate: '',
  endDate: '',
};

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
  const t = translations[language];

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

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-paper/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-canopy">{t.appName}</h1>
            <p className="mt-1 text-sm text-stone-600">
              Indonesia deforestation monitoring dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            {loading && <RefreshCw className="animate-spin text-canopy" size={18} />}
            <LanguageToggle language={language} onChange={setLanguage} />
          </div>
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-4 flex max-w-[1500px] items-center gap-2 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <main className="mx-auto grid max-w-[1500px] gap-5 p-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="min-h-[calc(100vh-120px)]">
          <Sidebar
            filters={filters}
            language={language}
            stats={stats}
            provinceStats={provinceStats}
            onFilterChange={setFilters}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-5">
            <div className="h-[560px]">
              <DeforestationMap
                alerts={filteredAlerts}
                selectedProvince={filters.province}
                language={language}
                onSelectAlert={setSelectedAlert}
              />
            </div>
            {filteredAlerts.length === 0 && (
              <div className="border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500">
                {t.empty}
              </div>
            )}
            <TrendChart trends={trends} stats={stats} alerts={filteredAlerts} language={language} />
          </section>

          <aside className="space-y-5">
            <EventCard alert={selectedAlert} language={language} onClose={() => setSelectedAlert(null)} />
            <ImpactCalculator totalArea={stats?.total_area_ha ?? 0} language={language} />
          </aside>
        </div>
      </main>
    </div>
  );
}
