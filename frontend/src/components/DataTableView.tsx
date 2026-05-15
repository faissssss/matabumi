import { useState, useMemo } from 'react';
import { Download, Search, ArrowUpDown } from 'lucide-react';
import { Alert, Language } from '../types';
import { translations } from '../i18n';

interface DataTableViewProps {
  alerts: Alert[];
  language: Language;
  onSelectAlert: (alert: Alert) => void;
}

type SortField = 'date' | 'province' | 'area' | 'cause' | 'severity';
type SortDirection = 'asc' | 'desc';

export default function DataTableView({
  alerts,
  language,
  onSelectAlert,
}: DataTableViewProps) {
  const t = translations[language];
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedAlerts = useMemo(() => {
    let filtered = alerts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (alert) =>
          alert.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
          alert.cause.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.detected_at).getTime() - new Date(b.detected_at).getTime();
          break;
        case 'province':
          comparison = a.province.localeCompare(b.province);
          break;
        case 'area':
          comparison = a.area_ha - b.area_ha;
          break;
        case 'cause':
          comparison = a.cause.localeCompare(b.cause);
          break;
        case 'severity':
          const severityOrder = { critical: 4, high: 3, moderate: 2, low: 1 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [alerts, searchTerm, sortField, sortDirection]);

  const exportToCSV = () => {
    const headers = ['Date', 'Province', 'Area (ha)', 'Cause', 'Severity', 'Confidence'];
    const rows = filteredAndSortedAlerts.map((alert) => [
      alert.detected_at,
      alert.province,
      alert.area_ha.toFixed(1),
      alert.cause,
      alert.severity,
      (alert.confidence * 100).toFixed(0) + '%',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matabumi-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-alert-orange bg-alert-orange/10';
      case 'high':
        return 'text-red-400 bg-red-400/10';
      case 'moderate':
        return 'text-yellow-400 bg-yellow-400/10';
      case 'low':
        return 'text-green-400 bg-green-400/10';
      default:
        return 'text-mist-white/60 bg-white/5';
    }
  };

  return (
    <div className="h-full overflow-hidden bg-forest-dark p-6">
      <div className="mx-auto h-full max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-mist-white">
              Data Table View
            </h2>
            <p className="mt-1 text-sm text-mist-white/60">
              {filteredAndSortedAlerts.length} incidents found
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-mist-white/40"
                size={18}
              />
              <input
                type="text"
                placeholder="Search province or cause..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-lg bg-glass-surface py-2 pl-10 pr-4 text-sm text-mist-white placeholder-mist-white/40 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-canopy-green"
              />
            </div>

            {/* Export */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-lg bg-canopy-green px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-canopy-green/90"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="h-[calc(100%-100px)] overflow-auto rounded-xl bg-glass-surface backdrop-blur-xl">
          <table className="w-full">
            <thead className="sticky top-0 bg-forest-dark/95 backdrop-blur-xl">
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-2 text-sm font-medium text-mist-white/60 transition-colors hover:text-mist-white"
                  >
                    Date
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('province')}
                    className="flex items-center gap-2 text-sm font-medium text-mist-white/60 transition-colors hover:text-mist-white"
                  >
                    Province
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('area')}
                    className="flex items-center gap-2 text-sm font-medium text-mist-white/60 transition-colors hover:text-mist-white"
                  >
                    Area (ha)
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('cause')}
                    className="flex items-center gap-2 text-sm font-medium text-mist-white/60 transition-colors hover:text-mist-white"
                  >
                    Cause
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('severity')}
                    className="flex items-center gap-2 text-sm font-medium text-mist-white/60 transition-colors hover:text-mist-white"
                  >
                    Severity
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-mist-white/60">
                    Confidence
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-mist-white/60">
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-b border-white/5 transition-colors hover:bg-white/5"
                >
                  <td className="px-4 py-3 text-sm text-mist-white">
                    {new Date(alert.detected_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-mist-white">
                    {alert.province}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-mist-white">
                    {alert.area_ha.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-white/5 px-2 py-1 text-xs font-medium text-mist-white/80">
                      {alert.cause}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-mist-white">
                    {(alert.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelectAlert(alert)}
                      className="text-sm font-medium text-canopy-green transition-colors hover:text-canopy-green/80"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAndSortedAlerts.length === 0 && (
            <div className="py-12 text-center text-mist-white/60">
              No incidents found matching your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
