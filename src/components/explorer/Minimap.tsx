import { motion } from "framer-motion";
import minimapImg from "@/assets/minimap.png";
import { LOCATIONS, CATEGORY_META, type Location } from "@/lib/explorer/locations";

// Bounds derived from the campus outline geojson
const BOUNDS = {
  minLon: 81.8068,
  maxLon: 81.8095,
  minLat: 16.3974,
  maxLat: 16.4007,
};

function project(lon: number, lat: number) {
  const x = ((lon - BOUNDS.minLon) / (BOUNDS.maxLon - BOUNDS.minLon)) * 100;
  const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

type Props = {
  cameraLon: number;
  cameraLat: number;
  cameraHeading: number; // radians
  onSelect: (loc: Location) => void;
};

export default function Minimap({ cameraLon, cameraLat, cameraHeading, onSelect }: Props) {
  const cam = project(cameraLon, cameraLat);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="glass-strong fixed bottom-4 right-4 z-20 w-[260px] overflow-hidden rounded-3xl p-2"
    >
      <div className="relative aspect-square overflow-hidden rounded-2xl">
        <img src={minimapImg} alt="Mori School campus minimap" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />

        {/* Markers */}
        {LOCATIONS.map((loc) => {
          const p = project(loc.lon, loc.lat);
          const meta = CATEGORY_META[loc.category];
          return (
            <button
              key={loc.id}
              title={loc.name}
              onClick={() => onSelect(loc)}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <span className="block h-2 w-2 rounded-full ring-2 ring-white"
                    style={{ background: meta.color, boxShadow: `0 0 10px ${meta.color}` }} />
            </button>
          );
        })}

        {/* Camera position */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${cam.x}%`, top: `${cam.y}%` }}
        >
          <div className="relative grid place-items-center">
            <div className="absolute h-12 w-12 rounded-full pulse-ring" />
            {/* View cone */}
            <div
              className="absolute h-16 w-16"
              style={{
                transform: `rotate(${(cameraHeading * 180) / Math.PI}deg)`,
                transition: "transform 200ms ease-out",
              }}
            >
              <div
                className="absolute left-1/2 top-1/2 h-12 w-10 -translate-x-1/2 -translate-y-full"
                style={{
                  background: "conic-gradient(from -25deg at 50% 100%, transparent 0deg, color-mix(in oklab, var(--green-glow) 60%, transparent) 25deg, transparent 50deg)",
                  filter: "blur(2px)",
                  borderRadius: "50%",
                }}
              />
            </div>
            <div className="relative h-3 w-3 rounded-full bg-white ring-4 ring-[color:var(--green-glow)]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 pt-2 pb-1">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">Live Minimap</div>
        <div className="text-[10.5px] text-muted-foreground tabular-nums">
          {cameraLat.toFixed(4)}°N · {cameraLon.toFixed(4)}°E
        </div>
      </div>
    </motion.div>
  );
}
