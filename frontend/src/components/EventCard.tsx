import { X } from 'lucide-react';
import { thumbnailUrl } from '../api';
import { causeLabels, severityLabels, translations } from '../i18n';
import type { Alert, Language } from '../types';

interface Props {
  alert: Alert | null;
  language: Language;
  onClose: () => void;
}

export default function EventCard({ alert, language, onClose }: Props) {
  const t = translations[language];

  if (!alert) {
    return (
      <section className="rounded-lg border border-white/10 bg-glass-surface p-5 backdrop-blur-xl">
        <h2 className="text-sm font-semibold text-mist-white">{t.details}</h2>
        <p className="mt-3 text-sm text-mist-white/60">{t.noEvent}</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-glass-surface backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold text-mist-white">{t.details}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="grid h-8 w-8 place-items-center rounded-lg text-mist-white/70 transition-colors hover:bg-white/10 hover:text-mist-white"
        >
          <X size={16} />
        </button>
      </div>
      {alert.thumbnail_url ? (
        <img
          src={thumbnailUrl(alert.thumbnail_url) ?? undefined}
          alt={`${alert.province} satellite thumbnail`}
          className="h-48 w-full object-cover"
        />
      ) : (
        <div className="grid h-48 place-items-center bg-gradient-to-br from-canopy-green/20 to-canopy-green/5 text-sm font-medium text-canopy-green">
          {alert.province}
        </div>
      )}
      <div className="space-y-3 p-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-canopy-green">{alert.province}</p>
            <p className="text-mist-white/60">{alert.detected_at}</p>
          </div>
          <span className="rounded-md bg-ember-red px-2 py-1 text-xs font-semibold uppercase text-white">
            {severityLabels[language][alert.severity]}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-mist-white/60">{t.hectares}</dt>
            <dd className="font-semibold text-mist-white">{alert.area_ha.toLocaleString(language)} ha</dd>
          </div>
          <div>
            <dt className="text-xs text-mist-white/60">{t.cause}</dt>
            <dd className="font-semibold text-mist-white">{causeLabels[language][alert.cause]}</dd>
          </div>
          <div>
            <dt className="text-xs text-mist-white/60">{t.confidence}</dt>
            <dd className="font-semibold text-mist-white">{Math.round(alert.confidence * 100)}%</dd>
          </div>
          <div>
            <dt className="text-xs text-mist-white/60">{t.coordinates}</dt>
            <dd className="font-semibold text-mist-white">
              {alert.lat.toFixed(2)}, {alert.lng.toFixed(2)}
            </dd>
          </div>
        </dl>
        <div className="border-t border-white/10 pt-3">
          <p className="text-xs font-semibold text-mist-white/60">{t.ndvi}</p>
          <p className="mt-1 text-mist-white">
            {alert.ndvi_before.toFixed(2)} {'->'} {alert.ndvi_after.toFixed(2)} (
            {alert.ndvi_change.toFixed(2)})
          </p>
        </div>
      </div>
    </section>
  );
}
