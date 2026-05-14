import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { causeLabels, translations } from '../i18n';
import type { Alert, Language, NationalStats, TrendPoint } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface Props {
  trends: TrendPoint[];
  stats: NationalStats | null;
  alerts: Alert[];
  language: Language;
}

export default function TrendChart({ trends, stats, alerts, language }: Props) {
  const t = translations[language];
  const trendLabels = trends.map((point) => point.month);
  const trendValues = trends.map((point) => point.area_ha);
  const causeKeys = Object.keys(stats?.by_cause ?? {}) as Array<keyof NonNullable<typeof stats>['by_cause']>;

  const byCause = {
    labels: causeKeys.map((cause) => causeLabels[language][cause]),
    datasets: [
      {
        label: t.alerts,
        data: causeKeys.map((cause) => stats?.by_cause[cause] ?? 0),
        backgroundColor: '#b56b3f',
      },
    ],
  };

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <div className="border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-800">{t.trends}</h2>
        <div className="mt-3 h-64">
          <Line
            data={{
              labels: trendLabels.length ? trendLabels : ['No data'],
              datasets: [
                {
                  label: t.hectares,
                  data: trendValues.length ? trendValues : [0],
                  borderColor: '#0f3d31',
                  backgroundColor: 'rgba(15,61,49,0.12)',
                  tension: 0.25,
                },
              ],
            }}
            options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }}
          />
        </div>
      </div>
      <div className="border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-800">{t.cause}</h2>
        <div className="mt-3 h-64">
          <Bar
            data={byCause}
            options={{
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true } },
            }}
          />
        </div>
        <p className="mt-3 text-xs text-stone-500">
          {alerts.length.toLocaleString(language)} {t.alerts.toLowerCase()}
        </p>
      </div>
    </section>
  );
}
