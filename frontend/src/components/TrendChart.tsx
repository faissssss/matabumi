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
    <section className="grid h-full gap-4 xl:grid-cols-2">
      {/* Trend Chart */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 backdrop-blur-xl">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t.trends}</h2>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData.length ? trendData : [{ month: 'No data', area: 0 }]} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '11px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                height={55}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '11px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="area"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ fill: '#f59e0b', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cause Chart */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card p-4 backdrop-blur-xl">
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t.cause}</h2>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={causeData.length ? causeData : [{ name: 'No data', value: 0 }]} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                angle={-20}
                textAnchor="end"
                height={55}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '11px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={55}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
