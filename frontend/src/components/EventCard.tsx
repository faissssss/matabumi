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
      <section className="border border-stone-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-stone-800">{t.details}</h2>
        <p className="mt-3 text-sm text-stone-500">{t.noEvent}</p>
      </section>
    );
  }

  return (
    <section className="border border-stone-200 bg-white">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-stone-800">{t.details}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="grid h-8 w-8 place-items-center text-stone-500 hover:bg-stone-100"
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
        <div className="grid h-48 place-items-center bg-[linear-gradient(135deg,#d9e3d5,#8ab17d)] text-sm font-medium text-canopy">
          {alert.province}
        </div>
      )}
      <div className="space-y-3 p-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-canopy">{alert.province}</p>
            <p className="text-stone-500">{alert.detected_at}</p>
          </div>
          <span className="bg-ember px-2 py-1 text-xs font-semibold uppercase text-white">
            {severityLabels[language][alert.severity]}
          </span>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          <div>
            <dt className="text-xs text-stone-500">{t.hectares}</dt>
            <dd className="font-semibold">{alert.area_ha.toLocaleString(language)} ha</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">{t.cause}</dt>
            <dd className="font-semibold">{causeLabels[language][alert.cause]}</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">{t.confidence}</dt>
            <dd className="font-semibold">{Math.round(alert.confidence * 100)}%</dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">{t.coordinates}</dt>
            <dd className="font-semibold">
              {alert.lat.toFixed(2)}, {alert.lng.toFixed(2)}
            </dd>
          </div>
        </dl>
        <div className="border-t border-stone-100 pt-3">
          <p className="text-xs font-semibold text-stone-500">{t.ndvi}</p>
          <p className="mt-1 text-stone-700">
            {alert.ndvi_before.toFixed(2)} {'->'} {alert.ndvi_after.toFixed(2)} (
            {alert.ndvi_change.toFixed(2)})
          </p>
        </div>
      </div>
    </section>
  );
}
