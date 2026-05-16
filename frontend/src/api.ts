import axios from 'axios';
import type { Alert, Filters, NationalStats, ProvinceStats, TrendPoint } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export const api = axios.create({ baseURL: API_BASE_URL });

export function thumbnailUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  // Remove /api prefix from path if base URL already includes it
  const cleanPath = path.startsWith('/api/') ? path.substring(4) : path;
  return `${API_BASE_URL}${cleanPath}`;
}

// Mock data for when backend is not available
const MOCK_STATS: NationalStats = {
  total_events: 0,
  total_area_ha: 0,
  by_severity: {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
  },
  by_cause: {
    logging: 0,
    plantation: 0,
    mining: 0,
    fire: 0,
    unknown: 0,
  },
  protected_zone_breaches: 0,
  latest_update: new Date().toISOString(),
};

// Helper to check if we're in production without backend
const isProductionWithoutBackend = () => {
  return import.meta.env.PROD && API_BASE_URL.startsWith('/');
};

export async function fetchAlerts(filters: Filters): Promise<Alert[]> {
  try {
    const response = await api.get<Alert[]>('/alerts', {
      params: {
        province: filters.province || undefined,
        severity: filters.severities.length === 1 ? filters.severities[0] : undefined,
        cause: filters.causes.length === 1 ? filters.causes[0] : undefined,
        start_date: filters.startDate || undefined,
        end_date: filters.endDate || undefined,
        limit: 500,
      },
      timeout: 10000, // Increased timeout for production
    });
    return response.data;
  } catch (error) {
    console.warn('Backend not available for alerts:', error);
    if (isProductionWithoutBackend()) {
      console.info('Running in demo mode without backend. No alerts available.');
    }
    return [];
  }
}

export async function fetchStats(): Promise<NationalStats> {
  try {
    const response = await api.get<NationalStats>('/stats', { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.warn('Backend not available for stats:', error);
    if (isProductionWithoutBackend()) {
      console.info('Running in demo mode without backend. Showing empty stats.');
    }
    return MOCK_STATS;
  }
}

export async function fetchProvinceStats(): Promise<ProvinceStats[]> {
  try {
    const response = await api.get<ProvinceStats[]>('/provinces', { timeout: 10000 });
    return response.data;
  } catch (error) {
    console.warn('Backend not available for province stats:', error);
    if (isProductionWithoutBackend()) {
      console.info('Running in demo mode without backend. No province data available.');
    }
    return [];
  }
}

export async function fetchTrends(province?: string): Promise<TrendPoint[]> {
  try {
    const response = await api.get<TrendPoint[]>('/trends', {
      params: { province: province || undefined },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.warn('Backend not available for trends:', error);
    if (isProductionWithoutBackend()) {
      console.info('Running in demo mode without backend. No trend data available.');
    }
    return [];
  }
}

