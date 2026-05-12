import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { LOCATIONS, TOUR_STOPS, CATEGORY_META } from "@/lib/explorer/locations";
import type { Location } from "@/lib/explorer/locations";

type Props = {
  active: boolean;
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  onGo: (loc: Location) => void;
};

export default function TourPanel({ active, index, onPrev, onNext, onClose, onGo }: Props) {
  const stop = LOCATIONS.find((l) => l.id === TOUR_STOPS[index]);

  useEffect(() => {
    if (active && stop) onGo(stop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, index]);

  return (
    <AnimatePresence>
      {active && stop && (
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed right-4 top-24 z-30 w-[340px]"
        >
          <div className="glass-strong overflow-hidden rounded-3xl">
            <div className="relative h-32 overflow-hidden"
                 style={{ background: `linear-gradient(135deg, ${CATEGORY_META[stop.category].color}, color-mix(in oklab, ${CATEGORY_META[stop.category].color} 30%, white))` }}>
              <div className="absolute inset-0 backdrop-blur-[1px]" />
              <button
                onClick={onClose}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/85 transition hover:bg-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute left-4 top-3 flex items-center gap-2 rounded-full bg-white/85 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider">
                <Play className="h-3 w-3 text-primary" />
                Guided Tour
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <div className="text-[10.5px] font-medium text-white/90">
                  Stop {index + 1} of {TOUR_STOPS.length}
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/30">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    initial={false}
                    animate={{ width: `${((index + 1) / TOUR_STOPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-[18px] font-semibold tracking-tight">{stop.name}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground text-balance">
                {stop.description}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={onPrev}
                  disabled={index === 0}
                  className="grid h-10 w-10 place-items-center rounded-2xl bg-white/80 transition disabled:opacity-40 hover:bg-white"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={onNext}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-2.5 text-[13px] font-semibold text-background transition-transform hover:scale-[1.02]"
                >
                  {index === TOUR_STOPS.length - 1 ? "Finish" : "Next"} <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="rounded-2xl px-3 py-2.5 text-[12px] font-medium text-muted-foreground hover:text-foreground"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
