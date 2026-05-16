import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map as MapIcon, Check, Layers } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type LayerOption = {
  id: string;
  name: string;
  preview: React.ReactNode;
};

const layers: LayerOption[] = [
  {
    id: "satellite",
    name: "Satellite",
    preview: (
      <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-blue-900">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 30% 30%, #ffffff33 0%, transparent 70%)" }} />
      </div>
    ),
  },
  {
    id: "hybrid",
    name: "Hybrid",
    preview: (
      <div className="absolute inset-0 bg-gradient-to-br from-green-800 to-blue-900">
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-60">
          <div className="h-px w-full bg-yellow-300/50 transform rotate-45" />
          <div className="h-px w-full bg-yellow-300/50 transform -rotate-12" />
        </div>
      </div>
    ),
  },
  {
    id: "street",
    name: "Street",
    preview: (
      <div className="absolute inset-0 bg-slate-100" style={{
        backgroundImage: "linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)",
        backgroundSize: "8px 8px"
      }}>
        <div className="absolute top-1/2 w-full h-1 bg-orange-300/60" />
        <div className="absolute left-1/3 h-full w-1 bg-white border-x border-slate-300" />
      </div>
    ),
  },
  {
    id: "terrain",
    name: "Terrain",
    preview: (
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-stone-300 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-40 text-stone-400" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 20 Q 25 30 50 10 T 100 20" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M0 50 Q 25 60 50 40 T 100 50" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M0 80 Q 25 90 50 70 T 100 80" fill="none" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    ),
  },
  {
    id: "dark",
    name: "Dark",
    preview: (
      <div className="absolute inset-0 bg-slate-950" style={{
        backgroundImage: "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)",
        backgroundSize: "10px 10px"
      }}>
        <div className="absolute top-1/4 w-full h-[1px] bg-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
        <div className="absolute right-1/3 h-full w-[1px] bg-cyan-500/30" />
      </div>
    ),
  },
];

type Props = {
  currentLayer: string;
  onChange: (id: string) => void;
};

export default function LayerSwitcher({ currentLayer, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (id: string, name: string) => {
    if (id === currentLayer) return;
    onChange(id);
    toast.success(`Switched to ${name} View`);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-[320px] right-4 z-20 flex flex-col items-end gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="glass-strong mb-2 grid grid-cols-1 gap-2 rounded-2xl p-2 shadow-2xl min-w-[160px]"
          >
            <div className="px-2 py-1 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-white/10">
              Map Styles
            </div>
            {layers.map((layer) => {
              const active = currentLayer === layer.id;
              return (
                <button
                  key={layer.id}
                  onClick={() => handleSelect(layer.id, layer.name)}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl p-1.5 pr-4 transition-all duration-200",
                    active
                      ? "bg-white/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                      : "hover:bg-white/5"
                  )}
                >
                  <div
                    className={cn(
                      "relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 transition-colors duration-300",
                      active ? "border-primary shadow-[0_0_10px_rgba(34,211,238,0.4)]" : "border-white/10 group-hover:border-white/30"
                    )}
                  >
                    {layer.preview}
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {layer.name}
                  </span>
                  {active && (
                    <motion.div layoutId="active-dot" className="ml-auto">
                      <Check className="h-4 w-4 text-primary" />
                    </motion.div>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "glass-strong flex h-12 items-center justify-center gap-2 rounded-full px-4 shadow-lg transition-all",
          isOpen ? "ring-2 ring-primary/50 bg-white/10" : "hover:bg-white/10"
        )}
      >
        <Layers className={cn("h-5 w-5 transition-colors", isOpen ? "text-primary" : "text-foreground")} />
        <span className="text-sm font-medium text-foreground">Layers</span>
      </motion.button>
    </div>
  );
}
