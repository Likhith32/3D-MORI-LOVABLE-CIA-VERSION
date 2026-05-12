import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Layers, Building2, Navigation as NavIcon, GraduationCap, Route, Calendar, LifeBuoy, Bookmark, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { LOCATIONS, CATEGORY_META, type Location } from "@/lib/explorer/locations";

type Props = {
  onSelect: (loc: Location) => void;
  onResetView: () => void;
};

const sections = [
  { id: "overview", label: "Campus Overview", icon: Layers },
  { id: "buildings", label: "Buildings", icon: Building2 },
  { id: "navigate", label: "Navigation", icon: NavIcon },
  { id: "departments", label: "Departments", icon: GraduationCap },
  { id: "tour", label: "Guided Tour", icon: Route },
  { id: "events", label: "Events", icon: Calendar },
  { id: "emergency", label: "Emergency", icon: LifeBuoy },
  { id: "saved", label: "Saved Places", icon: Bookmark },
];

export default function Sidebar({ onSelect, onResetView }: Props) {
  const [open, setOpen] = useState(true);
  const [active, setActive] = useState("buildings");

  return (
    <motion.aside
      initial={{ x: -30, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed left-4 top-24 bottom-4 z-20 flex"
    >
      <motion.div
        layout
        animate={{ width: open ? 300 : 64 }}
        transition={{ type: "spring", stiffness: 220, damping: 28 }}
        className="glass-strong pointer-events-auto relative flex flex-col overflow-hidden rounded-3xl"
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="absolute -right-3 top-6 z-10 grid h-7 w-7 place-items-center rounded-full bg-white shadow-md ring-1 ring-border/60 transition-transform hover:scale-110"
          aria-label="Toggle sidebar"
        >
          {open ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        </button>

        {/* Sections */}
        <div className="flex flex-col gap-1 p-3">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-medium transition-all ${
                active === id
                  ? "bg-white text-foreground shadow-sm"
                  : "text-foreground/70 hover:bg-white/60"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <AnimatePresence>
                {open && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>

        {/* Building list */}
        <AnimatePresence>
          {open && active === "buildings" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 min-h-0 overflow-y-auto px-3 pb-3"
            >
              <div className="mb-2 flex items-center justify-between px-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">All buildings</div>
                <button onClick={onResetView} className="text-[11px] font-medium text-primary hover:underline">Reset view</button>
              </div>
              <div className="space-y-1.5">
                {LOCATIONS.map((loc) => {
                  const meta = CATEGORY_META[loc.category];
                  return (
                    <button
                      key={loc.id}
                      onClick={() => onSelect(loc)}
                      className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-white/80"
                    >
                      <span className="grid h-7 w-7 place-items-center rounded-lg"
                            style={{ background: `color-mix(in oklab, ${meta.color} 25%, white)` }}>
                        <MapPin className="h-3.5 w-3.5" style={{ color: meta.ring }} />
                      </span>
                      <span className="flex-1 min-w-0">
                        <div className="truncate text-[13px] font-medium">{loc.name}</div>
                        <div className="text-[10.5px] text-muted-foreground">{meta.label}</div>
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.aside>
  );
}
