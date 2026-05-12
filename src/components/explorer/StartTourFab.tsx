import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function StartTourFab({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      onClick={onClick}
      className="glass-strong glow-ring fixed left-1/2 top-[88px] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold transition-transform hover:scale-105"
    >
      <Sparkles className="h-4 w-4" style={{ color: "var(--green-glow)" }} />
      Start Cinematic Tour
    </motion.button>
  );
}
