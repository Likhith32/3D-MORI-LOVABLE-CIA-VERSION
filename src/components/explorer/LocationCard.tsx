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
  return (
    <AnimatePresence>
      {location && (
        <motion.div
          key={location.id}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-4 left-1/2 z-30 w-[min(440px,calc(100vw-2rem))] -translate-x-1/2"
        >
          <div className="glass-strong overflow-hidden rounded-3xl">
            {/* Hero image or gradient */}
            <div className={cn("relative overflow-hidden", location.image ? "h-48" : "h-28")}>
              {location.image ? (
                <>
                  <img
                    src={location.image}
                    alt={location.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </>
              ) : (
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(120% 100% at 0% 0%, ${CATEGORY_META[location.category].color} 0%, transparent 60%), linear-gradient(135deg, color-mix(in oklab, ${CATEGORY_META[location.category].color} 30%, white), white)`,
                  }}
                />
              )}
              <div className="absolute inset-0 backdrop-blur-[1px]" />
              <button
                onClick={onClose}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-white/90 backdrop-blur-md transition hover:bg-black/40"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute left-4 bottom-3 flex items-center gap-2">
                <span className={cn(
                  "grid h-9 w-9 place-items-center rounded-2xl shadow-sm",
                  location.image ? "bg-white/95" : "bg-white/85"
                )}>
                  <MapPin className="h-4 w-4" style={{ color: CATEGORY_META[location.category].ring }} />
                </span>
                <div>
                  <div className={cn(
                    "text-[11px] font-bold uppercase tracking-wider",
                    location.image ? "text-white drop-shadow-sm" : "text-foreground/60"
                  )}>
                    {CATEGORY_META[location.category].label}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-3">
              <h3 className="text-[19px] font-semibold tracking-tight">{location.name}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground text-balance">
                {location.description}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-[11.5px] text-foreground/70">
                {location.hours && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1">
                    <Clock className="h-3 w-3" /> {location.hours}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1">
                  <Footprints className="h-3 w-3" /> ~{Math.round(distanceMeters(CAMPUS_CENTER, location) / 80)} min walk
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => onNavigate(location)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition-transform hover:scale-[1.02]"
                >
                  <Navigation className="h-4 w-4" /> Navigate
                </button>
                <button className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-foreground/70 transition hover:bg-white">
                  <Heart className="h-4 w-4" />
                </button>
                <button className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-foreground/70 transition hover:bg-white">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
