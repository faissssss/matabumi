import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EventCard from '../EventCard';
import ImpactCalculator from '../ImpactCalculator';
import LanguageToggle from '../LanguageToggle';
import Sidebar from '../Sidebar';
import DeforestationMap from '../Map';
import type { Alert, Filters, NationalStats } from '../../types';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useMap: () => ({ flyTo: vi.fn() }),
  LayersControl: Object.assign(
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    {
      BaseLayer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Overlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    },
  ),
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
}));

const stats: NationalStats = {
  total_area_ha: 1000,
  total_events: 2,
  by_severity: { low: 0, moderate: 0, high: 1, critical: 1 },
  by_cause: { logging: 1, plantation: 0, mining: 1, fire: 0, unknown: 0 },
  protected_zone_breaches: 1,
  latest_update: '2026-05-14T00:00:00Z',
};

const filters: Filters = {
  province: '',
  severities: ['critical', 'high', 'moderate', 'low'],
  causes: ['logging', 'plantation', 'mining', 'fire', 'unknown'],
  startDate: '',
  endDate: '',
};

const alert: Alert = {
  id: 1,
  detected_at: '2026-05-14',
  province: 'Aceh',
  lat: 4,
  lng: 96.5,
  bbox: [95, 2, 98.5, 6],
  area_ha: 120,
  cause: 'logging',
  confidence: 0.72,
  severity: 'high',
  is_protected_zone: false,
  ndvi_before: 0.7,
  ndvi_after: 0.3,
  ndvi_change: 0.4,
  created_at: '2026-05-14T00:00:00Z',
};

describe('dashboard components', () => {
  it('switches language with LanguageToggle', () => {
    const onChange = vi.fn();
    render(<LanguageToggle language="id" onChange={onChange} />);
    fireEvent.click(screen.getByText('en'));
    expect(onChange).toHaveBeenCalledWith('en');
  });

  it('updates sidebar filters', () => {
    const onFilterChange = vi.fn();
    render(
      <Sidebar
        filters={filters}
        language="en"
        stats={stats}
        provinceStats={[{ province: 'Aceh', total_area_ha: 120, event_count: 1, dominant_cause: 'logging', critical_count: 0 }]}
        onFilterChange={onFilterChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Province'), { target: { value: 'Aceh' } });
    expect(onFilterChange).toHaveBeenCalledWith(expect.objectContaining({ province: 'Aceh' }));
  });

  it('shows event details', () => {
    render(<EventCard alert={alert} language="en" onClose={vi.fn()} />);
    expect(screen.getAllByText('Aceh').length).toBeGreaterThan(0);
    expect(screen.getByText('logging')).toBeInTheDocument();
    expect(screen.getByText('72%')).toBeInTheDocument();
  });

  it('updates impact calculator values from slider', () => {
    render(<ImpactCalculator totalArea={1000} language="en" />);
    fireEvent.change(screen.getByLabelText('Reduction'), { target: { value: '50' } });
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('500 ha')).toBeInTheDocument();
  });

  it('renders map markers with alerts', () => {
    render(
      <DeforestationMap
        alerts={[alert]}
        selectedProvince="Aceh"
        language="en"
        onSelectAlert={vi.fn()}
        theme="dark"
      />,
    );
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.getByTestId('marker')).toBeInTheDocument();
  });
});
