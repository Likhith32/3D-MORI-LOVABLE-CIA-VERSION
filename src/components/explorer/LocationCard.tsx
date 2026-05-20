import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Navigation, Clock, Footprints, Heart, Share2, MapPin } from "lucide-react";
import { CATEGORY_META, type Location, CAMPUS_CENTER } from "@/lib/explorer/locations";
import { cn } from "@/lib/utils";

type Props = {
  location: Location | null;
  onClose: () => void;
  onNavigate: (loc: Location) => void;
};

function distanceMeters(a: { lon: number; lat: number }, b: { lon: number; lat: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function LocationCard({ location, onClose, onNavigate }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Reset image carousel index when location changes
  useEffect(() => {
    setActiveIndex(0);
  }, [location]);

  // Auto-play timer for the carousel
  useEffect(() => {
    if (!location || !location.images || location.images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % location.images!.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [location]);

  const images = location?.images || (location?.image ? [location.image] : []);

  return (
    <AnimatePresence>
      {location && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 pointer-events-none">
          {/* Dark Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/75 backdrop-blur-md pointer-events-auto"
          />

          {/* Modal Container: Occupying 80-90% of screen */}
          <motion.div
            key={location.id}
            initial={{ opacity: 0, scale: 0.93, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-[90vw] max-w-5xl h-[85vh] glass-strong rounded-[28px] overflow-hidden flex flex-col pointer-events-auto border border-white/10 shadow-2xl z-10"
          >
            {/* Top Vertical 40% for the Image Carousel */}
            <div className="relative h-[40%] w-full overflow-hidden bg-black/40 shrink-0">
              <AnimatePresence mode="wait">
                {images.length > 0 ? (
                  <motion.img
                    key={activeIndex}
                    src={images[activeIndex]}
                    alt={location.name}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(120% 100% at 0% 0%, ${CATEGORY_META[location.category].color} 0%, transparent 60%), linear-gradient(135deg, color-mix(in oklab, ${CATEGORY_META[location.category].color} 30%, white), white)`,
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Ambient shading overlays for content readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/35" />

              {/* Top-right Floating Close button */}
              <button
                onClick={onClose}
                className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full bg-black/45 hover:bg-black/65 text-white border border-white/10 hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Carousel Arrows and indicators */}
              {images.length > 1 && (
                <>
                  <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
                      }}
                      className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/30 hover:bg-black/55 text-white border border-white/5 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                    >
                      &larr;
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveIndex((prev) => (prev + 1) % images.length);
                      }}
                      className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-black/30 hover:bg-black/55 text-white border border-white/5 backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                    >
                      &rarr;
                    </button>
                  </div>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-black/25 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveIndex(i)}
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          i === activeIndex ? "w-6 bg-white" : "w-2 bg-white/40"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Corner Metadata Badge and Title */}
              <div className="absolute bottom-5 left-6 right-6 z-10 flex items-end justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/95 text-cyan-600 shadow-md shrink-0">
                    <MapPin className="h-5.5 w-5.5" style={{ color: CATEGORY_META[location.category].ring }} />
                  </span>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-300 drop-shadow-md">
                      {CATEGORY_META[location.category].label}
                    </span>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-none mt-1 drop-shadow-md">
                      {location.name}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Vertical 60% for details columns */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 bg-zinc-950/80 backdrop-blur-xl text-zinc-100 flex flex-col justify-between">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {/* Information Columns */}
                <div className="md:col-span-2 flex flex-col justify-between space-y-6">
                  <div>
                    <h4 className="text-xs font-bold tracking-widest text-cyan-400 uppercase">Building Description</h4>
                    <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-zinc-300 font-medium">
                      {location.description}
                    </p>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
                      <Clock className="h-5 w-5 text-cyan-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-zinc-400 block font-semibold">Hours of Operation</span>
                        <span className="text-sm font-bold text-zinc-100">{location.hours || "Varies by schedule"}</span>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-3">
                      <Footprints className="h-5 w-5 text-cyan-400 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs text-zinc-400 block font-semibold">Walk Distance</span>
                        <span className="text-sm font-bold text-zinc-100">~{Math.round(distanceMeters(CAMPUS_CENTER, location) / 80)} min walk</span>
                        <span className="text-[10px] text-zinc-500 block">({Math.round(distanceMeters(CAMPUS_CENTER, location))}m from center)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Action panel */}
                <div className="bg-white/5 border border-white/10 rounded-[20px] p-5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">Geospatial Coordinates</h4>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <Navigation className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <span className="text-xs text-zinc-400 block font-medium">Coordinate System</span>
                        <span className="text-[10px] font-mono text-zinc-200">LON: {location.lon.toFixed(6)}°<br/>LAT: {location.lat.toFixed(6)}°</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-6">
                    <button
                      onClick={() => onNavigate(location)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 active:scale-[0.97] text-zinc-950 font-bold text-sm py-3 shadow-lg shadow-cyan-500/20 transition-all duration-200"
                    >
                      <Navigation className="h-4 w-4 fill-zinc-950" /> Fly To Building
                    </button>
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.97] text-zinc-300 hover:text-white text-xs py-2.5 transition">
                        <Heart className="h-3.5 w-3.5" /> Favorite
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-[0.97] text-zinc-300 hover:text-white text-xs py-2.5 transition">
                        <Share2 className="h-3.5 w-3.5" /> Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
