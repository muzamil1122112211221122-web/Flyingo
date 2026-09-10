"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Storage } from "@/lib/storage";

export default function Sidebar({ hideBottomNav = false }: { hideBottomNav?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const [userInitials, setUserInitials] = useState("U");
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    const u = Storage.getCurrentUser();
    if (u) {
      if (u.name || u.handle) {
        setUserInitials((u.name || u.handle || "U").substring(0, 2).toUpperCase());
      }
      if (u.avatar) {
        setUserAvatar(u.avatar);
      }
    }
  }, []);

  const isActive = (p: string) => path.startsWith(p);

  const navBtn = (iconOrSrc: string, route: string, label: string, isMobile = false, isPng?: boolean, badge?: string) => {
    const active = isActive(route);
    return (
      <motion.button
        key={route}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => router.push(route)}
        title={label}
        className={`relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
          active
            ? "text-white"
            : "text-on-surface-variant dark:text-white/80 hover:bg-surface-container/60 hover:text-on-surface"
        }`}
      >
        {/* Smooth Sliding Background Pill (Instagram Style) */}
        {active && (
          <motion.div
            layoutId={isMobile ? "mobileNavSlidingPill" : "desktopNavSlidingPill"}
            className="absolute inset-0 rounded-full bg-user-gradient shadow-md shadow-[#003973]/35 z-0"
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 32,
            }}
          />
        )}

        <div className="relative z-10 flex items-center justify-center pointer-events-none">
          {isPng ? (
            <img
              src={iconOrSrc}
              alt={label}
              className={`w-5 h-5 object-contain transition-all duration-200 ${
                active
                  ? "brightness-0 invert scale-105"
                  : "opacity-80 group-hover:opacity-100 dark:brightness-0 dark:invert"
              }`}
            />
          ) : (
            <span
              className={`material-symbols-outlined text-[22px] transition-transform ${active ? "text-white scale-105" : "text-on-surface-variant dark:text-white"}`}
              style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
            >
              {iconOrSrc}
            </span>
          )}
        </div>
        {badge && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface-container-lowest z-20" />
        )}
      </motion.button>
    );
  };

  return (
    <>
      {/* Desktop Vertical Floating Pill Sidebar */}
      <aside className="hidden md:flex fixed left-3.5 top-4 bottom-4 w-[68px] bg-surface-container-lowest/85 dark:bg-[#101626]/90 backdrop-blur-2xl z-50 flex-col items-center justify-between py-4 rounded-[32px] shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35)] border border-outline-variant/15 dark:border-white/10 transition-all">
        {/* Top: Logo */}
        <div className="flex flex-col items-center w-full">
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => router.push("/chat")}
            className="w-11 h-11 rounded-full overflow-hidden shadow-md shadow-[#003973]/25 flex items-center justify-center cursor-pointer p-0.5 border border-outline-variant/20"
            title="Flyingo"
          >
            <img src="/logo.png" alt="Flyingo" className="w-full h-full object-cover rounded-full" />
          </motion.button>
        </div>

        {/* Middle: Main Navigation Tabs Centered */}
        <nav className="flex flex-col items-center gap-2.5 w-full px-1.5 my-auto">
          {navBtn("/icons/nav-chat.png", "/chat", "Direct Chats", false, true)}
          {navBtn("/icons/nav-flamingoos.png", "/flamingoos", "Flamingoos", false, true, "badge")}
          {navBtn("/icons/nav-search.png", "/search", "Global Search", false, true)}
          {navBtn("/icons/nav-notes.png", "/notes", "Notes", false, true)}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col items-center gap-2.5 w-full px-1.5">
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => router.push("/admin")}
            title="Admin Portal"
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isActive("/admin")
                ? "bg-secondary text-white shadow-md shadow-secondary/30 scale-105"
                : "text-on-surface-variant/70 dark:text-white hover:text-secondary hover:bg-surface-container"
            }`}
          >
            <img
              src="/icons/nav-admin.png"
              alt="Admin"
              className={`w-4.5 h-4.5 object-contain transition-all ${
                isActive("/admin")
                  ? "brightness-0 invert"
                  : "opacity-80 hover:opacity-100 dark:brightness-0 dark:invert"
              }`}
            />
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-secondary opacity-70" />
          </motion.button>

          {navBtn("settings", "/settings", "Application Settings", false)}

          {/* Profile avatar */}
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => router.push("/profile")}
            title="My Profile"
            className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${
              isActive("/profile")
                ? "ring-2 ring-[#003973] ring-offset-2 ring-offset-surface-container-lowest scale-105"
                : ""
            }`}
            style={{ background: userAvatar ? "transparent" : "linear-gradient(135deg, #003973, #e5e5be)" }}
          >
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-white font-bold text-sm">
                {userInitials}
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary border-2 border-surface-container-lowest" />
          </motion.button>
        </div>
      </aside>

      {/* Mobile Floating Pill Bottom Navigation Bar */}
      {!hideBottomNav && (
        <nav className="md:hidden fixed bottom-3 left-3 right-3 max-w-md mx-auto h-[62px] bg-surface-container-lowest/90 dark:bg-[#101626]/92 backdrop-blur-2xl rounded-full border border-outline-variant/15 dark:border-white/10 z-40 flex items-center justify-around px-2 shadow-[0_10px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.45)]">
          {navBtn("/icons/nav-chat.png", "/chat", "Direct Chats", true, true)}
          {navBtn("/icons/nav-flamingoos.png", "/flamingoos", "Flamingoos", true, true, "badge")}
          {navBtn("/icons/nav-search.png", "/search", "Global Search", true, true)}
          {navBtn("/icons/nav-notes.png", "/notes", "Notes", true, true)}
          {navBtn("/icons/nav-admin.png", "/admin", "Admin Gateway", true, true)}
          {navBtn("settings", "/settings", "Settings", true)}
        </nav>
      )}
    </>
  );
}
