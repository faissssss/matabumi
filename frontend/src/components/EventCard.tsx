import { X, MapPin, Calendar, TrendingDown, Target } from 'lucide-react';
import { thumbnailUrl } from '../api';
import { causeLabels, severityLabels, translations } from '../i18n';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
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
      <Card className="border-border bg-card backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-base text-foreground">{t.details}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t.noEvent}</p>
        </CardContent>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 hover:bg-red-600';
      case 'high':
        return 'bg-alert-orange hover:bg-alert-orange/80';
      case 'moderate':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low':
        return 'bg-green-500 hover:bg-green-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card className="border-border bg-card backdrop-blur-xl">
      <CardHeader className="relative border-b border-border pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <CardTitle className="text-xl text-primary">{alert.province}</CardTitle>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar size={14} />
              <span>{alert.detected_at}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getSeverityColor(alert.severity)} border-0 text-white`}>
              {severityLabels[language][alert.severity]}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Satellite Thumbnail */}
        {alert.thumbnail_url ? (
          <div className="relative overflow-hidden">
            <img
              src={thumbnailUrl(alert.thumbnail_url) ?? undefined}
              alt={`${alert.province} satellite thumbnail`}
              className="h-56 w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        ) : (
          <div className="grid h-56 place-items-center bg-gradient-to-br from-primary/20 to-primary/5">
            <div className="text-center">
              <MapPin className="mx-auto mb-2 text-primary" size={32} />
              <p className="text-sm font-medium text-primary">{alert.province}</p>
            </div>
          </div>
        )}

        {/* Alert Details */}
        <div className="space-y-4 p-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingDown size={14} />
                <span>{t.hectares}</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {alert.area_ha.toLocaleString(language)} <span className="text-sm font-normal">ha</span>
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Target size={14} />
                <span>{t.confidence}</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {Math.round(alert.confidence * 100)}%
              </p>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Cause Information */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">{t.cause}</p>
            <Badge variant="outline" className="border-border bg-muted text-foreground">
              {causeLabels[language][alert.cause]}
            </Badge>
          </div>

          <Separator className="bg-border" />

          {/* Coordinates */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">{t.coordinates}</p>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-primary" />
              <p className="font-mono text-sm text-foreground">
                {alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}
              </p>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* NDVI Analysis */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">{t.ndvi}</p>
            <div className="grid grid-cols-3 gap-3 rounded-lg border border-border bg-muted p-3">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Before</p>
                <p className="mt-1 font-mono text-sm font-semibold text-green-500">
                  {alert.ndvi_before.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">After</p>
                <p className="mt-1 font-mono text-sm font-semibold text-red-500">
                  {alert.ndvi_after.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Change</p>
                <p className="mt-1 font-mono text-sm font-semibold text-primary">
                  {alert.ndvi_change.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Protected Zone Badge */}
          {alert.is_protected_zone && (
            <Badge variant="destructive" className="w-full justify-center border-0 bg-destructive/20 text-destructive">
              🛡️ Protected Zone
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
