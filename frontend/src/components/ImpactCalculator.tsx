import { useMemo, useState } from 'react';
import { translations } from '../i18n';
import type { Language } from '../types';

interface Props {
  totalArea: number;
  language: Language;
}

export default function ImpactCalculator({ totalArea, language }: Props) {
  const [reduction, setReduction] = useState(25);
  const t = translations[language];

  const values = useMemo(() => {
    const hectaresSaved = totalArea * (reduction / 100);
    const co2Avoided = hectaresSaved * 150 * 3.67;
    const economicValue = co2Avoided * 15;
    const footballFields = hectaresSaved / 0.714;
    return { hectaresSaved, co2Avoided, economicValue, footballFields };
  }, [reduction, totalArea]);

  return (
    <section className="rounded-lg border border-border bg-card p-5 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-foreground">{t.impact}</h2>
        <span className="text-2xl font-semibold text-primary">{reduction}%</span>
      </div>
      <label className="mt-4 block text-xs font-semibold text-muted-foreground">
        {t.reduction}
        <input
          aria-label={t.reduction}
          type="range"
          min="0"
          max="100"
          value={reduction}
          onChange={(event) => setReduction(Number(event.target.value))}
          className="mt-3 w-full accent-primary"
        />
      </label>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-muted p-3">
          <dt className="text-xs text-muted-foreground">{t.saved}</dt>
          <dd className="mt-1 font-semibold text-foreground">{values.hectaresSaved.toLocaleString(language)} ha</dd>
        </div>
        <div className="rounded-lg border border-border bg-muted p-3">
          <dt className="text-xs text-muted-foreground">{t.co2}</dt>
          <dd className="mt-1 font-semibold text-foreground">{Math.round(values.co2Avoided).toLocaleString(language)} t</dd>
        </div>
        <div className="rounded-lg border border-border bg-muted p-3">
          <dt className="text-xs text-muted-foreground">{t.value}</dt>
          <dd className="mt-1 font-semibold text-foreground">${Math.round(values.economicValue).toLocaleString(language)}</dd>
        </div>
        <div className="rounded-lg border border-border bg-muted p-3">
          <dt className="text-xs text-muted-foreground">{t.fields}</dt>
          <dd className="mt-1 font-semibold text-foreground">{Math.round(values.footballFields).toLocaleString(language)}</dd>
        </div>
      </dl>
    </section>
  );
}
