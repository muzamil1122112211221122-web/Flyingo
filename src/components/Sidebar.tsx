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

  const navBtn = (iconOrSrc: string, route: string, label: string, isPng?: boolean, badge?: string) => {
    const active = isActive(route);
    return (
      <motion.button
        key={route}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => router.push(route)}
        title={label}
        className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
          active
            ? "bg-primary text-white shadow-md shadow-primary/25"
            : "text-on-surface-variant dark:text-white hover:bg-surface-container-high hover:text-on-surface"
        }`}
      >
        {isPng ? (
          <img
            src={iconOrSrc}
            alt={label}
            className={`w-6 h-6 object-contain transition-all duration-200 ${
              active
                ? "brightness-0 invert"
                : "opacity-80 group-hover:opacity-100 dark:brightness-0 dark:invert"
            }`}
          />
        ) : (
          <span
            className={`material-symbols-outlined text-[22px] ${active ? "text-white" : "text-on-surface-variant dark:text-white"}`}
            style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
          >
            {iconOrSrc}
          </span>
        )}
        {badge && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface-container-low" />
        )}
      </motion.button>
    );
  };

  return (
    <>
      {/* Desktop Vertical Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-[72px] bg-surface-container-low/90 backdrop-blur-xl z-50 flex-col items-center justify-between py-5 shadow-[0_1px_8px_rgba(0,0,0,0.06)] border-r border-outline-variant/10">
        {/* Top: Logo */}
        <div className="flex flex-col items-center w-full">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => router.push("/chat")}
            className="w-11 h-11 rounded-full overflow-hidden shadow-md shadow-primary/20 flex items-center justify-center p-0.5 bg-surface-container-high cursor-pointer"
            title="Flyingo"
          >
            <img src="/flyingo-logo.png" alt="Flyingo" className="w-full h-full object-cover rounded-full" />
          </motion.button>
        </div>

        {/* Middle: Main Navigation Tabs Centered at Y-level */}
        <nav className="flex flex-col items-center gap-3 w-full px-2 my-auto">
          {navBtn("/icons/nav-chat.png", "/chat", "Direct Chats", true)}
          {navBtn("/icons/nav-flamingoos.png", "/flamingoos", "Flamingoos", true, "badge")}
          {navBtn("/icons/nav-search.png", "/search", "Global Search", true)}
          {navBtn("/icons/nav-notes.png", "/notes", "Notes", true)}
        </nav>

        {/* Bottom */}
        <div className="flex flex-col items-center gap-3 w-full px-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push("/admin")}
            title="Admin Portal"
            className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isActive("/admin")
                ? "bg-secondary text-white shadow-md shadow-secondary/30"
                : "text-on-surface-variant/70 dark:text-white hover:text-secondary hover:bg-surface-container"
            }`}
          >
            <img
              src="/icons/nav-admin.png"
              alt="Admin"
              className={`w-5 h-5 object-contain transition-all ${
                isActive("/admin")
                  ? "brightness-0 invert"
                  : "opacity-80 hover:opacity-100 dark:brightness-0 dark:invert"
              }`}
            />
            <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-secondary opacity-70" />
          </motion.button>

          {navBtn("settings", "/settings", "Application Settings")}

          {/* Profile avatar */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => router.push("/profile")}
            title="My Profile"
            className={`relative w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all ${
              isActive("/profile")
                ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-low"
                : ""
            }`}
            style={{ background: userAvatar ? "transparent" : "linear-gradient(135deg, #7d2dce, #b70942)" }}
          >
            {userAvatar ? (
              <img src={userAvatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-white font-bold text-sm">
                {userInitials}
              </span>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-tertiary border-2 border-surface-container-low" />
          </motion.button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      {!hideBottomNav && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/10 z-40 flex items-center justify-around px-1.5 shadow-lg">
          {navBtn("/icons/nav-chat.png", "/chat", "Direct Chats", true)}
          {navBtn("/icons/nav-flamingoos.png", "/flamingoos", "Flamingoos", true, "badge")}
          {navBtn("/icons/nav-search.png", "/search", "Global Search", true)}
          {navBtn("/icons/nav-notes.png", "/notes", "Notes", true)}
          {navBtn("/icons/nav-admin.png", "/admin", "Admin Gateway", true)}
          {navBtn("settings", "/settings", "Settings")}
        </nav>
      )}
    </>
  );
}
