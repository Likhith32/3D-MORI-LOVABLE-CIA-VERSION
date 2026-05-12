import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Cloud, Sun, Wind } from "lucide-react";

export default function SmartHud() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(t);
  }, []);

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-4 left-4 z-20 flex flex-col gap-2"
    >
      <div className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl"
             style={{ background: "linear-gradient(135deg, oklch(0.85 0.15 90), oklch(0.78 0.18 60))" }}>
          <Sun className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tabular-nums">28°C · Clear</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Wind className="h-3 w-3" /> 8 km/h · Mori Village
          </div>
        </div>
      </div>
      <div className="glass-strong flex items-center gap-3 rounded-2xl px-4 py-2.5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-foreground text-background">
          <Cloud className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-semibold tabular-nums">{time}</div>
          <div className="text-[11px] text-muted-foreground">{date}</div>
        </div>
      </div>
    </motion.div>
  );
}
