"use client";

import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface TooltipState {
  text: string;
  x: number;
  y: number;
  placement: "top" | "bottom" | "right" | "left";
}

export default function CustomTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);
  const isRecentRef = useRef<boolean>(false);
  const recentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Helper to find tooltip text from target or nearest ancestor
    const getTooltipTarget = (node: EventTarget | null): { element: HTMLElement; text: string } | null => {
      let current = node as HTMLElement | null;
      while (current && current !== document.body && current !== document.documentElement) {
        if (current.hasAttribute("data-tooltip")) {
          const text = current.getAttribute("data-tooltip")?.trim();
          if (text) return { element: current, text };
        }
        if (current.hasAttribute("title")) {
          const text = current.getAttribute("title")?.trim();
          if (text) {
            // Transfer title to data-custom-tooltip and remove title so browser default doesn't show
            current.setAttribute("data-custom-tooltip", text);
            current.removeAttribute("title");
            return { element: current, text };
          }
        }
        if (current.hasAttribute("data-custom-tooltip")) {
          const text = current.getAttribute("data-custom-tooltip")?.trim();
          if (text) return { element: current, text };
        }
        current = current.parentElement;
      }
      return null;
    };

    const updatePosition = (element: HTMLElement, text: string) => {
      const rect = element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Smart placement detection:
      // 1. Sidebar rail on the left (x < 100) -> place on 'right'
      // 2. Too close to top (y < 65) -> place on 'bottom'
      // 3. Near right edge -> clamp
      // 4. Default -> 'top'
      let placement: "top" | "bottom" | "right" | "left" = "top";
      let x = rect.left + rect.width / 2;
      let y = rect.top;

      if (rect.left < 90 && rect.top > 20 && rect.bottom < viewportHeight - 20) {
        placement = "right";
        x = rect.right + 10;
        y = rect.top + rect.height / 2;
      } else if (rect.top < 65) {
        placement = "bottom";
        x = rect.left + rect.width / 2;
        y = rect.bottom + 8;
      } else {
        placement = "top";
        x = rect.left + rect.width / 2;
        y = rect.top - 8;
      }

      // Clamp x inside viewport
      x = Math.max(70, Math.min(viewportWidth - 70, x));

      setTooltip({ text, x, y, placement });
      activeElementRef.current = element;

      // Keep recent flag warm for 500ms for instant next tooltip
      isRecentRef.current = true;
      if (recentTimeoutRef.current) clearTimeout(recentTimeoutRef.current);
      recentTimeoutRef.current = setTimeout(() => {
        isRecentRef.current = false;
      }, 500);
    };

    const handlePointerOver = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;

      const targetInfo = getTooltipTarget(e.target);
      if (!targetInfo) {
        handlePointerOut();
        return;
      }

      if (activeElementRef.current === targetInfo.element) return;

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const delay = isRecentRef.current ? 40 : 180;

      timeoutRef.current = setTimeout(() => {
        updatePosition(targetInfo.element, targetInfo.text);
      }, delay);
    };

    const handlePointerOut = (e?: PointerEvent) => {
      if (e) {
        const related = e.relatedTarget as Node | null;
        if (activeElementRef.current && related && activeElementRef.current.contains(related)) {
          return;
        }
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      activeElementRef.current = null;
      setTooltip(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handlePointerOut();
      }
    };

    const handleScroll = () => {
      if (activeElementRef.current) {
        handlePointerOut();
      }
    };

    document.addEventListener("pointerover", handlePointerOver, { capture: true, passive: true });
    document.addEventListener("pointerout", handlePointerOut, { capture: true, passive: true });
    document.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });

    return () => {
      document.removeEventListener("pointerover", handlePointerOver, { capture: true });
      document.removeEventListener("pointerout", handlePointerOut, { capture: true });
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (recentTimeoutRef.current) clearTimeout(recentTimeoutRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {tooltip && (
        <motion.div
          key={tooltip.text + tooltip.placement}
          initial={{
            opacity: 0,
            scale: 0.92,
            y: tooltip.placement === "top" ? 4 : tooltip.placement === "bottom" ? -4 : 0,
            x: tooltip.placement === "right" ? -4 : 0,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: 0,
          }}
          exit={{
            opacity: 0,
            scale: 0.94,
            transition: { duration: 0.1 },
          }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 26,
            mass: 0.6,
          }}
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            transform:
              tooltip.placement === "top"
                ? "translate(-50%, -100%)"
                : tooltip.placement === "bottom"
                ? "translate(-50%, 0)"
                : tooltip.placement === "right"
                ? "translate(0, -50%)"
                : "translate(-100%, -50%)",
            pointerEvents: "none",
            zIndex: 999999,
          }}
        >
          <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0a1120]/95 dark:bg-[#111927]/95 backdrop-blur-xl border border-white/15 shadow-[0_10px_25px_rgba(0,0,0,0.4)] text-white text-[11.5px] font-medium tracking-wide whitespace-nowrap select-none">
            {/* Subtle Brand Accent Light on top border */}
            <div className="absolute inset-x-2 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#003973] via-50% to-[#e5e5be] opacity-80 rounded-full" />

            {/* Glowing micro-dot indicator */}
            <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-[#003973] to-[#e5e5be] shadow-[0_0_8px_rgba(229,229,190,0.8)] flex-shrink-0" />

            {/* Text content */}
            <span className="leading-none text-slate-100">{tooltip.text}</span>

            {/* Micro caret / arrow */}
            {tooltip.placement === "top" && (
              <span className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#0a1120]/95 dark:bg-[#111927]/95 border-r border-b border-white/15" />
            )}
            {tooltip.placement === "bottom" && (
              <span className="absolute left-1/2 -top-1 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#0a1120]/95 dark:bg-[#111927]/95 border-l border-t border-white/15" />
            )}
            {tooltip.placement === "right" && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-[#0a1120]/95 dark:bg-[#111927]/95 border-l border-b border-white/15" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
