"use client";

import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import iconUrl from "leaflet/dist/images/marker-icon.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";

type Spot = {
  id: string;
  name: string;
  neighborhood: string;
  style: string;
  note: string;
  lat?: number;
  lng?: number;
};

interface MapViewProps {
  spots: Spot[];
  otherUserSpots?: Spot[];
  otherUserName?: string | null;
  mapCenter: [number, number];
  mapPin: [number, number] | null;
  onMapClick: (lat: number, lng: number) => void;
}

const MapPinSelector = ({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
};

// Component to handle map re-centering when coordinates change
const MapCenterHandler = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  
  useEffect(() => {
    // Fly to new center with smooth animation
    map.flyTo(center, 13, {
      duration: 1.5,
    });
  }, [center, map]);
  
  return null;
};

export default function MapView({ spots, otherUserSpots = [], otherUserName, mapCenter, mapPin, onMapClick }: MapViewProps) {
  useEffect(() => {
    // Fix Leaflet default marker icons in bundled builds
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: string })
      ._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
    });
  }, []);

  // Create custom blue icon for other users' spots
  const blueIcon = useMemo(
    () =>
      typeof window !== "undefined"
        ? new L.Icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
            shadowUrl,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          })
        : null,
    []
  );

  return (
    <MapContainer
      center={mapCenter}
      zoom={13}
      className="h-full w-full"
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapPinSelector onSelect={onMapClick} />
      <MapCenterHandler center={mapCenter} />
      {mapPin && (
        <Marker position={mapPin}>
          <Popup>new spot</Popup>
        </Marker>
      )}
      {spots
        .filter(
          (spot) =>
            typeof spot.lat === "number" && typeof spot.lng === "number"
        )
        .map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat as number, spot.lng as number]}
          >
            <Popup>
              <div className="font-semibold">{spot.name}</div>
              <div className="text-xs text-zinc-600">{spot.style}</div>
            </Popup>
          </Marker>
        ))}
      {/* Other user's spots with blue markers */}
      {otherUserSpots
        .filter(
          (spot) =>
            typeof spot.lat === "number" && typeof spot.lng === "number"
        )
        .map((spot) => (
          <Marker
            key={spot.id}
            position={[spot.lat as number, spot.lng as number]}
            icon={blueIcon || undefined}
          >
            <Popup>
              <div>
                <div className="font-semibold text-blue-600">{spot.name}</div>
                <div className="text-xs text-zinc-600">{spot.style}</div>
                {otherUserName && (
                  <div className="text-xs text-blue-500 mt-1">by {otherUserName}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
