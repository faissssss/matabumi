export type Severity = 'low' | 'moderate' | 'high' | 'critical';
export type Cause = 'logging' | 'plantation' | 'mining' | 'fire' | 'unknown';
export type Language = 'id' | 'en';

export interface Alert {
  id: number;
  detected_at: string;
  province: string;
  lat: number;
  lng: number;
  bbox: [number, number, number, number];
  area_ha: number;
  cause: Cause;
  confidence: number;
  severity: Severity;
  is_protected_zone: boolean;
  ndvi_before: number;
  ndvi_after: number;
  ndvi_change: number;
  thumbnail_url?: string | null;
  thumbnail_path?: string | null;
  created_at: string;
}

export interface ProvinceStats {
  province: string;
  total_area_ha: number;
  event_count: number;
  dominant_cause: Cause | string;
  critical_count: number;
  latest_detection?: string;
}

export interface NationalStats {
  total_area_ha: number;
  total_events: number;
  by_severity: Record<Severity, number>;
  by_cause: Record<Cause, number>;
  protected_zone_breaches: number;
  latest_update: string;
}

export interface TrendPoint {
  month: string;
  area_ha: number;
  event_count: number;
}

export interface Filters {
  province: string;
  severities: Severity[];
  causes: Cause[];
  startDate: string;
  endDate: string;
}
