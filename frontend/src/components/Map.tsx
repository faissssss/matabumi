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
  critical: '#d9480f',
};

interface Props {
  alerts: Alert[];
  selectedProvince: string;
  language: Language;
  onSelectAlert: (alert: Alert) => void;
}

function markerIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div class="marker-dot" style="background:${color}; border-radius:999px"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function ProvinceFocus({ province }: { province: string }) {
  const map = useMap();
  useEffect(() => {
    const center = PROVINCE_CENTERS[province];
    if (center) {
      map.flyTo(center, 7, { duration: 0.7 });
    }
  }, [map, province]);
  return null;
}

export default function DeforestationMap({ alerts, selectedProvince, language, onSelectAlert }: Props) {
  return (
    <div className="relative h-full min-h-[420px] overflow-hidden border border-stone-200 bg-[#d9e3d5]">
      <div className="pointer-events-none absolute inset-0 z-0 opacity-70">
        <div className="absolute left-[10%] top-[36%] h-10 w-56 -rotate-12 bg-canopy/20" />
        <div className="absolute left-[39%] top-[30%] h-24 w-44 rotate-6 bg-canopy/20" />
        <div className="absolute left-[58%] top-[45%] h-16 w-36 -rotate-6 bg-canopy/20" />
        <div className="absolute left-[74%] top-[38%] h-28 w-40 rotate-3 bg-canopy/20" />
        <div className="absolute left-[26%] top-[57%] h-8 w-36 bg-canopy/20" />
      </div>
      <MapContainer center={[-2.5, 118]} zoom={5} scrollWheelZoom className="relative z-10 h-full">
        <ProvinceFocus province={selectedProvince} />
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street">
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Terrain">
            <TileLayer
              attribution="&copy; OpenTopoMap"
              url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Dark">
            <TileLayer
              attribution="&copy; CartoDB"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>

          <LayersControl.Overlay checked name="Event Markers">
            <>
              {alerts.map((alert) => (
                <Marker
                  key={alert.id}
                  position={[alert.lat, alert.lng]}
                  icon={markerIcon(severityColors[alert.severity])}
                  eventHandlers={{ click: () => onSelectAlert(alert) }}
                >
                  <Popup>
                    <strong>{alert.province}</strong>
                    <br />
                    {alert.area_ha.toLocaleString(language)} ha
                    <br />
                    {severityLabels[language][alert.severity]}
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
