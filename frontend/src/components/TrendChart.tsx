import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { causeLabels, translations } from '../i18n';
import type { Alert, Language, NationalStats, TrendPoint } from '../types';

interface Props {
  trends: TrendPoint[];
  stats: NationalStats | null;
  alerts: Alert[];
  language: Language;
}

export default function TrendChart({ trends, stats, alerts, language }: Props) {
  const t = translations[language];
  
  // Prepare trend data for Recharts
  const trendData = trends.map((point) => ({
    month: point.month,
    area: point.area_ha,
  }));

  // Prepare cause data for Recharts
  const causeKeys = Object.keys(stats?.by_cause ?? {}) as Array<keyof NonNullable<typeof stats>['by_cause']>;
  const causeData = causeKeys.map((cause) => ({
    name: causeLabels[language][cause],
    value: stats?.by_cause[cause] ?? 0,
  }));

  return (
    <section className="grid gap-6 xl:grid-cols-2">
      {/* Trend Chart */}
      <div className="rounded-xl bg-glass-surface p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-sm font-semibold text-mist-white">{t.trends}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={trendData.length ? trendData : [{ month: 'No data', area: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="month" 
              stroke="rgba(240,244,241,0.6)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="rgba(240,244,241,0.6)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(13, 31, 21, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#F0F4F1',
              }}
            />
            <Line
              type="monotone"
              dataKey="area"
              stroke="#1A4D2E"
              strokeWidth={2}
              dot={{ fill: '#1A4D2E', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cause Chart */}
      <div className="rounded-xl bg-glass-surface p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-sm font-semibold text-mist-white">{t.cause}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={causeData.length ? causeData : [{ name: 'No data', value: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="name" 
              stroke="rgba(240,244,241,0.6)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="rgba(240,244,241,0.6)"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(13, 31, 21, 0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#F0F4F1',
              }}
            />
            <Bar dataKey="value" fill="#1A4D2E" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-4 text-xs text-mist-white/60">
          {alerts.length.toLocaleString(language)} {t.alerts.toLowerCase()}
        </p>
      </div>
    </section>
  );
}
