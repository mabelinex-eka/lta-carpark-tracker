import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Carpark, VehicleLotType } from '../types/carpark';
import { Navigation, Compass, Layers, Car } from 'lucide-react';

interface CarparkMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  userLocation: { lat: number; lng: number } | null;
  onLocateUser: () => void;
  selectedVehicleType: 'all' | VehicleLotType;
}

export const CarparkMap: React.FC<CarparkMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  userLocation,
  onLocateUser,
  selectedVehicleType,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center of Singapore
    const initialLat = 1.3521;
    const initialLng = 103.8198;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 12,
      zoomControl: false,
    });

    // Dark styled basemap tile layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Markers when carparks or vehicle filter change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    carparks.forEach((cp) => {
      let lotCount = cp.availableLotsCombined;
      if (selectedVehicleType === 'C' && cp.lots.C) lotCount = cp.lots.C.lots_available;
      if (selectedVehicleType === 'Y' && cp.lots.Y) lotCount = cp.lots.Y.lots_available;
      if (selectedVehicleType === 'H' && cp.lots.H) lotCount = cp.lots.H.lots_available;

      let color = '#10b981'; // emerald
      let bg = 'rgba(16, 185, 129, 0.9)';
      let border = '#059669';

      if (cp.status === 'filling_fast') {
        color = '#f59e0b';
        bg = 'rgba(245, 158, 11, 0.9)';
        border = '#d97706';
      } else if (cp.status === 'almost_full') {
        color = '#f43f5e';
        bg = 'rgba(244, 63, 94, 0.9)';
        border = '#e11d48';
      } else if (cp.status === 'full') {
        color = '#64748b';
        bg = 'rgba(100, 116, 139, 0.9)';
        border = '#475569';
      }

      const isSelected = selectedCarpark?.id === cp.id;

      // Custom HTML Marker Pin
      const customIcon = L.divIcon({
        className: 'custom-carpark-pin',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${isSelected ? '44px' : '36px'};
            height: ${isSelected ? '44px' : '36px'};
            background: ${bg};
            border: 2px solid ${isSelected ? '#ffffff' : border};
            border-radius: 9999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5), ${isSelected ? '0 0 0 4px rgba(16, 185, 129, 0.4)' : 'none'};
            color: #ffffff;
            font-family: 'JetBrains Mono', monospace;
            font-size: ${isSelected ? '13px' : '11px'};
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            transform: translate(-50%, -50%);
          ">
            <span>${lotCount > 999 ? '999+' : lotCount}</span>
            ${
              cp.free_parking
                ? '<div style="position: absolute; top:-3px; right:-3px; width:10px; height:10px; background:#fbbf24; border-radius:50%; border:2px solid #0f172a;"></div>'
                : ''
            }
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([cp.coordinates.lat, cp.coordinates.lng], { icon: customIcon });

      // Popup Content
      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; min-width: 200px; padding: 2px; color: #f8fafc;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: bold; background: #0f172a; padding: 2px 6px; border-radius: 4px; border: 1px solid #334155;">
              ${cp.id}
            </span>
            <span style="font-size: 11px; font-weight: 600; color: ${color};">
              ${cp.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px; color: #ffffff;">
            ${cp.name}
          </div>
          <div style="font-size: 11px; color: #94a3b8; margin-bottom: 8px;">
            ${cp.address}
          </div>
          <div style="background: #0f172a; padding: 6px 8px; border-radius: 6px; margin-bottom: 8px; border: 1px solid #1e293b;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-family: monospace;">
              <span style="color: #94a3b8;">Lots Available:</span>
              <span style="font-weight: bold; color: ${color};">${lotCount} / ${cp.totalLotsCombined}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 3px; color: #64748b;">
              <span>Cars: ${cp.lots.C?.lots_available ?? 0}</span>
              <span>Bikes: ${cp.lots.Y?.lots_available ?? 0}</span>
              <span>Heavy: ${cp.lots.H?.lots_available ?? 0}</span>
            </div>
          </div>
          <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 8px;">
            <strong>Rate:</strong> ${cp.rates.weekday_day.split('(')[0]}
          </div>
          <div style="display: flex; gap: 6px;">
            <button id="popup-select-${cp.id}" style="
              flex: 1;
              background: #10b981;
              color: #022c22;
              border: none;
              border-radius: 6px;
              padding: 5px 8px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            ">View Details</button>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${cp.coordinates.lat},${cp.coordinates.lng}" target="_blank" rel="noopener noreferrer" style="
              background: #334155;
              color: #f8fafc;
              text-decoration: none;
              border-radius: 6px;
              padding: 5px 8px;
              font-size: 11px;
              font-weight: 600;
              display: flex;
              align-items: center;
              justify-content: center;
            ">Nav</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        className: 'dark-leaflet-popup',
        maxWidth: 280,
      });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-select-${cp.id}`);
        if (btn) {
          btn.onclick = () => onSelectCarpark(cp);
        }
      });

      marker.on('click', () => {
        onSelectCarpark(cp);
      });

      layer.addLayer(marker);
    });
  }, [carparks, selectedCarpark, selectedVehicleType, onSelectCarpark]);

  // Pan to selected carpark
  useEffect(() => {
    if (!selectedCarpark || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [selectedCarpark.coordinates.lat, selectedCarpark.coordinates.lng],
      15,
      { duration: 1.2 }
    );
  }, [selectedCarpark]);

  // User location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-gps-marker',
          html: `
            <div style="
              position: relative;
              width: 20px;
              height: 20px;
              background: #3b82f6;
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 0 16px #3b82f6;
              transform: translate(-50%, -50%);
            ">
              <div style="
                position: absolute;
                inset: -6px;
                border-radius: 50%;
                background: rgba(59, 130, 246, 0.4);
                animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const marker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
        marker.bindTooltip('Your Location (Singapore)', { permanent: false, direction: 'top' });
        userMarkerRef.current = marker;
      }
    }
  }, [userLocation]);

  const handleRecenterSingapore = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([1.3521, 103.8198], 12, { duration: 1 });
  };

  return (
    <div className="relative w-full h-full min-h-[350px] bg-slate-950 overflow-hidden rounded-2xl border border-slate-800">
      {/* Map Leaflet Container */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Recenter Singapore */}
        <button
          onClick={handleRecenterSingapore}
          className="p-2.5 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 shadow-lg backdrop-blur-md transition active:scale-95"
          title="Recenter to Central Singapore"
        >
          <Compass className="w-4 h-4 text-emerald-400" />
        </button>

        {/* Locate Me */}
        <button
          onClick={onLocateUser}
          className="p-2.5 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/80 shadow-lg backdrop-blur-md transition active:scale-95"
          title="Zoom to My Location"
        >
          <Navigation className={`w-4 h-4 ${userLocation ? 'text-blue-400' : 'text-slate-400'}`} />
        </button>
      </div>

      {/* Legend Indicator Overlay */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-950/90 border border-slate-800/80 rounded-xl px-3 py-2 backdrop-blur-md shadow-xl text-xs flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-slate-300 text-[11px]">&gt;30 lots</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="text-slate-300 text-[11px]">10-30</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
          <span className="text-slate-300 text-[11px]">&lt;10 lots</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-300 ring-2 ring-amber-300/40"></span>
          <span className="text-slate-300 text-[11px]">Free Sun</span>
        </div>
      </div>
    </div>
  );
};
