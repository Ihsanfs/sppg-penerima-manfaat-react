"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip } from "react-leaflet";
import type { GisInstitution } from "@/lib/types";

const institutionIcon = L.divIcon({
  className: "sppg-map-marker",
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#059669;border:3px solid white;box-shadow:0 4px 12px rgba(5,150,105,.45)"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -26],
});

const hubIcon = L.divIcon({
  className: "sppg-map-marker",
  html: `<div style="width:36px;height:36px;border-radius:12px;background:#0f172a;border:3px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:14px;box-shadow:0 4px 14px rgba(15,23,42,.4)">S</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export function MapView({
  institutions,
  hub,
  simulation,
}: {
  institutions: GisInstitution[];
  hub: { lat: number; lon: number; nama: string } | null;
  simulation: boolean;
}) {
  const points = institutions
    .map((item) => ({
      ...item,
      lat: Number(item.latitude),
      lon: Number(item.longitude),
    }))
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lon));

  const center: [number, number] = hub
    ? [hub.lat, hub.lon]
    : points.length
      ? [
          points.reduce((sum, item) => sum + item.lat, 0) / points.length,
          points.reduce((sum, item) => sum + item.lon, 0) / points.length,
        ]
      : [-7.19, 107.88];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom
      className="h-[30rem] w-full"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {hub && (
        <>
          <Marker position={[hub.lat, hub.lon]} icon={hubIcon}>
            <Popup>
              <strong>{hub.nama}</strong>
              <br />
              Pusat distribusi SPPG
            </Popup>
            <Tooltip permanent direction="top" offset={[0, -12]}>
              SPPG
            </Tooltip>
          </Marker>
          {simulation && (
            <Circle center={[hub.lat, hub.lon]} radius={15000} pathOptions={{ color: "#059669", fillOpacity: 0.04 }} />
          )}
        </>
      )}

      {points.map((item) => (
        <Marker key={item.id} position={[item.lat, item.lon]} icon={institutionIcon}>
          <Popup>
            <div className="text-sm">
              <strong>{item.nama}</strong>
              <br />
              <span className="text-xs text-slate-500">{item.tipe} · {item.jumlah} penerima</span>
              {item.alamat && <><br /><span className="text-xs">{item.alamat}</span></>}
            </div>
          </Popup>
          <Tooltip direction="top" offset={[0, -12]}>
            {item.nama}
          </Tooltip>
        </Marker>
      ))}

      {simulation && hub &&
        points.map((item) => (
          <Polyline
            key={`route-${item.id}`}
            positions={[[hub.lat, hub.lon], [item.lat, item.lon]]}
            pathOptions={{ color: "#10b981", weight: 1.5, dashArray: "6 6", opacity: 0.7 }}
          />
        ))}
    </MapContainer>
  );
}
