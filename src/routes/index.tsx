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
import { CAMPUS_CENTER, TOUR_STOPS, type Location } from "@/lib/explorer/locations";

export const Route = createFileRoute("/")({
  component: Explorer,
  ssr: false,
});

function Explorer() {
  const mapRef = useRef<MapHandle>(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<Location | null>(null);
  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);
  const [camera, setCamera] = useState({
    lon: CAMPUS_CENTER.lon,
    lat: CAMPUS_CENTER.lat,
    heading: 0,
    height: 1400,
  });

  const goTo = useCallback((loc: Location) => {
    setSelected(loc);
    mapRef.current?.flyToLocation(loc);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Map background */}
      <div className="absolute inset-0">
        <CesiumMap
          ref={mapRef}
          onReady={() => setReady(true)}
          onSelect={(loc) => setSelected(loc)}
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

      <Minimap
        cameraLon={camera.lon}
        cameraLat={camera.lat}
        cameraHeading={camera.heading}
        onSelect={goTo}
      />

      <LocationCard
        location={selected}
        onClose={() => setSelected(null)}
        onNavigate={(l) => mapRef.current?.flyToLocation(l, { pitch: -28, duration: 2.8 })}
      />

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
