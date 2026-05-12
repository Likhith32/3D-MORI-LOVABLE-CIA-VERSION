import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState, useRef, useEffect } from "react";
import { Search, Compass, Route, MapPin, Calendar, Bell, User, Settings, Sparkles } from "lucide-react";
import { LOCATIONS, CATEGORY_META, type Location } from "@/lib/explorer/locations";

type Props = {
  onSelect: (loc: Location) => void;
  onStartTour: () => void;
};

export default function Navbar({ onSelect, onStartTour }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return LOCATIONS.slice(0, 6);
    return LOCATIONS.filter((l) =>
      l.name.toLowerCase().includes(s) || l.category.includes(s),
    ).slice(0, 8);
  }, [q]);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const navItems = [
    { icon: Compass, label: "Explore" },
    { icon: Route, label: "Tour", onClick: onStartTour },
    { icon: MapPin, label: "Navigate" },
    { icon: Calendar, label: "Events" },
    { icon: Bell, label: "Alerts" },
    { icon: User, label: "Profile" },
    { icon: Settings, label: "Settings" },
  ];

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 top-4 z-30 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex w-full max-w-[1400px] items-center gap-3">
        {/* Logo */}
        <div className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-2.5">
          <div className="relative grid h-9 w-9 place-items-center rounded-xl"
               style={{ background: "var(--gradient-aurora)" }}>
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2.4} />
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold tracking-tight">Mori School Explorer</div>
            <div className="text-[11px] text-muted-foreground -mt-0.5">Interactive Digital Campus</div>
          </div>
        </div>

        {/* Dynamic Island Search */}
        <div ref={wrapRef} className="relative flex-1 max-w-[520px] mx-auto">
          <motion.div
            layout
            className="glass-strong flex items-center gap-2 rounded-full px-4 py-2.5"
          >
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Search buildings, places, departments…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:block rounded-md border border-border/60 bg-white/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
          </motion.div>

          <AnimatePresence>
            {open && results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="glass-strong absolute left-0 right-0 mt-2 overflow-hidden rounded-2xl p-1.5"
              >
                {results.map((r) => {
                  const meta = CATEGORY_META[r.category];
                  return (
                    <button
                      key={r.id}
                      onClick={() => { onSelect(r); setOpen(false); setQ(""); }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-white/70"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg"
                            style={{ background: `color-mix(in oklab, ${meta.color} 22%, white)` }}>
                        <MapPin className="h-4 w-4" style={{ color: meta.ring }} />
                      </span>
                      <span className="flex-1">
                        <div className="text-sm font-medium">{r.name}</div>
                        <div className="text-[11px] text-muted-foreground">{meta.label}</div>
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right nav */}
        <div className="glass-strong hidden md:flex items-center gap-1 rounded-2xl px-2 py-1.5">
          {navItems.map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="group flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-medium text-foreground/80 transition-all hover:bg-white/70 hover:text-foreground"
              title={label}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </motion.header>
  );
}
