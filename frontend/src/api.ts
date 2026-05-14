import axios from 'axios';
import type { Alert, Filters, NationalStats, ProvinceStats, TrendPoint } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

export const api = axios.create({ baseURL: API_BASE_URL });

export function thumbnailUrl(path?: string | null) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

export async function fetchAlerts(filters: Filters): Promise<Alert[]> {
  const response = await api.get<Alert[]>('/api/alerts', {
    params: {
      province: filters.province || undefined,
      severity: filters.severities.length === 1 ? filters.severities[0] : undefined,
      cause: filters.causes.length === 1 ? filters.causes[0] : undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined,
      limit: 500,
    },
  });
  return response.data;
}

export async function fetchStats(): Promise<NationalStats> {
  const response = await api.get<NationalStats>('/api/stats');
  return response.data;
}

export async function fetchProvinceStats(): Promise<ProvinceStats[]> {
  const response = await api.get<ProvinceStats[]>('/api/provinces');
  return response.data;
}

export async function fetchTrends(province?: string): Promise<TrendPoint[]> {
  const response = await api.get<TrendPoint[]>('/api/trends', {
    params: { province: province || undefined },
  });
  return response.data;
}
