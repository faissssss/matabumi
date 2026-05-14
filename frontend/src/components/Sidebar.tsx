import { Filter, ShieldAlert } from 'lucide-react';
import { causeLabels, severityLabels, translations } from '../i18n';
import { PROVINCES } from '../data/provinces';
import type { Cause, Filters, Language, NationalStats, ProvinceStats, Severity } from '../types';

const severities: Severity[] = ['critical', 'high', 'moderate', 'low'];
const causes: Cause[] = ['logging', 'plantation', 'mining', 'fire', 'unknown'];

interface Props {
  filters: Filters;
  language: Language;
  stats: NationalStats | null;
  provinceStats: ProvinceStats[];
  onFilterChange: (filters: Filters) => void;
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

export default function Sidebar({ filters, language, stats, provinceStats, onFilterChange }: Props) {
  const t = translations[language];

  return (
    <aside className="flex h-full flex-col gap-5 overflow-y-auto border-r border-stone-200 bg-white/90 p-5 backdrop-blur">
      <section className="grid grid-cols-2 gap-3">
        <div className="border border-stone-200 bg-paper p-3">
          <p className="text-xs font-medium text-stone-500">{t.hectares}</p>
          <p className="mt-1 text-2xl font-semibold text-canopy">
            {(stats?.total_area_ha ?? 0).toLocaleString(language)}
          </p>
        </div>
        <div className="border border-stone-200 bg-paper p-3">
          <p className="text-xs font-medium text-stone-500">{t.alerts}</p>
          <p className="mt-1 text-2xl font-semibold text-canopy">
            {stats?.total_events ?? 0}
          </p>
        </div>
        <div className="border border-stone-200 bg-paper p-3">
          <p className="text-xs font-medium text-stone-500">{t.critical}</p>
          <p className="mt-1 text-2xl font-semibold text-ember">
            {stats?.by_severity.critical ?? 0}
          </p>
        </div>
        <div className="border border-stone-200 bg-paper p-3">
          <p className="text-xs font-medium text-stone-500">{t.protected}</p>
          <p className="mt-1 flex items-center gap-2 text-2xl font-semibold text-earth">
            <ShieldAlert size={20} />
            {stats?.protected_zone_breaches ?? 0}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-stone-800">
          <Filter size={17} />
          {t.filters}
        </h2>

        <label className="block text-xs font-semibold text-stone-600">
          {t.province}
          <select
            className="mt-2 h-10 w-full border border-stone-300 bg-white px-3 text-sm text-stone-800"
            value={filters.province}
            onChange={(event) => onFilterChange({ ...filters, province: event.target.value })}
          >
            <option value="">{t.allProvinces}</option>
            {PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="text-xs font-semibold text-stone-600">{t.severity}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {severities.map((severity) => (
              <label key={severity} className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={filters.severities.includes(severity)}
                  onChange={() =>
                    onFilterChange({
                      ...filters,
                      severities: toggleValue(filters.severities, severity),
                    })
                  }
                />
                {severityLabels[language][severity]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-stone-600">{t.cause}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {causes.map((cause) => (
              <label key={cause} className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={filters.causes.includes(cause)}
                  onChange={() =>
                    onFilterChange({ ...filters, causes: toggleValue(filters.causes, cause) })
                  }
                />
                {causeLabels[language][cause]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-stone-600">{t.dateRange}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input
              type="date"
              className="h-10 min-w-0 border border-stone-300 px-2 text-sm"
              value={filters.startDate}
              onChange={(event) => onFilterChange({ ...filters, startDate: event.target.value })}
            />
            <input
              type="date"
              className="h-10 min-w-0 border border-stone-300 px-2 text-sm"
              value={filters.endDate}
              onChange={(event) => onFilterChange({ ...filters, endDate: event.target.value })}
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-stone-800">{t.provinces}</h2>
        <div className="mt-2 max-h-64 overflow-y-auto border border-stone-200">
          {PROVINCES.map((province) => {
            const row = provinceStats.find((item) => item.province === province);
            return (
              <button
                type="button"
                key={province}
                onClick={() => onFilterChange({ ...filters, province })}
                className={`flex w-full items-center justify-between border-b border-stone-100 px-3 py-2 text-left text-sm last:border-b-0 ${
                  filters.province === province ? 'bg-canopy text-white' : 'hover:bg-stone-50'
                }`}
              >
                <span>{province}</span>
                <span className="font-semibold">{row?.event_count ?? 0}</span>
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
