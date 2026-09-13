import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";

type DeliveryMapProps = {
  deliveryLat: number;
  deliveryLng: number;
  destinationLat: number;
  destinationLng: number;
  height: number;
};

const deliveryIcon = L.divIcon({
  html: `<div style="background:#22C55E;width:30px;height:30px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;">🛵</div>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const destinationIcon = L.divIcon({
  html: `<div style="background:#EF4444;width:30px;height:30px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:16px;">🏠</div>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(points, { padding: [40, 40] });
  }, [points, map]);
  return null;
}

export function DeliveryMapClient({ deliveryLat, deliveryLng, destinationLat, destinationLng, height }: DeliveryMapProps) {
  const points: [number, number][] = [
    [deliveryLat, deliveryLng],
    [destinationLat, destinationLng],
  ];

  return (
    <div style={{ width: "100%", height, borderRadius: 12, overflow: "hidden" }}>
      <MapContainer center={points[0]} zoom={14} style={{ width: "100%", height: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        <Marker position={points[0]} icon={deliveryIcon} />
        <Marker position={points[1]} icon={destinationIcon} />
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}