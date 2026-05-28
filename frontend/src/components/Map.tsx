import L from 'leaflet';
import { LayersControl, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
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
  isVisible?: boolean;
}

interface MapState {
  center: [number, number];
  zoom: number;
  layer: string;
}

// Helper to save/load map state from localStorage
const MAP_STATE_KEY = 'matabumi-map-state';

function saveMapState(state: MapState) {
  try {
    localStorage.setItem(MAP_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save map state:', e);
  }
}

function loadMapState(): MapState | null {
  try {
    const saved = localStorage.getItem(MAP_STATE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.warn('Failed to load map state:', e);
    return null;
  }
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
      const existing = loadMapState();
      saveMapState({ center, zoom: 7, layer: existing?.layer ?? 'Dark' });
    } else {
      map.flyTo([-2.5, 118], 5, { duration: 0.7 });
      const existing = loadMapState();
      saveMapState({ center: [-2.5, 118], zoom: 5, layer: existing?.layer ?? 'Dark' });
    }
  }, [map, province]);
  return null;
}

// Component to track and save map state changes
function MapStateManager() {
  const map = useMap();
  
  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const existing = loadMapState();
      saveMapState({ center: [center.lat, center.lng], zoom, layer: existing?.layer ?? 'Dark' });
    };
    
    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);
    
    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
    };
  }, [map]);
  
  return null;
}

// Component to track layer changes
function LayerStateManager({ onLayerChange }: { onLayerChange: (layer: string) => void }) {
  const map = useMap();
  
  useEffect(() => {
    const handleBaseLayerChange = (e: L.LayersControlEvent) => {
      onLayerChange(e.name);
    };
    
    map.on('baselayerchange', handleBaseLayerChange);
    
    return () => {
      map.off('baselayerchange', handleBaseLayerChange);
    };
  }, [map, onLayerChange]);
  
  return null;
}

// Invalidates Leaflet's size calculation when the map becomes visible after being hidden.
// Without this, switching tabs leaves the map with a 0x0 measured size and tiles don't load.
function MapResizer({ isVisible }: { isVisible: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (isVisible) {
      // Defer until after the CSS display change has been painted
      const id = setTimeout(() => map.invalidateSize(), 50);
      return () => clearTimeout(id);
    }
  }, [isVisible, map]);
  return null;
}

// Button that flies back to the full Indonesia overview view.
// Rendered as a custom Leaflet control positioned below the zoom buttons.
function FitIndonesiaButton() {
  const map = useMap();

  const handleClick = () => {
    map.flyTo([-2.5, 118], 4, { duration: 0.8 });
  };

  return (
    <div className="leaflet-top leaflet-left" style={{ pointerEvents: 'none' }}>
      {/* Spacer to push below the zoom control (~80px) */}
      <div style={{ marginTop: '80px', pointerEvents: 'auto' }}>
        <div className="leaflet-control leaflet-bar" style={{ border: 'none' }}>
          <a
            href="#"
            role="button"
            title="Fit Indonesia"
            aria-label="Fit Indonesia"
            onClick={(e) => { e.preventDefault(); handleClick(); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#F0F4F1',
              transition: 'all 0.2s ease',
              textDecoration: 'none',
              borderRadius: '4px',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.12)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)';
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            {/* Fit-to-view icon: four arrows pointing to corners */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
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
        // Zoom to maximum level (18) for better detail
        map.flyTo([selectedAlert.lat, selectedAlert.lng], 18, {
          duration: 1.2,
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

export default function DeforestationMap({ alerts, selectedProvince, language, onSelectAlert, theme, isVisible = true }: Props) {
  // Load saved map state or use defaults
  const savedState = loadMapState();
  const initialCenter: [number, number] = savedState?.center || [-2.5, 118];
  const initialZoom = savedState?.zoom || 5;
  // Ignore persisted 'current' placeholder from old saves; fall back to 'Dark'
  const persistedLayer = savedState?.layer && savedState.layer !== 'current' ? savedState.layer : null;
  const [selectedLayer, setSelectedLayer] = useState<string>(persistedLayer ?? 'Dark');
  
  const handleLayerChange = (layerName: string) => {
    setSelectedLayer(layerName);
    const currentState = loadMapState();
    if (currentState) {
      saveMapState({
        ...currentState,
        layer: layerName
      });
    }
  };
  
  return (
    <div className="relative h-full w-full">
      <MapContainer 
        center={initialCenter} 
        zoom={initialZoom} 
        scrollWheelZoom 
        className="h-full w-full"
        zoomControl={true}
      >
        <ProvinceFocus province={selectedProvince} />
        <MapClickHandler onSelectAlert={onSelectAlert} alerts={alerts} />
        <MapStateManager />
        <LayerStateManager onLayerChange={handleLayerChange} />
        <MapResizer isVisible={isVisible} />
        <FitIndonesiaButton />
        
        <LayersControl position="topright">
          {/* Dark Mode Layers */}
          <LayersControl.BaseLayer checked={selectedLayer === 'Dark'} name="Dark">
            <TileLayer
              attribution="&copy; CartoDB"
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer checked={selectedLayer === 'Dark Satellite'} name="Dark Satellite">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>

          {/* Light Mode Layers */}
          <LayersControl.BaseLayer checked={selectedLayer === 'Light'} name="Light">
            <TileLayer
              attribution="&copy; CartoDB"
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer checked={selectedLayer === 'Street'} name="Street">
            <TileLayer
              attribution="&copy; OpenStreetMap"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          
          <LayersControl.BaseLayer checked={selectedLayer === 'Terrain'} name="Terrain">
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
    // Zoom to maximum level (18) for better detail
    map.flyTo([alert.lat, alert.lng], 18, {
      duration: 1.2,
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
