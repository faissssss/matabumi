import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ShieldAlert, ChevronDown, ChevronUp, Search, RotateCcw } from 'lucide-react';
import { causeLabels, severityLabels, translations } from '../i18n';
import { PROVINCES } from '../data/provinces';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
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
    <aside className="flex h-full flex-col overflow-hidden">
      {/* Filters Header */}
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-border px-5 py-4">
        <Filter size={18} className="text-primary" />
        <h2 className="text-base font-semibold text-foreground">{t.filters}</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5">
        <div className="space-y-6 py-4">
          {/* Province Filter with Search */}
          <div className="space-y-3">
            <label htmlFor="province-select" className="block text-sm font-semibold text-foreground">
              {t.province}
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder={t.searchProvince}
                value={provinceSearch}
                onChange={(e) => setProvinceSearch(e.target.value)}
                className="w-full rounded-lg border border-input bg-input py-2.5 pl-10 pr-3 text-sm text-foreground placeholder-muted-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <select
              id="province-select"
              className="w-full rounded-lg border border-input bg-input px-3 py-2.5 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
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

          <Separator className="bg-border" />

          {/* Severity Filter - Collapsible */}
          <div className="space-y-3">
            <button
              onClick={() => setSeverityOpen(!severityOpen)}
              className="flex w-full items-center justify-between text-sm font-semibold text-foreground transition-colors hover:text-primary"
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
                  <div className="space-y-3 rounded-lg border border-border bg-muted p-3">
                    {severities.map((severity) => (
                      <div
                        key={severity}
                        className="flex items-center justify-between gap-3"
                      >
                        <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm text-foreground transition-colors hover:text-primary">
                          <Checkbox
                            checked={filters.severities.includes(severity)}
                            onCheckedChange={() =>
                              onFilterChange({
                                ...filters,
                                severities: toggleValue(filters.severities, severity),
                              })
                            }
                            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="flex-1">{severityLabels[language][severity]}</span>
                        </label>
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                          {stats?.by_severity[severity] ?? 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator className="bg-border" />

          {/* Cause Filter - Collapsible */}
          <div className="space-y-3">
            <button
              onClick={() => setCauseOpen(!causeOpen)}
              className="flex w-full items-center justify-between text-sm font-semibold text-foreground transition-colors hover:text-primary"
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
                  <div className="space-y-3 rounded-lg border border-border bg-muted p-3">
                    {causes.map((cause) => (
                      <div
                        key={cause}
                        className="flex items-center justify-between gap-3"
                      >
                        <label className="flex flex-1 cursor-pointer items-center gap-3 text-sm text-foreground transition-colors hover:text-primary">
                          <Checkbox
                            checked={filters.causes.includes(cause)}
                            onCheckedChange={() =>
                              onFilterChange({
                                ...filters,
                                causes: toggleValue(filters.causes, cause),
                              })
                            }
                            className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <span className="flex-1">{causeLabels[language][cause]}</span>
                        </label>
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">
                          {stats?.by_cause[cause] ?? 0}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator className="bg-border" />

          {/* Date Range Filter */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-foreground">
              {t.dateRange || 'Date Range'}
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                className="w-full rounded-lg border border-input bg-input px-3 py-2.5 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                className="w-full rounded-lg border border-input bg-input px-3 py-2.5 text-sm text-foreground transition-all focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reset Filters Button */}
      <div className="flex-shrink-0 border-t border-border p-5">
        <Button
          onClick={() => onFilterChange({
            province: '',
            severities: ['critical', 'high', 'moderate', 'low'],
            causes: ['logging', 'plantation', 'mining', 'fire', 'unknown'],
            startDate: '',
            endDate: '',
          })}
          variant="outline"
          className="w-full border-white/20 bg-white/5 text-mist-white hover:bg-white/10 hover:text-mist-white dark:text-mist-white light:text-forest-dark"
        >
          <RotateCcw size={16} className="mr-2" />
          Reset Filters
        </Button>
      </div>
    </aside>
  );
}
