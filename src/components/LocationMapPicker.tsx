"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, ExternalLink, Loader2, Info } from "lucide-react";

interface LocationMapPickerProps {
  latitude: string | number | null | undefined;
  longitude: string | number | null | undefined;
  onChange: (lat: string, lng: string) => void;
  disabled?: boolean;
}

export function LocationMapPicker({
  latitude,
  longitude,
  onChange,
  disabled = false,
}: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerInstanceRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Parse current coordinates
  const currentLat = latitude !== null && latitude !== undefined && String(latitude).trim() !== "" ? parseFloat(String(latitude)) : null;
  const currentLng = longitude !== null && longitude !== undefined && String(longitude).trim() !== "" ? parseFloat(String(longitude)) : null;
  const hasValidCoords = currentLat !== null && currentLng !== null && !isNaN(currentLat) && !isNaN(currentLng);

  // Load Leaflet CSS & JS dynamically in the browser
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      // 1. Inject Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      // 2. Inject Leaflet JS if not available
      if (!(window as any).L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Leaflet script"));
          document.body.appendChild(script);
        });
      }

      if (isMounted) {
        setMapLoaded(true);
      }
    };

    loadLeaflet().catch((err) => {
      console.error("Leaflet load error:", err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize or update Leaflet Map
  useEffect(() => {
    if (!mapLoaded || !mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    // Default center: Sri Lanka [7.8731, 80.7718]
    const initialLat = hasValidCoords && currentLat !== null ? currentLat : 7.8731;
    const initialLng = hasValidCoords && currentLng !== null ? currentLng : 80.7718;
    const initialZoom = hasValidCoords ? 14 : 7;

    // Custom modern pin SVG icon
    const pinIcon = L.divIcon({
      className: "custom-map-pin-container",
      html: `
        <div style="position: relative; width: 34px; height: 34px; transform: translate(-50%, -100%);">
          <div style="background-color: #1e3a8a; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.35);">
            <div style="width: 10px; height: 10px; background: #ffffff; border-radius: 50%;"></div>
          </div>
          <div style="position: absolute; bottom: -4px; left: 16px; width: 8px; height: 4px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1px);"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    if (!mapInstanceRef.current) {
      // Create map instance
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      }).addTo(map);

      // Handle Map Click to place / move marker
      map.on("click", (e: any) => {
        if (disabled) return;
        const lat = parseFloat(e.latlng.lat.toFixed(6));
        const lng = parseFloat(e.latlng.lng.toFixed(6));
        onChange(String(lat), String(lng));
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Handle marker positioning
    if (hasValidCoords && currentLat !== null && currentLng !== null) {
      if (!markerInstanceRef.current) {
        const marker = L.marker([currentLat, currentLng], {
          icon: pinIcon,
          draggable: !disabled,
        }).addTo(map);

        marker.on("dragend", () => {
          if (disabled) return;
          const pos = marker.getLatLng();
          onChange(pos.lat.toFixed(6), pos.lng.toFixed(6));
        });

        markerInstanceRef.current = marker;
      } else {
        markerInstanceRef.current.setLatLng([currentLat, currentLng]);
      }
    } else {
      if (markerInstanceRef.current) {
        map.removeLayer(markerInstanceRef.current);
        markerInstanceRef.current = null;
      }
    }
  }, [mapLoaded, currentLat, currentLng, hasValidCoords, disabled, onChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  // Handle "Use Live Location"
  const handleDetectLiveLocation = () => {
    if (disabled) return;
    setGeoError(null);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        setGeoLoading(false);

        onChange(String(lat), String(lng));

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
        }
      },
      (error) => {
        setGeoLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeoError("Location permission denied. Please allow location access in your browser settings or select on the map manually.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeoError("Location information unavailable. Please select your location on the map.");
            break;
          case error.TIMEOUT:
            setGeoError("Location request timed out. Please try again or click the map directly.");
            break;
          default:
            setGeoError("An unexpected error occurred while fetching your location.");
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleManualCoordChange = (field: "lat" | "lng", val: string) => {
    if (disabled) return;
    const clean = val.trim();
    if (field === "lat") {
      onChange(clean, longitude ? String(longitude) : "");
      const num = parseFloat(clean);
      if (!isNaN(num) && mapInstanceRef.current && currentLng !== null) {
        mapInstanceRef.current.setView([num, currentLng], mapInstanceRef.current.getZoom());
      }
    } else {
      onChange(latitude ? String(latitude) : "", clean);
      const num = parseFloat(clean);
      if (!isNaN(num) && mapInstanceRef.current && currentLat !== null) {
        mapInstanceRef.current.setView([currentLat, num], mapInstanceRef.current.getZoom());
      }
    }
  };

  return (
    <div className="space-y-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
      {/* Header with Live Location Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
            <MapPin className="w-3.5 h-3.5 text-blue-900" />
            <span>Facility / Plant Location on Map</span>
          </span>
          <span className="text-[11px] text-slate-500 block">
            Click anywhere on the map to pin your location, or use your device GPS.
          </span>
        </div>

        <button
          type="button"
          onClick={handleDetectLiveLocation}
          disabled={disabled || geoLoading}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 active:bg-blue-950 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all shrink-0"
        >
          {geoLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Detecting Location...</span>
            </>
          ) : (
            <>
              <Navigation className="w-3.5 h-3.5" />
              <span>Use Live Location</span>
            </>
          )}
        </button>
      </div>

      {/* Geolocation Error Alert if any */}
      {geoError && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-start gap-2 animate-fadeIn">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Interactive Map Box */}
      <div className="relative w-full h-56 sm:h-64 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 shadow-inner z-0">
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 text-xs gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-900" />
            <span>Loading interactive map...</span>
          </div>
        )}
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* Latitude & Longitude Input Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Latitude:
          </label>
          <input
            type="text"
            value={latitude !== null && latitude !== undefined ? String(latitude) : ""}
            onChange={(e) => handleManualCoordChange("lat", e.target.value)}
            disabled={disabled}
            placeholder="e.g. 6.927079"
            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono shadow-xs"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
            Longitude:
          </label>
          <input
            type="text"
            value={longitude !== null && longitude !== undefined ? String(longitude) : ""}
            onChange={(e) => handleManualCoordChange("lng", e.target.value)}
            disabled={disabled}
            placeholder="e.g. 79.861244"
            className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-800 font-mono shadow-xs"
          />
        </div>
      </div>

      {/* External Map Verification Link if coordinates exist */}
      {hasValidCoords && currentLat !== null && currentLng !== null && (
        <div className="pt-1 flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            Selected: <strong className="text-blue-950 font-mono">{currentLat.toFixed(5)}, {currentLng.toFixed(5)}</strong>
          </span>
          <a
            href={`https://www.google.com/maps?q=${currentLat},${currentLng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-blue-900 hover:text-blue-700 hover:underline"
          >
            <span>View on Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
