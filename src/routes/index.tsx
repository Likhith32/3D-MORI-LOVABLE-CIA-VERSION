import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, useCallback } from "react";
import CesiumMap, { type MapHandle } from "@/components/explorer/CesiumMap";
import Navbar from "@/components/explorer/Navbar";
import Sidebar from "@/components/explorer/Sidebar";
import Minimap from "@/components/explorer/Minimap";
import LocationCard from "@/components/explorer/LocationCard";
import TourPanel from "@/components/explorer/TourPanel";
import SmartHud from "@/components/explorer/SmartHud";
import StartTourFab from "@/components/explorer/StartTourFab";
import LoadingVeil from "@/components/explorer/LoadingVeil";
import { CAMPUS_CENTER, TOUR_STOPS, type Location, CATEGORY_META } from "@/lib/explorer/locations";

export const Route = createFileRoute("/")({
  component: Explorer,
  ssr: false,
});

import LayerSwitcher from "@/components/explorer/LayerSwitcher";
import ViewController from "@/components/explorer/ViewController";
import { useEffect } from "react";

function Explorer() {
  const mapRef = useRef<MapHandle>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Location | null>(null);
  const [hovered, setHovered] = useState<Location | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(null);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleHover = useCallback((loc: Location | null, pos?: { x: number; y: number }) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    if (selected) {
      setHovered(null);
      return;
    }
    if (loc) {
      setHoveredPos(pos || null);
      setHovered(loc);
    } else {
      hideTimeoutRef.current = setTimeout(() => {
        setHovered(null);
      }, 300);
    }
  }, [selected]);
  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [activeMode, setActiveMode] = useState("cinematic");
  const [activeLayer, setActiveLayer] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("mori-map-imagery") || "satellite";
    }
    return "satellite";
  });

  const [camera, setCamera] = useState({
    lon: CAMPUS_CENTER.lon,
    lat: CAMPUS_CENTER.lat,
    heading: 0,
    height: 1400,
  });

  const handleLayerChange = (id: string) => {
    setActiveLayer(id);
    localStorage.setItem("mori-map-imagery", id);
    mapRef.current?.setImagery(id);
  };

  const handleModeChange = (id: string) => {
    setActiveMode(id);
    mapRef.current?.setViewMode(id);
  };

  const goTo = useCallback((loc: Location) => {
    setSelected(loc);
    mapRef.current?.flyToLocation(loc);
    // Reset to free or cinematic view logic? Clicking location should not restrict users but clear modes.
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map background */}
      <div className="absolute inset-0">
        <CesiumMap
          ref={mapRef}
          onReady={() => setReady(true)}
          onSelect={(loc) => setSelected(loc)}
          onHover={handleHover}
          onCameraChange={setCamera}
        />
        {/* Soft vignette for premium feel */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 0%, transparent 60%, rgba(10, 25, 30, 0.18) 100%)",
          }}
        />
      </div>

      <LoadingVeil visible={!ready} />

      <Navbar onSelect={goTo} onStartTour={() => { setTourIndex(0); setTourActive(true); }} />
      <Sidebar onSelect={goTo} onResetView={() => mapRef.current?.resetView()} />
      <SmartHud />

      <StartTourFab onClick={() => { setTourIndex(0); setTourActive(true); }} />

      <ViewController activeMode={activeMode} onModeChange={handleModeChange} />
      <LayerSwitcher currentLayer={activeLayer} onChange={handleLayerChange} />

      <Minimap
        cameraLon={camera.lon}
        cameraLat={camera.lat}
        cameraHeading={camera.heading}
        onSelect={goTo}
        activeLayer={activeLayer}
      />

      <LocationCard
        location={selected}
        onClose={() => setSelected(null)}
        onNavigate={(l) => mapRef.current?.flyToLocation(l, { pitch: -28, duration: 2.8 })}
      />

      {/* Interactive Hover Tooltip Speech Bubble */}
      {hovered && hoveredPos && !selected && (
        <div
          onMouseEnter={() => {
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            setHovered(null);
          }}
          className="absolute z-40 bg-zinc-950/90 backdrop-blur-md border border-white/10 text-white rounded-2xl p-4 shadow-xl pointer-events-auto flex flex-col gap-2 min-w-[220px]"
          style={{
            left: `${hoveredPos.x}px`,
            top: `${hoveredPos.y}px`,
            transform: "translate(-50%, -125%)",
          }}
        >
          {/* Notch pointer */}
          <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950/90 border-r border-b border-white/10 rotate-45" />

          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: CATEGORY_META[hovered.category].ring }}
            />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
              {CATEGORY_META[hovered.category].label}
            </span>
          </div>
          <div className="text-sm font-extrabold tracking-tight">{hovered.name}</div>
          <button
            onClick={() => {
              setSelected(hovered);
              setHovered(null);
            }}
            className="mt-1 w-full bg-cyan-500 hover:bg-cyan-600 text-black text-xs font-bold py-2 px-3 rounded-xl transition-all active:scale-[0.97] cursor-pointer"
          >
            Know more &rarr;
          </button>
        </div>
      )}

      <TourPanel
        active={tourActive}
        index={tourIndex}
        onPrev={() => setTourIndex((i) => Math.max(0, i - 1))}
        onNext={() => {
          if (tourIndex >= TOUR_STOPS.length - 1) {
            setTourActive(false);
            mapRef.current?.resetView();
          } else {
            setTourIndex((i) => i + 1);
          }
        }}
        onClose={() => setTourActive(false)}
        onGo={(loc) => mapRef.current?.flyToLocation(loc, { duration: 3.2, pitch: -32 })}
      />
    </div>
  );
}
