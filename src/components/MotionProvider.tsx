"use client";
import { MotionConfig } from "framer-motion";

/**
 * Global Framer Motion config — sets smooth spring defaults for
 * ALL motion elements across the entire app.
 * Individual components can still override with their own `transition` prop.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      transition={{
        type: "spring",
        stiffness: 340,
        damping: 22,
        mass: 0.75,
      }}
    >
      {children}
    </MotionConfig>
  );
}
