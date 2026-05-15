import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ShieldAlert, ChevronDown, ChevronUp, Search } from 'lucide-react';
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
  const [severityOpen, setSeverityOpen] = useState(true);
  const [causeOpen, setCauseOpen] = useState(true);
  const [provinceSearch, setProvinceSearch] = useState('');

  const filteredProvinces = PROVINCES.filter(province =>
    province.toLowerCase().includes(provinceSearch.toLowerCase())
  );

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto p-5">
      {/* Filters Header */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <Filter size={18} className="text-canopy-green" />
        <h2 className="text-sm font-semibold text-mist-white">{t.filters}</h2>
      </div>

      {/* Province Filter with Search */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-mist-white/80">
          {t.province}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-white/40" size={16} />
          <input
            type="text"
            placeholder="Search province..."
            value={provinceSearch}
            onChange={(e) => setProvinceSearch(e.target.value)}
            className="w-full rounded-lg bg-white/5 py-2 pl-10 pr-3 text-sm text-mist-white placeholder-mist-white/40 focus:outline-none focus:ring-2 focus:ring-canopy-green"
          />
        </div>
        <select
          className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-mist-white focus:outline-none focus:ring-2 focus:ring-canopy-green"
          value={filters.province}
          onChange={(event) => onFilterChange({ ...filters, province: event.target.value })}
        >
          <option value="">{t.allProvinces}</option>
          {filteredProvinces.map((province) => (
            <option key={province} value={province}>
              {province}
            </option>
          ))}
        </select>
      </div>

      {/* Severity Filter - Collapsible */}
      <div className="space-y-2">
        <button
          onClick={() => setSeverityOpen(!severityOpen)}
          className="flex w-full items-center justify-between text-xs font-semibold text-mist-white/80 transition-colors hover:text-mist-white"
        >
          <span>{t.severity}</span>
          <motion.div
            animate={{ rotate: severityOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </button>
        <AnimatePresence>
          {severityOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 rounded-lg bg-white/5 p-3">
                {severities.map((severity) => (
                  <label
                    key={severity}
                    className="flex cursor-pointer items-center gap-2 text-sm text-mist-white/90 transition-colors hover:text-mist-white"
                  >
                    <input
                      type="checkbox"
                      checked={filters.severities.includes(severity)}
                      onChange={() =>
                        onFilterChange({
                          ...filters,
                          severities: toggleValue(filters.severities, severity),
                        })
                      }
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-canopy-green focus:ring-2 focus:ring-canopy-green"
                    />
                    <span className="flex-1">{severityLabels[language][severity]}</span>
                    <span className="text-xs text-mist-white/60">
                      {stats?.by_severity[severity] ?? 0}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cause Filter - Collapsible */}
      <div className="space-y-2">
        <button
          onClick={() => setCauseOpen(!causeOpen)}
          className="flex w-full items-center justify-between text-xs font-semibold text-mist-white/80 transition-colors hover:text-mist-white"
        >
          <span>{t.cause}</span>
          <motion.div
            animate={{ rotate: causeOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </button>
        <AnimatePresence>
          {causeOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 rounded-lg bg-white/5 p-3">
                {causes.map((cause) => (
                  <label
                    key={cause}
                    className="flex cursor-pointer items-center gap-2 text-sm text-mist-white/90 transition-colors hover:text-mist-white"
                  >
                    <input
                      type="checkbox"
                      checked={filters.causes.includes(cause)}
                      onChange={() =>
                        onFilterChange({
                          ...filters,
                          causes: toggleValue(filters.causes, cause),
                        })
                      }
                      className="h-4 w-4 rounded border-white/20 bg-white/5 text-canopy-green focus:ring-2 focus:ring-canopy-green"
                    />
                    <span className="flex-1">{causeLabels[language][cause]}</span>
                    <span className="text-xs text-mist-white/60">
                      {stats?.by_cause[cause] ?? 0}
                    </span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-mist-white/80">
          {t.dateRange || 'Date Range'}
        </label>
        <div className="space-y-2">
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
            className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-mist-white focus:outline-none focus:ring-2 focus:ring-canopy-green"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
            className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-mist-white focus:outline-none focus:ring-2 focus:ring-canopy-green"
          />
        </div>
      </div>

      {/* Reset Filters */}
      <button
        onClick={() => onFilterChange({
          province: '',
          severities: ['critical', 'high', 'moderate', 'low'],
          causes: ['logging', 'plantation', 'mining', 'fire', 'unknown'],
          startDate: '',
          endDate: '',
        })}
        className="mt-auto rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-mist-white transition-colors hover:bg-white/10"
      >
        Reset Filters
      </button>
    </aside>
  );
}
