"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import Auth from "./Auth";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Navbar,
  NavbarBrand,
  NavbarContent,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { motion } from "framer-motion";

// Dynamically import MapView with SSR disabled to avoid Leaflet SSR issues
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-zinc-100">
      <p className="text-zinc-500">Loading map...</p>
    </div>
  ),
});

type Spot = {
  id: string;
  name: string;
  neighborhood: string;
  style: string;
  note: string;
  address?: string;
  photo?: string; // base64 encoded image
  lat?: number;
  lng?: number;
};

const STYLE_OPTIONS = [
  "custom...",
  "art deco",
  "art nouveau",
  "baroque",
  "bauhaus",
  "beaux-arts",
  "brutalist",
  "contemporary",
  "deconstructivist",
  "edwardian",
  "futurist",
  "georgian",
  "gothic",
  "high-tech",
  "industrial",
  "mid-century modern",
  "minimalist",
  "modernist",
  "neoclassical",
  "postmodern",
  "renaissance",
  "romanesque",
  "vernacular",
  "victorian",
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [form, setForm] = useState({
    name: "",
    neighborhood: "",
    style: "",
    note: "",
    address: "",
    lat: "",
    lng: "",
  });
  const [customStyle, setCustomStyle] = useState("");
  const [isCustomStyle, setIsCustomStyle] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Check authentication and load spots
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        // Load spots from Supabase
        const { data, error } = await supabase
          .from('spots')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
        
        if (data) {
          setSpots(data);
        }
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const styleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    spots.forEach((spot) => {
      counts[spot.style] = (counts[spot.style] || 0) + 1;
    });
    return counts;
  }, [spots]);

  const canAdd = form.name.trim().length > 0 && (isCustomStyle ? customStyle.trim().length > 0 : form.style.trim().length > 0);

  // Calculate user stats for leaderboard
  const userStats = useMemo(() => {
    const uniqueStyles = new Set(spots.map((s) => s.style)).size;
    const uniqueNeighborhoods = new Set(
      spots.map((s) => s.neighborhood).filter((n) => n)
    ).size;
    return {
      totalSpots: spots.length,
      uniqueStyles,
      uniqueNeighborhoods,
      score: spots.length * 10 + uniqueStyles * 20 + uniqueNeighborhoods * 15,
    };
  }, [spots]);

  // Mock collections for other users
  const mockCollections: Record<string, Spot[]> = {
    ArchyExplorer: [
      { id: "1", name: "Barbican Estate", neighborhood: "City of London", style: "brutalist", note: "Iconic brutalist complex", address: "Silk St, Barbican, London EC2Y 8DS", lat: 51.5201, lng: -0.0937 },
      { id: "2", name: "St Pancras Station", neighborhood: "King's Cross", style: "gothic", note: "Victorian Gothic masterpiece", address: "Euston Rd, London N1C 4QP", lat: 51.5308, lng: -0.1263 },
      { id: "3", name: "The Gherkin", neighborhood: "City of London", style: "modernist", note: "30 St Mary Axe", address: "30 St Mary Axe, London EC3A 8EP", lat: 51.5145, lng: -0.0803 },
    ],
    CityWanderer: [
      { id: "4", name: "Tate Modern", neighborhood: "Bankside", style: "industrial", note: "Former power station", address: "Bankside, London SE1 9TG", lat: 51.5076, lng: -0.0994 },
      { id: "5", name: "Lloyd's Building", neighborhood: "City of London", style: "postmodern", note: "Inside-out architecture", address: "1 Lime St, London EC3M 7HA", lat: 51.5127, lng: -0.0820 },
    ],
    UrbanScout: [
      { id: "6", name: "Westminster Abbey", neighborhood: "Westminster", style: "gothic", note: "13th century abbey", address: "20 Deans Yd, London SW1P 3PA", lat: 51.4994, lng: -0.1273 },
      { id: "7", name: "British Museum", neighborhood: "Bloomsbury", style: "neoclassical", note: "Greek Revival design", address: "Great Russell St, London WC1B 3DG", lat: 51.5194, lng: -0.1270 },
    ],
  };

  // Mock leaderboard data (in production, this would come from a backend)
  const leaderboard = useMemo(() => {
    const mockUsers = [
      { name: "ArchyExplorer", spots: 47, styles: 8, neighborhoods: 12, score: 930 },
      { name: "CityWanderer", spots: 38, styles: 7, neighborhoods: 10, score: 760 },
      { name: "UrbanScout", spots: 32, styles: 6, neighborhoods: 9, score: 655 },
      { name: "StyleHunter", spots: 28, styles: 7, neighborhoods: 8, score: 600 },
      { name: "BuildingBuff", spots: 25, styles: 6, neighborhoods: 7, score: 565 },
    ];
    
    const currentUser = {
      name: "You",
      spots: userStats.totalSpots,
      styles: userStats.uniqueStyles,
      neighborhoods: userStats.uniqueNeighborhoods,
      score: userStats.score,
      isCurrentUser: true,
    };

    // Insert current user and sort by score
    const allUsers = [...mockUsers, currentUser].sort((a, b) => b.score - a.score);
    return allUsers.slice(0, 6); // Top 6 including user
  }, [userStats]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB for localStorage)
      if (file.size > 2 * 1024 * 1024) {
        alert("Photo too large! Please choose an image under 2MB.");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdd = () => {
    if (!canAdd) return;
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const next: Spot = {
      id: `${Date.now()}`,
      name: form.name.trim(),
      neighborhood: form.neighborhood.trim(),
      style: isCustomStyle ? customStyle.trim() : form.style.trim(),
      note: form.note.trim(),
      address: form.address.trim(),
      photo: photoPreview || undefined,
      lat: hasCoords ? lat : undefined,
      lng: hasCoords ? lng : undefined,
    };
    setSpots((prev) => [next, ...prev]);
    setForm({ name: "", neighborhood: "", style: "", note: "", address: "", lat: "", lng: "" });
    setCustomStyle("");
    setIsCustomStyle(false);
    setPhotoPreview(null);
  };

  const handleSearch = async (query: string) => {
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )},London,UK&format=json&addressdetails=1&limit=5`,
        {
          headers: {
            "User-Agent": "Archy App",
          },
        }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    const name =
      result.name ||
      result.address?.building ||
      result.address?.house_name ||
      result.address?.amenity ||
      result.address?.road ||
      "";
    const neighborhood =
      result.address?.suburb ||
      result.address?.neighbourhood ||
      result.address?.city_district ||
      result.address?.town ||
      "";
    const address = result.display_name || "";

    setForm({
      ...form,
      name: name,
      neighborhood: neighborhood,
      address: address,
      lat: lat.toFixed(5),
      lng: lng.toFixed(5),
    });
    
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleMapClick = async (lat: number, lng: number) => {
    // Set coordinates immediately
    setForm((prev) => ({
      ...prev,
      lat: lat.toFixed(5),
      lng: lng.toFixed(5),
    }));

    // Fetch location details from Nominatim API
    setIsGeocodingLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          headers: {
            "User-Agent": "Archy App",
          },
        }
      );
      const data = await response.json();

      if (data && data.address) {
        const address = data.address;
        const name =
          data.name ||
          address.building ||
          address.house_name ||
          address.amenity ||
          address.road ||
          "";
        const neighborhood =
          address.suburb ||
          address.neighbourhood ||
          address.city_district ||
          address.town ||
          address.city ||
          "";
        const fullAddress = data.display_name || "";

        setForm((prev) => ({
          ...prev,
          name: name,
          neighborhood: neighborhood,
          address: fullAddress,
        }));
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  const mapCenter = useMemo<[number, number]>(() => {
    const withCoords = spots.find(
      (spot) => typeof spot.lat === "number" && typeof spot.lng === "number"
    );
    if (withCoords && withCoords.lat !== undefined && withCoords.lng !== undefined) {
      return [withCoords.lat, withCoords.lng];
    }
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
    return [51.5074, -0.1278]; // Central London
  }, [form.lat, form.lng, spots]);

  const mapPin = useMemo<[number, number] | null>(() => {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
  }, [form.lat, form.lng]);


  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed_0%,_#fef3c7_28%,_#f8fafc_60%,_#fff_100%)] text-zinc-900">
      <Navbar className="bg-transparent">
        <NavbarBrand className="gap-2">
          <div className="h-9 w-9 rounded-xl bg-amber-200/70 flex items-center justify-center font-[family-name:var(--font-space-grotesk)] font-bold text-zinc-900">
            A
          </div>
          <span className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold">
            Archy
          </span>
        </NavbarBrand>
        <NavbarContent justify="end">
          <Chip className="bg-zinc-900 text-amber-100">collect the city</Chip>
        </NavbarContent>
      </Navbar>

      <main className="px-6 pb-16 pt-6 md:px-10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto flex max-w-6xl flex-col gap-4"
        >
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl sm:text-6xl font-bold tracking-tight">
            Archy
          </h1>
          <p className="text-lg sm:text-xl text-zinc-700">Collect the city.</p>
          <div className="flex flex-wrap gap-2">
            {[
              "unlock architecture spots",
              "earn style badges",
              "log notes from your walk",
            ].map((label) => (
              <Chip key={label} variant="flat" className="bg-amber-100 text-amber-900">
                {label}
              </Chip>
            ))}
          </div>
        </motion.section>

        <div className="mx-auto mt-10 grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-white/80 border border-amber-100 shadow-sm">
            <CardHeader className="flex flex-col items-start gap-2">
              <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                start a walk
              </h2>
              <p className="text-zinc-600">
                add a spot each time you find a building that feels special.
              </p>
            </CardHeader>
            <Divider className="bg-amber-100" />
            <CardBody className="gap-4">
              <div className="relative">
                <Input
                  label="🔍 search for a building or address"
                  placeholder="e.g. Big Ben, Tower Bridge, St Paul's Cathedral"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    handleSearch(e.target.value);
                  }}
                  description="Type at least 3 characters to search"
                />
                {isSearching && (
                  <p className="text-xs text-amber-600 mt-1">Searching...</p>
                )}
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border-2 border-amber-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectSearchResult(result)}
                        className="w-full text-left p-3 hover:bg-amber-50 border-b border-amber-100 last:border-b-0 transition-colors"
                      >
                        <p className="font-semibold text-sm text-zinc-900">
                          {result.name || result.display_name.split(",")[0]}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {result.display_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Divider className="bg-amber-100/50" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="spot name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  description={isGeocodingLoading ? "Loading location..." : ""}
                />
                <Input
                  label="neighborhood"
                  value={form.neighborhood}
                  onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                />
              </div>
              <Input
                label="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                description="Auto-filled when you click the map"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="latitude"
                  placeholder="e.g. 40.7128"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                />
                <Input
                  label="longitude"
                  placeholder="e.g. -74.0060"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                />
              </div>
              {!isCustomStyle ? (
                <Select
                  label="style badge"
                  selectedKeys={form.style ? [form.style] : []}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0]?.toString() || "";
                    if (selected === "custom...") {
                      setIsCustomStyle(true);
                      setForm({ ...form, style: "" });
                    } else {
                      setForm({ ...form, style: selected });
                    }
                  }}
                >
                  {STYLE_OPTIONS.map((style) => (
                    <SelectItem key={style}>
                      {style}
                    </SelectItem>
                  ))}
                </Select>
              ) : (
                <div>
                  <Input
                    label="custom style name"
                    placeholder="e.g. neo-futurism, eclectic, etc."
                    value={customStyle}
                    onChange={(e) => setCustomStyle(e.target.value)}
                    description="Enter your own architectural style"
                  />
                  <button
                    onClick={() => {
                      setIsCustomStyle(false);
                      setCustomStyle("");
                    }}
                    className="text-xs text-amber-600 hover:text-amber-700 hover:underline mt-2"
                  >
                    ← back to style list
                  </button>
                </div>
              )}
              <Textarea
                label="notes"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                minRows={3}
              />
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  📸 add photo or sketch (optional)
                </label>
                <p className="text-xs text-zinc-500 mb-2">
                  Upload a photo or your own drawing/sketch of the building
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer"
                />
                {photoPreview && (
                  <div className="mt-3 relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg border-2 border-amber-200"
                    />
                    <button
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
              <Button
                className="bg-zinc-900 text-amber-100"
                onPress={handleAdd}
                isDisabled={!canAdd}
              >
                add this spot
              </Button>
            </CardBody>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="bg-white/85 border border-amber-100 shadow-sm overflow-hidden">
              <CardHeader className="flex flex-col items-start gap-2">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold">
                  pin it on the map
                </h3>
                <p className="text-zinc-600">
                  click the map to drop a pin and auto-fill location details.
                </p>
              </CardHeader>
              <Divider className="bg-amber-100" />
              <CardBody className="p-0">
                <div className="h-[340px] w-full">
                  <MapView
                    spots={spots}
                    otherUserSpots={viewingUser ? mockCollections[viewingUser] || [] : []}
                    otherUserName={viewingUser}
                    mapCenter={mapCenter}
                    mapPin={mapPin}
                    onMapClick={handleMapClick}
                  />
                </div>
              </CardBody>
            </Card>
            {mapPin && (
              <Card className="bg-white/85 border border-amber-100 shadow-sm overflow-hidden">
                <CardHeader className="flex flex-col items-start gap-2">
                  <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold">
                    street view
                  </h3>
                  <p className="text-zinc-600">
                    see what it looks like at street level.
                  </p>
                </CardHeader>
                <Divider className="bg-amber-100" />
                <CardBody className="p-0">
                  <div className="h-[300px] w-full">
                    <iframe
                      src={`https://www.google.com/maps/embed/v1/streetview?key=AIzaSyAOVYRIgupAurZup5y1PRh8Ismb1A3lLao&location=${mapPin[0]},${mapPin[1]}&heading=0&pitch=0&fov=90`}
                      className="w-full h-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Street View"
                    />
                  </div>
                </CardBody>
              </Card>
            )}
            <Card className="bg-white/85 border border-amber-100 shadow-sm">
              <CardHeader className="flex flex-col items-start gap-2">
                <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold">
                  your collection
                </h2>
                <p className="text-zinc-600">
                  everything you have collected so far.
                </p>
              </CardHeader>
              <Divider className="bg-amber-100" />
              <CardBody className="gap-3">
                {spots.length === 0 ? (
                  <p className="text-zinc-500">no spots yet.</p>
                ) : (
                  spots.map((spot) => (
                    <div key={spot.id} className="rounded-xl border border-amber-100/80 p-3">
                      {spot.photo && (
                        <img
                          src={spot.photo}
                          alt={spot.name}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{spot.name}</span>
                        <Chip size="sm" className="bg-amber-100 text-amber-900">
                          {spot.style}
                        </Chip>
                      </div>
                      {spot.neighborhood && (
                        <p className="text-sm text-zinc-500">{spot.neighborhood}</p>
                      )}
                      {spot.address && (
                        <p className="text-xs text-zinc-400 mt-1">📍 {spot.address}</p>
                      )}
                      {spot.note && <p className="text-sm text-zinc-700 mt-2">{spot.note}</p>}
                    </div>
                  ))
                )}
              </CardBody>
            </Card>

            <Card className="bg-white/85 border border-amber-100 shadow-sm">
              <CardHeader className="flex flex-col items-start gap-2">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold">
                  style badges
                </h3>
                <p className="text-zinc-600">your current badge counts.</p>
              </CardHeader>
              <Divider className="bg-amber-100" />
              <CardBody className="flex flex-wrap gap-2">
                {Object.keys(styleCounts).length === 0 ? (
                  <p className="text-zinc-500">add your first spot to earn a badge.</p>
                ) : (
                  Object.entries(styleCounts).map(([style, count]) => (
                    <Chip key={style} className="bg-zinc-900 text-amber-100">
                      {style} · {count}
                    </Chip>
                  ))
                )}
              </CardBody>
            </Card>

            <Card className="bg-white/85 border border-amber-100 shadow-sm">
              <CardHeader className="flex flex-col items-start gap-2">
                <h3 className="font-[family-name:var(--font-space-grotesk)] text-xl font-semibold">
                  🏆 leaderboard
                </h3>
                <p className="text-zinc-600">top collectors this week. click to view their spots!</p>
              </CardHeader>
              <Divider className="bg-amber-100" />
              <CardBody className="gap-2">
                {leaderboard.map((user, index) => (
                  <div
                    key={user.name}
                    onClick={() => !user.isCurrentUser && setViewingUser(user.name)}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      user.isCurrentUser
                        ? "bg-amber-100/70 border-2 border-amber-300"
                        : "bg-zinc-50/50 hover:bg-zinc-100 cursor-pointer"
                    } transition-colors`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                        index === 0
                          ? "bg-amber-400 text-amber-900"
                          : index === 1
                          ? "bg-zinc-300 text-zinc-700"
                          : index === 2
                          ? "bg-amber-600/40 text-amber-900"
                          : "bg-zinc-200 text-zinc-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          user.isCurrentUser ? "text-amber-900" : "text-zinc-900"
                        }`}
                      >
                        {user.name}
                        {user.isCurrentUser && " 👈"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {user.spots} spots · {user.styles} styles · {user.neighborhoods} areas
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-amber-600">{user.score}</p>
                      <p className="text-xs text-zinc-400">pts</p>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-zinc-400 mt-2 text-center">
                  Score = spots×10 + styles×20 + areas×15
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>

      {/* User Collection Modal */}
      <Modal 
        isOpen={viewingUser !== null} 
        onClose={() => setViewingUser(null)}
        size="3xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold">
              {viewingUser}'s Collection
            </h2>
            <p className="text-sm text-zinc-500 font-normal">
              {viewingUser && mockCollections[viewingUser]?.length || 0} spots collected
            </p>
          </ModalHeader>
          <ModalBody className="gap-4 pb-6">
            {viewingUser && mockCollections[viewingUser] && mockCollections[viewingUser].length > 0 && (
              <div className="h-[300px] w-full rounded-lg overflow-hidden border-2 border-amber-200">
                <MapView
                  spots={[]}
                  otherUserSpots={mockCollections[viewingUser]}
                  otherUserName={viewingUser}
                  mapCenter={
                    mockCollections[viewingUser][0].lat && mockCollections[viewingUser][0].lng
                      ? [mockCollections[viewingUser][0].lat, mockCollections[viewingUser][0].lng]
                      : [51.5074, -0.1278]
                  }
                  mapPin={null}
                  onMapClick={() => {}}
                />
              </div>
            )}
            {viewingUser && mockCollections[viewingUser] ? (
              mockCollections[viewingUser].map((spot) => (
                <Card key={spot.id} className="bg-zinc-50 border border-amber-100">
                  <CardBody className="gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-lg">{spot.name}</span>
                      <Chip size="sm" className="bg-amber-100 text-amber-900">
                        {spot.style}
                      </Chip>
                    </div>
                    {spot.neighborhood && (
                      <p className="text-sm text-zinc-500">{spot.neighborhood}</p>
                    )}
                    {spot.address && (
                      <p className="text-xs text-zinc-400">📍 {spot.address}</p>
                    )}
                    {spot.note && (
                      <p className="text-sm text-zinc-700 mt-1 italic">"{spot.note}"</p>
                    )}
                    {spot.lat && spot.lng && (
                      <p className="text-xs text-blue-500 mt-1">
                        📍 {spot.lat.toFixed(4)}, {spot.lng.toFixed(4)}
                      </p>
                    )}
                  </CardBody>
                </Card>
              ))
            ) : (
              <p className="text-zinc-500 text-center py-8">No spots collected yet.</p>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
