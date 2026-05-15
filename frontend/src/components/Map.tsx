import L from 'leaflet';
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { severityLabels } from '../i18n';
import type { Alert, Language } from '../types';
import { PROVINCE_CENTERS } from '../data/provinces';

const severityColors = {
  low: '#22c55e',      // Bright green - clearly safe
  moderate: '#eab308',  // Bright yellow - warning
  high: '#f97316',      // Bright orange - danger
  critical: '#dc2626',  // Bright red - critical
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
    className: 'custom-marker-icon',
    html: `
      <div class="marker-pin" style="
        position: relative;
        width: 24px;
        height: 24px;
        background: ${color};
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), 0 0 0 2px ${color}40;
        cursor: pointer;
        will-change: transform;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          opacity: 0.9;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
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

// Removed ResetViewButton - Home button removed as requested

function MapClickHandler({ onSelectAlert, alerts }: { onSelectAlert: (alert: Alert) => void; alerts: Alert[] }) {
  const map = useMap();
  
  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      // Find closest alert to click
      const clickedPoint = e.latlng;
      let closestAlert: Alert | null = null;
      let minDistance = Infinity;
      
      alerts.forEach(alert => {
        const distance = map.distance(clickedPoint, [alert.lat, alert.lng]);
        if (distance < minDistance && distance < 50000) { // Within 50km
          minDistance = distance;
          closestAlert = alert;
        }
      });
      
      if (closestAlert) {
        const selectedAlert = closestAlert as Alert;
        map.flyTo([selectedAlert.lat, selectedAlert.lng], 10, {
          duration: 0.8,
          easeLinearity: 0.25
        });
        onSelectAlert(selectedAlert);
      }
    };
    
    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onSelectAlert, alerts]);
  
  return null;
}

export default function DeforestationMap({ alerts, selectedProvince, language, onSelectAlert, theme }: Props) {
  // Choose tile layer based on theme
  const defaultLayer = theme === 'dark' ? 'Dark' : 'Light';
  
  const handleMarkerClick = (alert: Alert, map: L.Map) => {
    // Zoom to marker with animation
    map.flyTo([alert.lat, alert.lng], 10, {
      duration: 0.8,
      easeLinearity: 0.25
    });
    // Call the select handler
    onSelectAlert(alert);
  };
  
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
        <MapClickHandler onSelectAlert={onSelectAlert} alerts={alerts} />
        
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
        </LayersControl>
        
        {/* Markers rendered directly without overlay control */}
        {alerts.map((alert) => (
          <MarkerWithClick
            key={alert.id}
            alert={alert}
            language={language}
            onSelectAlert={onSelectAlert}
            color={severityColors[alert.severity]}
          />
        ))}
      </MapContainer>
    </div>
  );
}

function MarkerWithClick({ alert, language, onSelectAlert, color }: { alert: Alert; language: Language; onSelectAlert: (alert: Alert) => void; color: string }) {
  const map = useMap();
  
  const handleClick = () => {
    map.flyTo([alert.lat, alert.lng], 10, {
      duration: 0.8,
      easeLinearity: 0.25
    });
    onSelectAlert(alert);
  };
  
  return (
    <Marker
      position={[alert.lat, alert.lng]}
      icon={markerIcon(color)}
      eventHandlers={{ 
        click: handleClick,
        mouseover: (e) => {
          const element = e.target.getElement();
          if (element) {
            const pin = element.querySelector('.marker-pin') as HTMLElement;
            if (pin) {
              pin.style.transform = 'scale(1.4)';
              pin.style.zIndex = '1000';
              pin.style.transition = 'transform 0.2s ease-out';
            }
          }
        },
        mouseout: (e) => {
          const element = e.target.getElement();
          if (element) {
            const pin = element.querySelector('.marker-pin') as HTMLElement;
            if (pin) {
              pin.style.transform = 'scale(1)';
              pin.style.zIndex = '';
              pin.style.transition = 'transform 0.2s ease-out';
            }
          }
        }
      }}
    >
      <Popup className="custom-popup">
        <div className="space-y-2">
          <div className="font-semibold text-foreground">{alert.province}</div>
          <div className="text-sm text-muted-foreground">
            <div>Area: {alert.area_ha.toLocaleString(language)} ha</div>
            <div>Cause: {alert.cause}</div>
            <div>Severity: {severityLabels[language][alert.severity]}</div>
            <div>Date: {new Date(alert.detected_at).toLocaleDateString()}</div>
          </div>
          <button
            onClick={handleClick}
            className="mt-2 w-full rounded bg-primary px-3 py-1 text-sm text-primary-foreground hover:bg-primary/90"
          >
            View Details
          </button>
        </div>
      </Popup>
    </Marker>
  );
}
