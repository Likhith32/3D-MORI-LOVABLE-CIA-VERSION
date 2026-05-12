import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function LoadingVeil({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-50 grid place-items-center"
          style={{ background: "linear-gradient(160deg, oklch(0.97 0.02 160), oklch(0.94 0.03 200))" }}
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-3xl glow-ring"
              style={{ background: "var(--gradient-aurora)" }}
            >
              <Sparkles className="h-7 w-7 text-white" />
            </motion.div>
            <div className="text-[15px] font-semibold tracking-tight">Mori School Explorer</div>
            <div className="mt-1 text-[12px] text-muted-foreground">Composing your cinematic campus…</div>
            <div className="mx-auto mt-5 h-1 w-40 overflow-hidden rounded-full bg-white/60">
              <motion.div
                className="h-full"
                style={{ background: "var(--gradient-aurora)" }}
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
