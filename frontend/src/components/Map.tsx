import L from 'leaflet';
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { severityLabels } from '../i18n';
import type { Alert, Language } from '../types';
import { PROVINCE_CENTERS } from '../data/provinces';

const severityColors = {
  low: '#2f9e44',
  moderate: '#f2c94c',
  high: '#f2994a',
  critical: '#EA580C',
};

interface Props {
  alerts: Alert[];
  selectedProvince: string;
  language: Language;
  onSelectAlert: (alert: Alert) => void;
  theme: 'dark' | 'light';
}

function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 0 10px ${color}80;
        cursor: pointer;
        transition: transform 0.2s;
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function ProvinceFocus({ province }: { province: string }) {
  const map = useMap();
  useEffect(() => {
    const center = PROVINCE_CENTERS[province];
    if (center) {
      map.flyTo(center, 7, { duration: 0.7 });
    } else {
      // Reset to Indonesia view if no province selected
      map.flyTo([-2.5, 118], 5, { duration: 0.7 });
    }
  }, [map, province]);
  return null;
}

function ResetViewButton() {
  const map = useMap();
  
  return (
    <div className="leaflet-top leaflet-right" style={{ top: '80px' }}>
      <div className="leaflet-control">
        <button
          onClick={() => map.flyTo([-2.5, 118], 5, { duration: 0.7 })}
          className="rounded-lg bg-glass-surface p-2 text-mist-white backdrop-blur-xl transition-all hover:bg-glass-surface/80"
          style={{
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          title="Reset View"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function DeforestationMap({ alerts, selectedProvince, language, onSelectAlert, theme }: Props) {
  // Choose tile layer based on theme
  const defaultLayer = theme === 'dark' ? 'Dark' : 'Light';
  
  return (
    <div className="relative h-full w-full">
      <MapContainer 
        center={[-2.5, 118]} 
        zoom={5} 
        scrollWheelZoom 
        className="h-full w-full"
        zoomControl={true}
      >
        <ProvinceFocus province={selectedProvince} />
        <ResetViewButton />
        
        <LayersControl position="topright">
          {/* Dark Mode Layers */}
          <LayersControl.BaseLayer checked={theme === 'dark'} name="Dark">
            <TileLayer
              attribution="&copy; CartoDB"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Dark Satellite">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          {/* Light Mode Layers */}
          <LayersControl.BaseLayer checked={theme === 'light'} name="Light">
            <TileLayer
              attribution="&copy; CartoDB"
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Street">
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              attribution="&copy; OpenTopoMap"
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>

          {/* Markers Overlay */}
          <LayersControl.Overlay checked name="Deforestation Events">
            <>
              {alerts.map((alert) => (
                <Marker
                  key={alert.id}
                  position={[alert.lat, alert.lng]}
                  icon={markerIcon(severityColors[alert.severity])}
                  eventHandlers={{ 
                    click: () => onSelectAlert(alert),
                    mouseover: (e) => {
                      e.target.getElement().style.transform = 'scale(1.3)';
                    },
                    mouseout: (e) => {
                      e.target.getElement().style.transform = 'scale(1)';
                    }
                  }}
                >
                  <Popup className="custom-popup">
                    <div className="space-y-2">
                      <div className="font-semibold text-mist-white">{alert.province}</div>
                      <div className="text-sm text-mist-white/80">
                        <div>Area: {alert.area_ha.toLocaleString(language)} ha</div>
                        <div>Cause: {alert.cause}</div>
                        <div>Severity: {severityLabels[language][alert.severity]}</div>
                        <div>Date: {new Date(alert.detected_at).toLocaleDateString()}</div>
                      </div>
                      <button
                        onClick={() => onSelectAlert(alert)}
                        className="mt-2 w-full rounded bg-canopy-green px-3 py-1 text-sm text-white hover:bg-canopy-green/90"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          </LayersControl.Overlay>
        </LayersControl>
      </MapContainer>
    </div>
  );
}
