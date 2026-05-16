import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Map as MapIcon,
  RotateCw,
  Navigation,
  Move,
  Sunrise,
  Moon,
  ChevronDown,
  Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = {
  id: string;
  label: string;
  icon: any;
};

const modes: ViewMode[] = [
  { id: "cinematic", label: "Cinematic Drone", icon: Video },
  { id: "top", label: "Plan View", icon: MapIcon },
  { id: "orbit", label: "Orbit Spin", icon: RotateCw },
  { id: "street", label: "Eye Level", icon: Navigation },
  { id: "free", label: "Free Move", icon: Move },
  { id: "sunset", label: "Golden Hour", icon: Sunrise },
  { id: "night", label: "Night Sky", icon: Moon },
];

type Props = {
  activeMode: string;
  onModeChange: (id: string) => void;
};

export default function ViewController({ activeMode, onModeChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const active = modes.find((m) => m.id === activeMode) || modes[0];
  const ActiveIcon = active.icon;

  return (
    <div className="fixed right-4 top-[85px] z-20 flex flex-col items-end gap-2">
      <motion.div
        layout
        className="glass-strong relative overflow-hidden rounded-3xl shadow-xl"
      >
        <div className="flex flex-col">
          {/* Main Active Button */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-3 p-3 pr-4 text-left transition-colors hover:bg-white/10"
          >
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_0_15px_rgba(34,211,238,0.4)]">
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">View Mode</span>
              <span className="text-[13px] font-semibold">{active.label}</span>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              className="ml-2 text-muted-foreground"
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </button>

          {/* Dropdown List */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/10 bg-black/5 overflow-hidden"
              >
                <div className="p-1.5 flex flex-col gap-1">
                  {modes.map((mode) => {
                    const isCurrent = activeMode === mode.id;
                    const Icon = mode.icon;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          onModeChange(mode.id);
                          setExpanded(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 w-full rounded-xl px-2.5 py-2 text-left transition-all",
                          isCurrent
                            ? "bg-white text-foreground shadow-sm"
                            : "hover:bg-white/20 text-foreground/80"
                        )}
                      >
                        <div className={cn(
                          "grid h-8 w-8 place-items-center rounded-lg shrink-0",
                          isCurrent ? "bg-primary/10 text-primary" : "bg-white/10"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[13px] font-medium">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
