import { useState, useMemo } from 'react';
import { Download, Search, ArrowUpDown } from 'lucide-react';
import { Alert, Language } from '../types';
import { translations, causeLabels, severityLabels } from '../i18n';

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
      causeLabels[language][alert.cause],
      severityLabels[language][alert.severity],
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
        return 'text-red-500 bg-red-500/10';
      case 'high':
        return 'text-orange-500 bg-orange-500/10';
      case 'moderate':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-green-500 bg-green-500/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="h-full overflow-hidden bg-background p-6">
      <div className="mx-auto flex h-full flex-col max-w-[1600px]">
        {/* Header */}
        <div className="mb-6 flex flex-shrink-0 items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {t.dataTableView}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {filteredAndSortedAlerts.length} {t.incidentsFound}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-lg border border-input bg-input py-2 pl-10 pr-4 text-sm text-foreground placeholder-muted-foreground backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Export */}
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Download size={16} />
              {t.exportCSV}
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto rounded-xl border border-border bg-card backdrop-blur-xl">
          <table className="w-full">
            <thead className="sticky top-0 bg-card/95 backdrop-blur-xl">
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t.date}
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('province')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t.province}
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleSort('area')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t.area} (ha)
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('cause')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t.cause}
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('severity')}
                    className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t.severity}
                    <ArrowUpDown size={14} />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t.confidence}
                  </span>
                </th>
                <th className="px-4 py-3 text-right">
                  <span className="text-sm font-medium text-muted-foreground">
                    {t.actions}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedAlerts.map((alert) => (
                <tr
                  key={alert.id}
                  className="border-b border-border transition-colors hover:bg-accent"
                >
                  <td className="px-4 py-3 text-sm text-foreground">
                    {new Date(alert.detected_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">
                    {alert.province}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">
                    {alert.area_ha.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground">
                      {causeLabels[language][alert.cause]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getSeverityColor(
                        alert.severity
                      )}`}
                    >
                      {severityLabels[language][alert.severity]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-foreground">
                    {(alert.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onSelectAlert(alert)}
                      className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                    >
                      {t.viewDetails}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAndSortedAlerts.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              {t.noIncidents}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
